# Backend Development Progress

Track completion of backend modules and features. Each row links to the spec file (when created) and implementation status.

## Modules Implementation Status

| # | Module | Spec | Plan | Tasks | Implementation | Tests | Status |
|---|--------|------|------|-------|-----------------|-------|--------|
| 1 | **AuthModule** | [spec](specs/backend-001-auth-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#1-authmodule) | — | 🔴 Not started | 🔴 | Spec written |
| 2 | **UsersModule** | [spec](specs/backend-002-users-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#2-usersmodule) | — | 🔴 Not started | 🔴 | Spec written |
| 3 | **DoctorsModule** | [spec](specs/backend-003-doctors-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#3-doctorsmodule) | — | 🔴 Not started | 🔴 | Spec written |
| 4 | **ClinicConfigModule** | [spec](specs/backend-004-clinic-config-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#4-cliniconfigmodule) | — | 🔴 Not started | 🔴 | Spec written |
| 5 | **AppointmentsModule** | [spec](specs/backend-005-appointments-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#5-appointmentsmodule) | — | 🔴 Not started | 🔴 | Spec written |
| 6 | **WaitlistModule** | [spec](specs/backend-006-waitlist-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#6-waitlistmodule) | — | 🔴 Not started | 🔴 | Spec written |
| 7 | **WaitlistOfferEngine** | [spec](specs/backend-007-waitlist-offer-engine-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#7-waitlistofferenginmodule) | — | 🔴 Not started | 🔴 | Spec written |
| 8 | **QueueModule** | [spec](specs/backend-008-queue-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#8-queuemodule) | — | 🔴 Not started | 🔴 | Spec written |
| 9 | **NotificationsModule** | [spec](specs/backend-009-notifications-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#9-notificationsmodule) | — | 🔴 Not started | 🔴 | Spec written |
| 10 | **AnalyticsModule** | [spec](specs/backend-010-analytics-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#10-analyticsmodule) | — | 🔴 Not started | 🔴 | Spec written |
| 11 | **AuditModule** | [spec](specs/backend-011-audit-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#11-auditmodule) | — | 🔴 Not started | 🔴 | Spec written |
| 12 | **PrismaModule** | [spec](specs/backend-012-prisma-module/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#12-prismamodule) | — | 🟢 Basic scaffolding | 🔴 | Spec written; partial implementation |
| 13 | **Common** (Guards, Decorators, Filters) | [spec](specs/backend-013-common/spec.md) | [BACKEND_PLAN.md](BACKEND_PLAN.md#13-common) | — | 🔴 Not started | 🔴 | Spec written |

**Legend**: 🔴 = Not started, 🟡 = In progress, 🟢 = Complete

---

## Features & Flows

Track core features and end-to-end flows as they are implemented:

| Feature | Spec | Status | Notes |
|---------|------|--------|-------|
| **User Registration & Login** | — | 🔴 | Requires AuthModule + UsersModule |
| **JWT Refresh Token Rotation** | — | 🔴 | Requires AuthModule |
| **Password Reset Flow** | — | 🔴 | Requires AuthModule + NotificationsModule |
| **Slot Generation Algorithm** | — | 🔴 | Requires AppointmentsModule + ClinicConfigModule |
| **Appointment Booking (Idempotent)** | — | 🔴 | Requires AppointmentsModule |
| **24-Hour Cancellation Rule** | — | 🔴 | Requires AppointmentsModule |
| **Waitlist Join/Leave** | — | 🔴 | Requires WaitlistModule |
| **Auto-Offer Engine** | — | 🔴 | Requires WaitlistOfferEngineModule + BullMQ |
| **Real-Time Queue (Socket.IO)** | — | 🔴 | Requires QueueModule |
| **Email Notifications** | — | 🔴 | Requires NotificationsModule |
| **Analytics Aggregations** | [spec](specs/backend-010-analytics-module/spec.md) | 🔴 | Requires AnalyticsModule; spec written |
| **Audit Logging** | [spec](specs/backend-011-audit-module/spec.md) | 🔴 | Requires AuditModule; spec written |
| **RBAC Guards** | [spec](specs/backend-013-common/spec.md) | 🔴 | Requires Common + Guards; spec written |

---

## Database Migrations

| # | Migration | Created | Status |
|---|-----------|---------|--------|
| 1 | `init` (initial schema) | — | 🔴 Pending |

Run migrations with:
```bash
pnpm prisma migrate dev --name <name>
pnpm prisma migrate deploy  # production
```

---

## API Endpoints Implementation

### Auth Endpoints (`/api/auth`)

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/register` | POST | 🔴 | — |
| `/login` | POST | 🔴 | — |
| `/refresh` | POST | 🔴 | — |
| `/logout` | POST | 🔴 | — |
| `/forgot-password` | POST | 🔴 | — |
| `/reset-password` | POST | 🔴 | — |
| `/me` | GET | 🔴 | — |

### Users Endpoints (`/api/users`)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/` | GET | 🔴 |
| `/` | POST | 🔴 |
| `/:id` | GET | 🔴 |
| `/:id` | PATCH | 🔴 |
| `/:id/disable` | PATCH | 🔴 |
| `/:id/change-password` | POST | 🔴 |

### Doctors Endpoints (`/api/doctors`)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/` | GET | 🔴 |
| `/:id` | GET | 🔴 |
| `/` | POST | 🔴 |
| `/:id` | PATCH | 🔴 |
| `/:id/schedule-overrides` | GET | 🔴 |
| `/:id/schedule-overrides` | POST | 🔴 |
| `/:id/schedule-overrides/:overrideId` | DELETE | 🔴 |

### Clinic Config Endpoints (`/api/clinic-config`)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/` | GET | 🔴 |
| `/` | PATCH | 🔴 |
| `/working-hours` | GET | 🔴 |
| `/working-hours` | PUT | 🔴 |
| `/holidays` | GET | 🔴 |
| `/holidays` | POST | 🔴 |
| `/holidays/:id` | DELETE | 🔴 |

### Appointments Endpoints (`/api/appointments`)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/slots` | GET | 🔴 |
| `/` | GET | 🔴 |
| `/:id` | GET | 🔴 |
| `/` | POST | 🔴 |
| `/:id/status` | PATCH | 🔴 |
| `/:id` | PATCH | 🔴 |
| `/:id` | DELETE | 🔴 |

### Waitlist Endpoints (`/api/waitlist`)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/` | GET | 🔴 |
| `/` | POST | 🔴 |
| `/:id` | PATCH | 🔴 |
| `/:id` | DELETE | 🔴 |
| `/offers/:offerId` | GET | 🔴 |
| `/offers/:offerId/accept` | POST | 🔴 |
| `/offers/:offerId/decline` | POST | 🔴 |

### Analytics Endpoints (`/api/analytics`)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/trends` | GET | 🔴 |
| `/status-distribution` | GET | 🔴 |
| `/doctor-utilization` | GET | 🔴 |
| `/appointments-by-weekday` | GET | 🔴 |
| `/cancellation-trends` | GET | 🔴 |
| `/kpi-summary` | GET | 🔴 |
| `/follow-ups` | GET | 🔴 |
| `/waitlist-summary` | GET | 🔴 |
| `/today-summary` | GET | 🔴 |
| `/today-by-doctor` | GET | 🔴 |
| `/my-stats` | GET | 🔴 |
| `/my-trends` | GET | 🔴 |
| `/my-hourly-load` | GET | 🔴 |
| `/my-status-distribution` | GET | 🔴 |

### Audit Endpoints (`/api/audit`)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/` | GET | 🔴 |

### Queue Endpoints (Socket.IO `/queue`)

| Event | Direction | Status |
|-------|-----------|--------|
| `queue.snapshot` | Server → Client | 🔴 |
| `queue.updated` | Server → Client | 🔴 |
| `queue.removed` | Server → Client | 🔴 |
| `queue.subscribe` | Client → Server | 🔴 |
| `queue.unsubscribe` | Client → Server | 🔴 |

---

## Testing Status

| Test Level | Target | Status | Notes |
|------------|--------|--------|-------|
| **Unit Tests** | All services | 🔴 | Pending module implementations |
| **Integration Tests** | Auth flow | 🔴 | Full register → login → refresh |
| **Integration Tests** | Booking flow | 🔴 | Slot generation → booking → cancellation |
| **Integration Tests** | Waitlist flow | 🔴 | Join → offer engine → accept/decline |
| **E2E Tests** | Full system | 🔴 | Pending feature completion |

**Run**:
```bash
pnpm test              # unit + integration
pnpm test:watch        # watch mode
pnpm test:cov          # coverage
pnpm test:e2e          # e2e (against real DB in Docker)
```

---

## Notes

- Spec-driven development: Create `specs/<NNN-moduleName>/spec.md` for each module before implementing.
- Each spec should describe user stories, acceptance criteria, and edge cases.
- Follow the constitution: strict TypeScript, RBAC on every route, validation at boundaries, audit logging for staff actions.
- Use `@nestjs/swagger` decorators for auto-generated docs at `/api/docs`.
- All timestamps are UTC in the DB; clinic timezone applied only at display/rule evaluation.
- Idempotency-Key header support for booking endpoints.
- Refresh token rotation on every refresh; old token invalidated.
