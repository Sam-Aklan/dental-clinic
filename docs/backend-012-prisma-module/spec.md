# Spec: PrismaModule (`backend/src/prisma/`)

**Type**: Backend NestJS Infrastructure Module  
**Plan reference**: [BACKEND_PLAN.md - section 12 PrismaModule](../../BACKEND_PLAN.md#12-prismamodule)  
**Frontend specs consumed**:
- All frontend pages that call REST or Socket.IO-backed workflows depend indirectly on Prisma-backed data through their owning backend modules.

> **Frontend implementation status**: User confirmed on 2026-05-06 that the corresponding frontend pages are not in place yet. Phase 4 is therefore a database/API readiness handoff for future frontend implementation, not a direct page wiring task.

---

## Overview

PrismaModule owns the application database client and connection lifecycle for PostgreSQL. It exposes a single injectable `PrismaService` that extends `PrismaClient`, connects during NestJS module startup, disconnects during shutdown, and provides safe transaction access for feature modules.

All PrismaModule behavior:

1. Centralizes PrismaClient construction so feature modules do not instantiate their own clients.
2. Uses `DATABASE_URL` from environment configuration.
3. Connects once during `onModuleInit()` and disconnects during `onModuleDestroy()`.
4. Enables graceful shutdown in the NestJS app bootstrap path.
5. Keeps database timestamps in UTC and leaves clinic timezone handling to feature services.
6. Does not expose HTTP endpoints.
7. Does not contain business-specific validation beyond database connection and transaction boundaries.

---

## Phase 1 - DTOs, Validation & Database Contracts

### 1.1 File Map

```
backend/src/prisma/
|-- prisma.module.ts
|-- prisma.service.ts
`-- prisma.types.ts

backend/prisma/
|-- schema.prisma
`-- migrations/
```

### 1.2 Public Provider Contract

`PrismaService` is the only exported provider from `PrismaModule`.

```typescript
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

```typescript
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void>;
  async onModuleDestroy(): Promise<void>;
  async enableShutdownHooks(app: INestApplication): Promise<void>;
}
```

Acceptance criteria:

- Feature modules inject `PrismaService`; they never instantiate `PrismaClient` directly.
- `PrismaModule` can be imported once in `AppModule` and reused across feature modules.
- The service is compatible with NestJS testing modules where Prisma methods are mocked.
- App shutdown closes the Prisma connection pool without hanging the process.

### 1.3 DTO Policy

PrismaModule itself has no HTTP controller and therefore no request DTOs.

Validation responsibility is split as follows:

| Layer | Responsibility |
|---|---|
| Feature module DTOs | Validate and transform incoming HTTP request data before service execution |
| Feature services | Enforce business rules and authorization-scoped query construction |
| Prisma schema | Enforce required fields, relations, enums, unique constraints, and indexes |
| PrismaModule | Validate database lifecycle and expose a safe shared client |

Acceptance criteria:

- Do not add PrismaModule HTTP DTO files only for symmetry with other modules.
- All user input validation remains in the owning feature modules.
- Prisma schema constraints must mirror business-critical invariants that cannot rely on controller validation alone.
- Prisma exceptions are translated by the calling feature module or common exception layer into standard API errors.

### 1.4 Environment Validation

`DATABASE_URL` is required in every environment that boots the backend.

Expected format:

```env
DATABASE_URL=postgresql://dental:dental@localhost:5432/dental
```

Validation requirements:

- Startup fails fast if `DATABASE_URL` is missing.
- Local development uses the `.env` value documented in `backend/.env.example`.
- Tests use an isolated test database URL and never point at production data.
- Production migrations use `pnpm prisma migrate deploy`, not `migrate dev`.
- Database credentials are never logged.

### 1.5 Prisma Schema Contract

The initial schema must include the entities listed in [BACKEND_PLAN.md - Prisma Schema](../../BACKEND_PLAN.md#prisma-schema):

| Area | Models |
|---|---|
| Identity | `User`, `RefreshToken`, `PasswordResetToken`, `DoctorProfile`, `PatientProfile` |
| Clinic setup | `ClinicConfig`, `WorkingHour`, `Holiday`, `DoctorScheduleOverride` |
| Scheduling | `Appointment` |
| Waitlist | `WaitlistEntry`, `WaitlistOffer` |
| Auditing | `AuditLog` |

Schema acceptance criteria:

- Enum values match backend DTOs and frontend contracts exactly: roles, appointment statuses, and waitlist offer statuses.
- Required relations use explicit foreign keys and deletion behavior is intentional.
- Unique constraints protect critical invariants such as email uniqueness and active appointment slot conflicts.
- Indexes support high-traffic query paths such as appointment date ranges, doctor schedules, waitlist lookup, refresh token lookup, and audit filters.
- `createdAt` and `updatedAt` are stored as UTC timestamps.
- Nullable fields are used only where the workflow explicitly allows missing data.

### 1.6 Error Mapping Expectations

Prisma errors should not leak raw database details to API clients.

| Prisma Error | API Handling |
|---|---|
| `P2002` unique constraint violation | `409 Conflict` with a domain-specific message |
| `P2025` record not found | `404 Not Found` where the operation targets a resource |
| Connection initialization failure | Startup failure with internal logs only |
| Transaction failure | Domain-specific `409`, `400`, or `500` depending on cause |

Acceptance criteria:

- Feature modules catch or allow a shared exception layer to map known Prisma errors.
- API responses follow the standard error format from `BACKEND_PLAN.md`.
- Logs include operation context without credentials or raw tokens.

---

## Phase 2 - Service Lifecycle & Backend Integration

### 2.1 Connection Lifecycle

`PrismaService.onModuleInit()` calls `$connect()` once during application startup.

`PrismaService.onModuleDestroy()` calls `$disconnect()` during shutdown.

Acceptance criteria:

- Backend startup fails if the database cannot be reached.
- Shutdown releases the Prisma connection pool.
- Lifecycle methods are idempotent enough for NestJS test module setup and teardown.
- Connection logging is minimal and does not include `DATABASE_URL`.

### 2.2 Graceful Shutdown Hook

The app bootstrap should call `prismaService.enableShutdownHooks(app)` if this pattern is used by the generated NestJS/Prisma version.

Acceptance criteria:

- SIGTERM and SIGINT allow NestJS to close cleanly.
- Test processes do not hang because of open Prisma connections.
- The implementation follows the installed Prisma version's supported shutdown event API.

### 2.3 Transactions

Feature modules use Prisma transactions for multi-row workflows.

Required transactional workflows:

| Module | Transaction Use Case |
|---|---|
| AuthModule | Register user + patient profile; rotate refresh tokens; reset password + invalidate tokens |
| DoctorsModule | Create user + doctor profile |
| AppointmentsModule | Idempotent booking; rescheduling; cancellation with related side effects |
| WaitlistModule | Accept offer by canceling old appointment, creating new appointment, and removing waitlist entry |
| WaitlistOfferEngineModule | Create/expire/advance offers consistently |
| ClinicConfigModule | Replace full working-hours week |

Acceptance criteria:

- Use interactive transactions only when the workflow requires dependent reads and writes.
- Keep transactions short and avoid network calls inside transactions.
- Queue jobs and email notifications are created after the database state commits, unless an outbox pattern is later adopted.
- Transaction code receives the transaction client instead of using the root client inside the transaction callback.

### 2.4 Migration Workflow

Development migration command:

```bash
pnpm prisma migrate dev --name init
```

Production migration command:

```bash
pnpm prisma migrate deploy
```

Acceptance criteria:

- The initial migration creates all planned schema entities.
- Generated Prisma Client is refreshed after schema changes.
- Migration files are committed with schema changes.
- Destructive migration changes require explicit review before applying to shared environments.

### 2.5 Seeding Support

If seed data is added, it should be deterministic and safe for development only.

Recommended seed contents:

- One admin user.
- One receptionist user.
- One doctor user with `DoctorProfile`.
- One patient user with `PatientProfile`.
- Default clinic config, working hours, and a small appointment fixture set.

Acceptance criteria:

- Seed scripts never run automatically in production.
- Seed credentials are development-only and documented outside production config.
- Tests own their own fixtures and do not depend on mutable local development seed data.

---

## Phase 3 - Unit Testing & E2E Testing

### 3.1 Unit Tests

Add `prisma.service.spec.ts`.

Service test cases:

| Case | Expected Result |
|---|---|
| `onModuleInit()` is called | `$connect()` is invoked exactly once |
| `onModuleDestroy()` is called | `$disconnect()` is invoked exactly once |
| `$connect()` rejects | Startup error propagates to NestJS bootstrap |
| `$disconnect()` rejects | Error is observable in test and can be logged by caller/bootstrap |
| `enableShutdownHooks()` is used, if supported | App close handler is registered without leaking credentials |
| Feature service test module injects mocked PrismaService | Tests can replace PrismaService with a mock provider |

Mocking requirements:

- Unit tests should not connect to a real database.
- Mock `$connect`, `$disconnect`, and any Prisma model delegates used by dependent service tests.
- Use narrow mocks per feature service test instead of a large global fake database.

### 3.2 Feature Service Unit Testing With Prisma

Every feature module that uses Prisma should include service unit tests for query construction and Prisma error mapping.

Minimum coverage expectations:

| Module | Prisma-Focused Cases |
|---|---|
| AuthModule | Email uniqueness, profile creation transaction, refresh token rotation |
| UsersModule | Pagination/filter query construction, disable user update |
| DoctorsModule | Public listing filters, schedule override writes |
| ClinicConfigModule | Singleton config upsert, full working-hours replacement |
| AppointmentsModule | Slot conflict handling, idempotency lookup, status updates |
| WaitlistModule | Unique patient/doctor entry, offer accept transaction |
| AnalyticsModule | Aggregation filters and role-scoped query construction |
| AuditModule | Audit insert and filtered list query construction |

Acceptance criteria:

- Known Prisma errors are asserted as domain-specific exceptions.
- Date range filters are tested with UTC boundaries.
- Transaction callbacks receive and use the transaction client.

### 3.3 E2E Tests

PrismaModule e2e coverage is exercised through real backend flows against an isolated PostgreSQL test database.

Required e2e scenarios:

1. App boots successfully with a valid `DATABASE_URL` and applied migrations.
2. App startup fails clearly when `DATABASE_URL` is missing or invalid.
3. Health or root endpoint can respond after Prisma connects.
4. Register flow persists `User` and `PatientProfile` rows.
5. Doctor creation persists linked `User` and `DoctorProfile` rows.
6. Appointment booking persists one appointment and rejects duplicate active slot conflicts.
7. Waitlist offer accept performs the expected multi-row transaction atomically.
8. Audit-generating staff action persists an `AuditLog` row.
9. Test teardown disconnects Prisma and leaves no hanging handles.

Test data requirements:

- Use a dedicated test database configured through `DATABASE_URL` or `DATABASE_URL_TEST` according to the backend test harness.
- Apply migrations before e2e tests run.
- Clean database state between test files or run each file in an isolated schema/database.
- Avoid relying on local development seed data.

Commands:

```bash
pnpm test
pnpm test:e2e
```

---

## Phase 4 - Frontend Integration

### 4.1 Current Status

The user confirmed the corresponding frontend pages are not implemented yet. PrismaModule has no direct frontend route or API endpoint; frontend integration depends on feature modules exposing stable API contracts backed by the Prisma schema.

Integration should therefore proceed in this order:

1. Finalize the Prisma schema and initial migration.
2. Implement backend feature modules against `PrismaService`.
3. Verify Swagger contracts for feature endpoints that frontend pages will consume.
4. Implement frontend pages from their existing specs.
5. Wire frontend API clients to the feature endpoints once backend contracts are stable.

### 4.2 Frontend-Visible Data Contract Dependencies

Frontend pages depend on Prisma-backed response shapes through these modules:

| Frontend Area | Backend Module | Prisma Dependency |
|---|---|---|
| Auth pages | AuthModule | `User`, `PatientProfile`, `RefreshToken`, `PasswordResetToken` |
| Booking page | DoctorsModule, ClinicConfigModule, AppointmentsModule | `DoctorProfile`, `ClinicConfig`, `WorkingHour`, `Holiday`, `DoctorScheduleOverride`, `Appointment` |
| My appointments | AppointmentsModule | `Appointment`, related doctor and patient data |
| Waitlist pages | WaitlistModule, WaitlistOfferEngineModule | `WaitlistEntry`, `WaitlistOffer`, `Appointment` |
| Staff queue | QueueModule, AppointmentsModule | `Appointment`, doctor-scoped queue status data |
| Admin/receptionist dashboards | AnalyticsModule | Aggregated `Appointment`, `User`, `DoctorProfile`, `WaitlistEntry` data |
| Clinic settings | ClinicConfigModule | `ClinicConfig`, `WorkingHour`, `Holiday` |
| Users/doctors admin | UsersModule, DoctorsModule | `User`, `DoctorProfile`, `PatientProfile` |
| Audit log | AuditModule | `AuditLog`, related actor data |

### 4.3 Frontend Integration Acceptance Criteria

- [ ] Prisma schema enum values match the frontend TypeScript unions used by page specs.
- [ ] API responses hide internal-only fields such as password hashes, token hashes, and reset tokens.
- [ ] All date/time fields returned to frontend are ISO 8601 strings.
- [ ] Pagination metadata is consistent across Prisma-backed list endpoints.
- [ ] Unique constraint conflicts return stable `409` errors that forms can render.
- [ ] Missing records return stable `404` errors that pages can route to empty/error states.
- [ ] Frontend pages can be implemented without direct knowledge of Prisma model names.
- [ ] `pnpm test`, `pnpm test:e2e`, and frontend build pass once corresponding pages are implemented.

---

## Edge Cases

- Database is unavailable at startup: app fails fast instead of serving partial functionality.
- Database disconnects during a request: feature module returns a standardized `500` while logs keep internal detail.
- Unique constraint conflicts happen under concurrent booking: feature module maps the Prisma error to `409 Conflict`.
- Transaction partially fails: no partial data is committed.
- Test suite leaves open handles: Prisma disconnects during teardown.
- Migration drift exists between schema and database: startup or deployment pipeline fails before serving traffic.
- Frontend expects an enum value not present in Prisma schema: treat as a contract mismatch and update one side before release.

---

## Acceptance Criteria

- [ ] `PrismaModule` exports one shared `PrismaService` provider.
- [ ] `PrismaService` extends `PrismaClient` and implements startup/shutdown lifecycle hooks.
- [ ] Feature modules inject `PrismaService` instead of creating `PrismaClient` instances.
- [ ] `DATABASE_URL` is required and validated before serving requests.
- [ ] Initial Prisma schema and migration cover all planned backend models.
- [ ] Known Prisma errors are mapped to standard API errors by feature modules or the common error layer.
- [ ] Unit tests cover connection lifecycle and PrismaService mocking strategy.
- [ ] E2E tests verify real database connectivity, migrations, persistence flows, conflicts, transactions, and teardown.
- [ ] Frontend integration remains contract-first until the corresponding frontend pages are implemented.
