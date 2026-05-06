# Spec: AuditModule (`backend/src/audit/`)

**Type**: Backend NestJS Module  
**Plan reference**: [BACKEND_PLAN.md - section 11 AuditModule](../../BACKEND_PLAN.md#11-auditmodule)  
**Frontend specs consumed**:
- [022-audit-log-page](../022-audit-log-page/spec.md) - admin read-only audit log table, filters, pagination, and payload details

> **Frontend implementation status**: User confirmed on 2026-05-05 that the corresponding frontend audit pages are not in place yet. Phase 4 is therefore a contract-first handoff for future frontend implementation.

---

## Overview

AuditModule owns the immutable audit trail for privileged state-changing actions. It provides an internal write API used by other backend modules and a read-only admin endpoint for investigating who changed what, when, and against which entity.

All audit behavior:

1. Records every state-changing action performed by `ADMIN`, `RECEPTIONIST`, or `DOCTOR` roles.
2. Does not record patient self-service actions unless the action is performed by staff on behalf of the patient.
3. Stores only sanitized context in `payload`; secrets and credentials are never persisted.
4. Treats audit rows as append-only. There are no update or delete endpoints.
5. Uses UTC timestamps in storage and lets clients format timestamps in the clinic timezone.
6. Returns the standard API wrapper: `{ "statusCode": 200, "data": ... }`.

---

## Phase 1 - DTOs, Validation & Controller Contracts

### 1.1 File Map

```
backend/src/audit/
|-- audit.module.ts
|-- audit.controller.ts
|-- audit.service.ts
|-- audit.constants.ts
|-- audit.types.ts
`-- dto/
    |-- audit-log-query.dto.ts
    |-- audit-log-response.dto.ts
    `-- audit-log-page-response.dto.ts
```

### 1.2 Data Model

AuditModule uses the `AuditLog` Prisma model from the shared schema.

```typescript
interface AuditLogRecord {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: Date;
}
```

Recommended indexes:

| Index | Purpose |
|---|---|
| `createdAt` | Default newest-first listing and date range filters |
| `actorId, createdAt` | Investigate actions by a specific user |
| `action, createdAt` | Filter by action key |
| `targetType, targetId, createdAt` | Trace history for a specific entity |

### 1.3 Action Keys

Use stable machine-readable action keys. These keys are persisted, returned to the frontend, and mapped to localized labels in the UI.

```typescript
export const AUDIT_ACTIONS = {
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DISABLED: 'USER_DISABLED',
  USER_PASSWORD_CHANGED: 'USER_PASSWORD_CHANGED',
  DOCTOR_CREATED: 'DOCTOR_CREATED',
  DOCTOR_UPDATED: 'DOCTOR_UPDATED',
  SCHEDULE_OVERRIDE_CREATED: 'SCHEDULE_OVERRIDE_CREATED',
  SCHEDULE_OVERRIDE_DELETED: 'SCHEDULE_OVERRIDE_DELETED',
  CLINIC_CONFIG_UPDATED: 'CLINIC_CONFIG_UPDATED',
  WORKING_HOURS_UPDATED: 'WORKING_HOURS_UPDATED',
  HOLIDAY_CREATED: 'HOLIDAY_CREATED',
  HOLIDAY_DELETED: 'HOLIDAY_DELETED',
  APPOINTMENT_CREATED: 'APPOINTMENT_CREATED',
  APPOINTMENT_RESCHEDULED: 'APPOINTMENT_RESCHEDULED',
  APPOINTMENT_STATUS_UPDATED: 'APPOINTMENT_STATUS_UPDATED',
  APPOINTMENT_CANCELED: 'APPOINTMENT_CANCELED',
  WAITLIST_ENTRY_UPDATED: 'WAITLIST_ENTRY_UPDATED',
  WAITLIST_ENTRY_DELETED: 'WAITLIST_ENTRY_DELETED',
  WAITLIST_OFFER_CREATED: 'WAITLIST_OFFER_CREATED',
  WAITLIST_OFFER_EXPIRED: 'WAITLIST_OFFER_EXPIRED',
} as const;
```

### 1.4 Target Types

```typescript
export const AUDIT_TARGET_TYPES = {
  USER: 'USER',
  DOCTOR: 'DOCTOR',
  APPOINTMENT: 'APPOINTMENT',
  WAITLIST: 'WAITLIST',
  WAITLIST_OFFER: 'WAITLIST_OFFER',
  CLINIC_CONFIG: 'CLINIC_CONFIG',
  HOLIDAY: 'HOLIDAY',
  SCHEDULE_OVERRIDE: 'SCHEDULE_OVERRIDE',
  AUTH: 'AUTH',
  OTHER: 'OTHER',
} as const;
```

### 1.5 Internal Write Input

This is not an HTTP DTO. Other services call `AuditService.log()` with typed input after successful writes.

```typescript
interface WriteAuditLogInput {
  actorId: string;
  actorRole: 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'PATIENT';
  action: string;
  targetType: string;
  targetId?: string | null;
  payload?: Record<string, unknown> | null;
}
```

**Validation rules**:

- `actorId` is required for persisted audit logs.
- `actorRole = PATIENT` is ignored unless a caller explicitly opts into logging a patient action for a security-relevant event.
- `action` must be one of the known `AUDIT_ACTIONS` unless the caller passes a documented module-specific key.
- `targetType` must be one of the known `AUDIT_TARGET_TYPES` unless the caller passes `OTHER`.
- `targetId` is optional for singleton or system-level targets such as `CLINIC_CONFIG`.
- `payload` must be JSON-serializable and should be concise enough for table detail rendering.

### 1.6 Payload Redaction

Before inserting an audit row, recursively redact sensitive keys.

```typescript
const REDACTED_KEYS = [
  'password',
  'passwordHash',
  'token',
  'refreshToken',
  'accessToken',
  'authorization',
  'secret',
  'cookie',
];
```

**Redaction rules**:

- Redaction is case-insensitive.
- Matching keys are replaced with the string `[REDACTED]`.
- Arrays and nested objects are traversed.
- `Date` values are serialized as ISO strings.
- Unsupported values such as functions, symbols, and class instances are omitted or converted to safe strings.

### 1.7 Query DTO

`GET /api/audit` accepts filters and pagination.

```typescript
class AuditLogQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsUUID()
  actorId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  actorName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  action?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetType?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  targetId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 50;

  @IsOptional()
  @IsEnum(['createdAt', 'actor', 'action', 'targetType'])
  sortBy?: 'createdAt' | 'actor' | 'action' | 'targetType' = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'desc';
}
```

**Validation rules**:

- If both `from` and `to` are present, `to` must be greater than or equal to `from`.
- Date filters are interpreted as UTC instants if full ISO timestamps are passed.
- Date-only values are interpreted as full-day bounds in the clinic timezone, then converted to UTC.
- Maximum date range is 366 days.
- `action` and `targetType` accept repeated query params or comma-separated values if the existing query parser supports both patterns.
- `pageSize` defaults to `50` and is capped at `100`.
- Unknown `action` values are allowed as filters so historical/custom action keys remain queryable.
- Unknown `targetType` values are allowed as filters so future module targets do not break older clients.

### 1.8 Response DTOs

```typescript
class AuditActorDto {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
}

class AuditLogDto {
  id: string;
  actorId: string | null;
  actor: AuditActorDto | null;
  action: string;
  targetType: string;
  targetId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

class AuditLogPageDto {
  items: AuditLogDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

Response shape:

```json
{
  "statusCode": 200,
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 50,
    "total": 0,
    "totalPages": 0
  }
}
```

### 1.9 Controller Endpoint

| Endpoint | Method | Roles | Query DTO | Service Method |
|---|---|---|---|---|
| `/api/audit` | GET | ADMIN | `AuditLogQueryDto` | `findLogs()` |

Controller requirements:

- Use `JwtAuthGuard` and `RolesGuard`.
- Restrict access to `ADMIN` only.
- Add Swagger decorators for query params, response DTO, and common error responses.
- Do not expose any write endpoint.

---

## Phase 2 - Service Behavior & Backend Integration

### 2.1 `AuditService` API

```typescript
@Injectable()
export class AuditService {
  async log(input: WriteAuditLogInput): Promise<void>;
  async findLogs(query: AuditLogQueryDto): Promise<AuditLogPageDto>;
}
```

### 2.2 Write Behavior

`AuditService.log()` should be best-effort but observable.

Acceptance criteria:

- Writes the audit row only after the calling service's state change succeeds.
- Skips patient-only actor roles by default.
- Sanitizes payloads before persistence.
- Does not throw user-facing errors for audit write failures after the primary action succeeds.
- Logs audit write failures through NestJS logger with enough context for debugging.
- Never includes raw request headers, cookies, JWTs, reset tokens, or password fields.

### 2.3 Read Behavior

`AuditService.findLogs()` builds a Prisma `where` clause from `AuditLogQueryDto`.

Acceptance criteria:

- Default sort is newest first by `createdAt`.
- Pagination uses `skip` and `take` based on validated `page` and `pageSize`.
- `actorId` filters exact actor ID.
- `actorName` searches actor first name, last name, or email where Prisma relation filters allow it.
- `action` filters with `in` when multiple values are provided.
- `targetType` filters with `in` when multiple values are provided.
- `targetId` filters exact target ID.
- `from` and `to` apply inclusive start and exclusive end bounds after timezone normalization.
- Returns `actor: null` if the actor user has been deleted or cannot be joined.

### 2.4 Module Logging Responsibilities

State-changing methods in these modules must call `AuditService.log()` when the authenticated actor is staff:

| Module | Actions |
|---|---|
| UsersModule | `USER_CREATED`, `USER_UPDATED`, `USER_DISABLED`, `USER_PASSWORD_CHANGED` |
| DoctorsModule | `DOCTOR_CREATED`, `DOCTOR_UPDATED`, `SCHEDULE_OVERRIDE_CREATED`, `SCHEDULE_OVERRIDE_DELETED` |
| ClinicConfigModule | `CLINIC_CONFIG_UPDATED`, `WORKING_HOURS_UPDATED`, `HOLIDAY_CREATED`, `HOLIDAY_DELETED` |
| AppointmentsModule | `APPOINTMENT_CREATED`, `APPOINTMENT_RESCHEDULED`, `APPOINTMENT_STATUS_UPDATED`, `APPOINTMENT_CANCELED` |
| WaitlistModule | `WAITLIST_ENTRY_UPDATED`, `WAITLIST_ENTRY_DELETED` |
| WaitlistOfferEngineModule | `WAITLIST_OFFER_CREATED`, `WAITLIST_OFFER_EXPIRED` |

Payload guidelines:

- Prefer diffs for updates: `{ before: { status: 'CONFIRMED' }, after: { status: 'CANCELED' } }`.
- Prefer context for creates: `{ patientId, doctorId, startsAt }`.
- Keep payloads minimal and avoid duplicating full database rows.
- Include `reason` when a workflow has a user-visible reason field.

### 2.5 Immutability

Audit logs are append-only.

Acceptance criteria:

- No service method updates or deletes audit rows.
- No controller route exposes mutation operations.
- Database cleanup or retention is out of scope unless later required by policy.
- Test factories may delete audit rows only inside test database setup/teardown.

---

## Phase 3 - Unit Testing & E2E Testing

### 3.1 Unit Tests

Add `audit.service.spec.ts` and `audit.controller.spec.ts`.

Service test cases:

| Case | Expected Result |
|---|---|
| Staff actor logs a valid action | Prisma `auditLog.create` receives sanitized data |
| Patient actor logs a normal action | No audit row is written |
| Payload contains secrets | Sensitive keys are replaced with `[REDACTED]` recursively |
| Payload contains `Date` values | Stored payload contains ISO strings |
| Prisma create fails | Error is logged and caller does not receive a thrown exception |
| Query has date range | Prisma `where.createdAt` uses normalized bounds |
| Query has actor/action/target filters | Prisma receives the expected combined filters |
| Query has pagination | Prisma receives correct `skip` and `take` |
| Query has invalid sort | Validation rejects request before service execution |

Controller test cases:

| Case | Expected Result |
|---|---|
| Admin requests audit logs | Controller calls `findLogs()` with validated query |
| Non-admin role requests audit logs | Guard blocks with `403` |
| Unauthenticated request | Guard blocks with `401` |
| Swagger response DTO exists | Controller metadata documents the paginated response |

### 3.2 E2E Tests

Add `audit.e2e-spec.ts` under the existing e2e test structure.

Required e2e scenarios:

1. Admin can read audit logs.
2. Receptionist cannot read audit logs and receives `403`.
3. Doctor cannot read audit logs and receives `403`.
4. Unauthenticated request receives `401`.
5. A staff appointment state change creates an audit row with the expected actor, action, target type, and target ID.
6. A clinic configuration update creates an audit row with a redacted/sanitized payload.
7. Query filters by `actorId`, `action`, `targetType`, `targetId`, `from`, and `to` return only matching rows.
8. Pagination returns stable `items`, `page`, `pageSize`, `total`, and `totalPages` values.

Test data requirements:

- Seed one admin, one receptionist, one doctor, and one patient.
- Seed or create at least one appointment target.
- Use deterministic timestamps where date-range assertions are required.
- Clean test database state between scenarios.

Commands:

```bash
pnpm test
pnpm test:e2e
```

---

## Phase 4 - Frontend Integration

### 4.1 Current Status

Frontend spec [022-audit-log-page](../022-audit-log-page/spec.md) defines the target UI and route `/admin/audit`, but the user confirmed the corresponding frontend pages are not implemented yet.

Integration should therefore proceed in this order:

1. Finalize and implement the backend `GET /api/audit` contract.
2. Implement the frontend `AuditLogPage` from spec 022.
3. Wire `getAuditLogs(filters)` to `GET /audit` through the existing frontend API client base URL.
4. Confirm the page uses `ProtectedRoute` with `ADMIN` role only.
5. Verify filters, pagination, sorting, and payload details against real backend responses.

### 4.2 Frontend API Contract

Frontend request:

```typescript
export interface AuditLogFilters {
  from?: string;
  to?: string;
  actorId?: string;
  actorName?: string;
  action?: string[];
  targetType?: string[];
  targetId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'actor' | 'action' | 'targetType';
  sortDir?: 'asc' | 'desc';
}

export async function getAuditLogs(
  filters: AuditLogFilters,
): Promise<PaginatedResponse<AuditLogDTO>>;
```

HTTP request:

```http
GET /api/audit?from=2026-05-01&to=2026-05-05&page=1&pageSize=50&sortBy=createdAt&sortDir=desc
Authorization: Bearer <access-token>
```

### 4.3 UI Expectations

The frontend audit page should:

- Default to the last 7 days in clinic timezone.
- Persist filters and pagination in URL query params.
- Render `actor` as name plus role, falling back to `actorId`.
- Render known action keys through localized labels, falling back to the raw key.
- Display `targetType` and shortened `targetId` in the table.
- Show sanitized JSON payload in a sheet or expandable details area.
- Never provide edit or delete actions for audit rows.
- Treat `403` as an admin-only access failure and redirect to `/403`.

### 4.4 Integration Acceptance Criteria

- [ ] `GET /api/audit` appears in Swagger with query filters and response DTOs.
- [ ] Admin users can load the first page of audit logs.
- [ ] Non-admin users cannot load audit logs.
- [ ] Filters from spec 022 map to backend query params without translation hacks.
- [ ] Frontend renders empty, loading, error, and payload details states.
- [ ] Payload values returned by backend are already sanitized before frontend display.
- [ ] `pnpm test`, `pnpm test:e2e`, and frontend build pass once the page is implemented.

---

## Edge Cases

- Actor user is deleted after the audit row is written: return `actor: null` while keeping `actorId`.
- Target entity is deleted after the audit row is written: keep `targetType`, `targetId`, and payload context.
- Audit payload contains unsupported JSON values: omit or stringify safely before persistence.
- Payload is empty: return `payload: null`.
- Date range has no logs: return an empty `items` array with accurate pagination metadata.
- Unknown historical action key exists: return it unchanged and allow filtering by it.
- Audit write fails after primary action succeeds: do not roll back the primary action, but log the audit failure internally.

---

## Acceptance Criteria

- [ ] `AuditModule` exposes `GET /api/audit` for admin users only.
- [ ] `AuditService.log()` is exported for other modules to call.
- [ ] Staff state-changing actions write immutable audit rows.
- [ ] Patient self-service actions are skipped by default.
- [ ] Audit payloads are sanitized recursively before storage.
- [ ] Audit list endpoint supports actor, action, target, date range, pagination, and sorting filters.
- [ ] Unit tests cover service logging, filtering, validation, redaction, and controller authorization.
- [ ] E2E tests cover admin access, forbidden roles, unauthenticated access, generated rows, filters, and pagination.
- [ ] Frontend integration remains blocked on implementing the `/admin/audit` page from spec 022.
