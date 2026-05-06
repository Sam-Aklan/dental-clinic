# Dental Clinic Backend — Implementation Plan

## Overview

NestJS-based REST API with real-time Socket.IO support, PostgreSQL persistence via Prisma, and asynchronous job processing via BullMQ. The backend enforces RBAC, validates all inputs, logs audit events, and coordinates the appointment and waitlist systems.

**Stack**: NestJS 10 + TypeScript strict + Prisma + PostgreSQL + Redis + BullMQ + Passport (JWT) + Socket.IO + Nodemailer + argon2 + helmet

**API Base URL**: `http://localhost:3000/api`  
**Swagger Docs**: `http://localhost:3000/api/docs`  
**Socket.IO Namespace**: `/queue`

---

## Modules

### 1. AuthModule (`backend/src/auth/`)

**Responsibility**: User registration, login, JWT issuance, refresh-token rotation, logout, password reset flow.

**Files**:
- `auth.controller.ts` — HTTP endpoints
- `auth.service.ts` — business logic (hash, verify, token generation)
- `strategies/jwt.strategy.ts` — access token verification
- `strategies/jwt-refresh.strategy.ts` — refresh token from cookie
- `auth.module.ts`
- DTOs: `register.dto.ts`, `login.dto.ts`, `forgot-password.dto.ts`, `reset-password.dto.ts`

**Key behaviors**:
- Register: validate email uniqueness, hash password with argon2id, create User + PatientProfile, return accessToken
- Login: validate credentials, return accessToken + set HTTP-only refresh cookie
- Refresh: validate refresh token from cookie, rotate tokens, return new accessToken
- Logout: clear refresh token row + cookie
- Forgot password: generate one-time token, queue email via NotificationsModule
- Reset password: validate token (single-use), update password, invalidate all old refresh tokens

**Endpoints**:
- `POST /register`
- `POST /login`
- `POST /refresh`
- `POST /logout`
- `POST /forgot-password`
- `POST /reset-password`
- `GET /me`

---

### 2. UsersModule (`backend/src/users/`)

**Responsibility**: Admin user management, profile updates, language preference, password change.

**Files**:
- `users.controller.ts`
- `users.service.ts`
- `users.module.ts`
- DTOs: `create-user.dto.ts`, `update-user.dto.ts`, `change-password.dto.ts`

**Key behaviors**:
- Admin can create users with any role
- Users can view and update their own profile
- Admin can list, disable, and manage users
- Password changes require current password verification

**Endpoints**:
- `GET /` (admin) — paginated, filterable by role/status
- `POST /` (admin) — create user with role
- `GET /:id` (admin or self)
- `PATCH /:id` (admin or self) — profile fields, language preference
- `PATCH /:id/disable` (admin)
- `POST /:id/change-password` (self)

---

### 3. DoctorsModule (`backend/src/doctors/`)

**Responsibility**: Doctor profiles, specializations, schedule overrides, public directory.

**Files**:
- `doctors.controller.ts`
- `doctors.service.ts`
- `doctors.module.ts`
- DTOs: `create-doctor.dto.ts`, `update-doctor.dto.ts`, `schedule-override.dto.ts`

**Key behaviors**:
- Public directory (no auth) for booking page to list doctors
- Admin creates doctor accounts (user + profile)
- Schedule overrides allow per-day working-hour adjustments (null = unavailable)
- Doctor can view and update own profile

**Endpoints**:
- `GET /` (public) — public directory
- `GET /:id` (public)
- `POST /` (admin) — create doctor + linked user
- `PATCH /:id` (admin or self)
- `GET /:id/schedule-overrides` (admin, receptionist, doctor-self)
- `POST /:id/schedule-overrides` (admin)
- `DELETE /:id/schedule-overrides/:overrideId` (admin)

---

### 4. ClinicConfigModule (`backend/src/clinic-config/`)

**Responsibility**: Singleton clinic configuration (slot duration, timezone), working hours, holidays.

**Files**:
- `clinic-config.controller.ts`
- `clinic-config.service.ts`
- `clinic-config.module.ts`
- DTOs: `update-clinic-config.dto.ts`, `working-hour.dto.ts`, `holiday.dto.ts`

**Key behaviors**:
- Clinic config includes slot duration (minutes), timezone, reminder hours, offer window, min arrival buffer
- Working hours defined per weekday (0-6)
- Holidays prevent slot generation
- Endpoints are public for reading (needed by booking page), admin-only for writing

**Endpoints**:
- `GET /` (public) — slot duration, timezone
- `PATCH /` (admin)
- `GET /working-hours` (public)
- `PUT /working-hours` (admin) — replace full week
- `GET /holidays` (public)
- `POST /holidays` (admin)
- `DELETE /holidays/:id` (admin)

---

### 5. AppointmentsModule (`backend/src/appointments/`)

**Responsibility**: Slot generation, appointment booking, listing, status transitions, cancellation.

**Files**:
- `appointments.controller.ts`
- `appointments.service.ts`
- `slot-generator.service.ts` — computes available slots
- `appointments.module.ts`
- DTOs: `create-appointment.dto.ts`, `update-status.dto.ts`, `reschedule.dto.ts`
- Decorators: `@IdempotencyKey()` custom decorator

**Key behaviors**:
- Slot generator: computes slots by clinic working hours, minus holidays, minus overrides, minus booked slots, minus past times (same-day)
- Booking: re-validates slot, enforces unique (doctorId, startsAt) for non-canceled rows (409 on conflict)
- Idempotency: POST requests include `Idempotency-Key` header; duplicate request returns same appointment
- Status transitions: enforce state machine (PENDING → CONFIRMED → IN_PROGRESS → COMPLETED)
- Cancellation enforced here (24h rule for patients, always allowed for staff)
- On successful cancel, emit `slot-opened` event to BullMQ

**Endpoints**:
- `GET /slots` (public) — query `doctorId, from, to`
- `GET /` (auth) — patient sees own, staff sees all (filterable)
- `GET /:id` (auth)
- `POST /` (patient or receptionist) — with `Idempotency-Key` header
- `PATCH /:id/status` (doctor own, receptionist)
- `PATCH /:id` (receptionist) — reschedule
- `DELETE /:id` (patient own 24h-rule, receptionist)

---

### 6. WaitlistModule (`backend/src/waitlist/`)

**Responsibility**: Waitlist entries, availability windows, offer accept/decline.

**Files**:
- `waitlist.controller.ts`
- `waitlist.service.ts`
- `waitlist.module.ts`
- DTOs: `join-waitlist.dto.ts`, `update-window.dto.ts`

**Key behaviors**:
- Patient can join a waitlist for a doctor with optional availability window (HH:MM to HH:MM)
- Waitlist position auto-assigned; highest priority first
- One waitlist entry per (patient, doctor) pair
- Accept/decline endpoints are idempotent
- Accept: atomically cancels old appointment + creates new + removes waitlist entry

**Endpoints**:
- `GET /` (patient own, staff all)
- `POST /` (patient)
- `PATCH /:id` (patient own) — edit window
- `DELETE /:id` (patient own, staff)
- `GET /offers/:offerId` (patient own)
- `POST /offers/:offerId/accept` (patient own)
- `POST /offers/:offerId/decline` (patient own)

---

### 7. WaitlistOfferEngineModule (`backend/src/waitlist-offer-engine/`)

**Responsibility**: BullMQ processor that reacts to slot-opened events, selects eligible patients, sends offers.

**Files**:
- `waitlist-offer.processor.ts` — BullMQ processor
- `waitlist-offer-engine.service.ts`
- `waitlist-offer-engine.module.ts`

**Key behaviors**:
- On `slot-opened` event (cancellation, schedule add):
  - Find highest-priority WaitlistEntry for that doctor
  - Check if patient's availability window covers the slot start time
  - Check if arrival buffer satisfied: `now + minArrivalMinutes ≤ slot.startsAt`
  - Create WaitlistOffer(status=PENDING, expiresAt = now + offerWindowMinutes)
  - Queue email via NotificationsModule
- On accept: atomically cancel old appointment + create new + remove entry
- On decline: update offer status, re-enqueue to find next eligible
- On expiry: mark expired, re-enqueue
- If no eligible: log `no_eligible_patient`, leave slot open

**Trigger**: Fired by AppointmentsModule on successful cancellation.

---

### 8. QueueModule (`backend/src/queue/`)

**Responsibility**: Socket.IO gateway for real-time queue updates, room-per-doctor, kiosk tokens.

**Files**:
- `queue.gateway.ts` — Socket.IO gateway
- `queue.service.ts`
- `kiosk-token.service.ts` — signed token for lobby displays
- `queue.module.ts`

**Key behaviors**:
- Connect to `/queue` namespace with JWT or kiosk token auth
- Subscribe to `doctor:<doctorId>` rooms
- Emit `queue.snapshot` on connect
- On appointment status change: emit `queue.updated` event
- On cancellation: emit `queue.removed` event
- Lobby screens use read-only kiosk tokens (no auth required, single-doctor access)

**Events**:
- `queue.snapshot`: `{ doctorId, items: [...] }`
- `queue.updated`: `{ appointmentId, status, position, updatedAt }`
- `queue.removed`: `{ appointmentId }`
- Client: `queue.subscribe`, `queue.unsubscribe`

---

### 9. NotificationsModule (`backend/src/notifications/`)

**Responsibility**: Email transport, per-locale templates, BullMQ queues.

**Files**:
- `notifications.service.ts` — Nodemailer transport
- `notifications.module.ts`
- Email templates: `templates/en/`, `templates/ar/` (password-reset, appointment-confirmation, reminder, waitlist-offer)
- `notifications.processor.ts` — BullMQ processor for email jobs

**Key behaviors**:
- Uses Nodemailer for SMTP (MailHog in dev, real SMTP in prod)
- Supports per-locale templates (user.preferredLocale)
- BullMQ queues: `password-reset`, `appointment-confirmation`, `reminder`, `waitlist-offer`
- Processor jobs are idempotent (skip if appointment canceled, etc.)

**Queues**:
- `password-reset` → trigger on forgot-password request
- `appointment-confirmation` → trigger on booking
- `reminder` → schedule at `startsAt - reminderHours`
- `waitlist-offer` → trigger on offer engine decision

---

### 10. AnalyticsModule (`backend/src/analytics/`)

**Responsibility**: Role-scoped aggregations covering KPI cards, chart data series, and data-table payloads for admin, receptionist, and doctor dashboards. All time-based aggregations operate in the clinic timezone (from `ClinicConfig.timeZone`).

**Files**:
- `analytics.controller.ts`
- `analytics.service.ts`
- `analytics.module.ts`
- DTOs: `trends-query.dto.ts`, `today-summary-response.dto.ts`, `doctor-stats-response.dto.ts`, `follow-up-response.dto.ts`

---

#### Admin Endpoints

**`GET /analytics/trends`** `(admin, receptionist)`  
Query: `from: ISO date, to: ISO date, bucket: 'day'|'week'|'month'`  
Returns: array of `{ date, total, confirmed, completed, canceled, noShow }` grouped by bucket.  
Used by: Admin Appointment Trends line chart.

**`GET /analytics/status-distribution`** `(admin, receptionist)`  
Query: `from, to`  
Returns: `{ PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELED, NO_SHOW }` counts.  
Used by: Admin + Receptionist status donut chart.

**`GET /analytics/doctor-utilization`** `(admin)`  
Query: `from, to`  
Returns: array of `{ doctorId, doctorName, bookedSlots, totalSlots, utilizationPct }`.  
Calculation: `bookedSlots = CONFIRMED + IN_PROGRESS + COMPLETED`; `totalSlots` derived from working hours minus holidays for the period.  
Used by: Admin doctor utilization horizontal bar chart.

**`GET /analytics/appointments-by-weekday`** `(admin, receptionist)`  
Query: `from, to`  
Returns: array of `{ dayOfWeek: 0-6, label: 'Sun'…'Sat', count }`.  
Used by: Admin busiest days bar chart.

**`GET /analytics/cancellation-trends`** `(admin, receptionist)`  
Query: `from, to, bucket: 'day'|'week'`  
Returns: array of `{ date, canceledByPatient, canceledByStaff, noShow }`.  
Used by: Admin cancellation trend line chart.

**`GET /analytics/kpi-summary`** `(admin, receptionist)`  
Query: `from, to`  
Returns one object:
```json
{
  "totalAppointments": 412,
  "completed": 310,
  "cancellationRate": 0.12,
  "noShowRate": 0.04,
  "activePatients": 183,
  "waitlistSize": 27,
  "deltaTotalPct": 0.08,
  "deltaCompletedPct": 0.11
}
```
`delta*Pct` = change vs the immediately preceding equal-length period (for KPI card trend arrows).  
Used by: Admin 6 KPI cards.

**`GET /analytics/follow-ups`** `(admin, receptionist, doctor)`  
Query: `thresholdDays: number (default 90), page, pageSize`  
Returns: paginated list of `{ patientId, patientName, lastAppointmentDate, daysSince, hasUpcoming }`.  
Doctor role: scoped to their own patients only.  
Used by: Admin + Receptionist follow-ups data table.

**`GET /analytics/waitlist-summary`** `(admin, receptionist)`  
Returns: `{ totalActive, byDoctor: [{ doctorId, doctorName, count }] }`.  
Used by: Admin waitlist KPI card + receptionist waitlist table header.

---

#### Receptionist Endpoints

**`GET /analytics/today-summary`** `(admin, receptionist)`  
No query params (always "today" in clinic timezone).  
Returns:
```json
{
  "total": 42,
  "inProgress": 3,
  "waiting": 8,
  "completed": 18,
  "canceledToday": 4,
  "pendingConfirmation": 9
}
```
Used by: Receptionist 6 KPI cards (auto-refreshes every 30s).

**`GET /analytics/today-by-doctor`** `(admin, receptionist)`  
Returns: array of `{ doctorId, doctorName, confirmed, inProgress, completed, canceled }` for today.  
Used by: Receptionist "Today by Doctor" grouped bar chart.

---

#### Doctor Endpoints (own data only)

**`GET /analytics/my-stats`** `(doctor)`  
Query: `date: ISO date (default today)`  
Returns:
```json
{
  "todayTotal": 12,
  "completedToday": 7,
  "remainingToday": 4,
  "inSession": 1,
  "noShowsToday": 1,
  "weekTotal": 58
}
```
Used by: Doctor 5 KPI cards on `/doctor/today`.

**`GET /analytics/my-trends`** `(doctor)`  
Query: `week: ISO date of any day in the target week`  
Returns: array of 7 items `{ date, dayLabel, count }` for Mon–Sun of that week.  
Used by: Doctor "My Week at a Glance" bar chart.

**`GET /analytics/my-hourly-load`** `(doctor)`  
Query: `from, to`  
Returns: array of `{ hour: 0-23, count }` — how many appointments start in each hour.  
Used by: Doctor "My Hourly Load" bar chart.

**`GET /analytics/my-status-distribution`** `(doctor)`  
Query: `from, to`  
Returns: `{ CONFIRMED, IN_PROGRESS, COMPLETED, CANCELED, NO_SHOW }` counts for this doctor only.  
Used by: Doctor status donut chart.

---

#### Data Table Endpoints (pagination + filtering)

These are **not** in AnalyticsModule — they live in AppointmentsModule, UsersModule, and WaitlistModule respectively. They are listed here as the data source for dashboard tables.

| Table | Endpoint | Module | Query Params |
|---|---|---|---|
| Admin Appointments Table | `GET /appointments` | AppointmentsModule | `from, to, doctorId[], status[], patientName, page, pageSize, sortBy, sortDir` |
| Admin Follow-ups Table | `GET /analytics/follow-ups` | AnalyticsModule | `thresholdDays, page, pageSize` |
| Admin Waitlist Table | `GET /waitlist` | WaitlistModule | `doctorId, page, pageSize` |
| Receptionist Today Table | `GET /appointments` | AppointmentsModule | `date=today, doctorId[], status[], patientName, page, pageSize` |
| Receptionist Upcoming | `GET /appointments` | AppointmentsModule | `from=today, to=+7days, doctorId[], status[]` |
| Doctor Today Schedule | `GET /appointments` | AppointmentsModule | `date=today, doctorId=self, sortBy=startsAt` |
| Doctor This Week | `GET /appointments` | AppointmentsModule | `from=weekStart, to=weekEnd, doctorId=self` |

**CSV Export**: `GET /appointments/export?format=csv` (admin, receptionist) — returns a `text/csv` response with all columns for the filtered result set (no pagination).

---

#### Response shape conventions

All analytics endpoints return:
```json
{ "statusCode": 200, "data": { ... } }
```
Dates in responses are always ISO 8601 strings. Percentages are decimals (0.12 = 12%). Counts are integers.

---

### 11. AuditModule (`backend/src/audit/`)

**Responsibility**: Immutable audit log for staff actions.

**Files**:
- `audit.controller.ts` (read-only)
- `audit.service.ts`
- `audit.module.ts`

**Key behaviors**:
- Every state-changing action by non-patient role writes an AuditLog row
- Includes: actor, action, target entity type, target ID, payload (diff or context), timestamp
- Read-only endpoint for admin; filterable by actor, action, target, date range

**Endpoints**:
- `GET /` (admin) — paginated, filterable

---

### 12. PrismaModule (`backend/src/prisma/`)

**Responsibility**: Database connection lifecycle.

**Files**:
- `prisma.service.ts` — extends PrismaClient with onModuleInit/onModuleDestroy

---

### 13. Common (`backend/src/common/`)

**Responsibility**: Shared guards, decorators, interceptors, filters.

**Files**:
- `guards/jwt-auth.guard.ts`
- `guards/roles.guard.ts`
- `decorators/roles.decorator.ts`
- `decorators/current-user.decorator.ts`
- `decorators/public.decorator.ts`
- `decorators/idempotency-key.decorator.ts`
- `interceptors/transform.interceptor.ts` — wrap responses as `{ data, statusCode }`
- `filters/http-exception.filter.ts` — standardize error responses

---

## API Contracts (Swagger)

All endpoints prefixed with `/api`. Full Swagger docs at `/api/docs`.

### Response Format

**Success**:
```json
{
  "statusCode": 200,
  "data": { ... }
}
```

**Error**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2026-05-04T12:00:00Z",
  "path": "/api/appointments"
}
```

### Authentication

- Bearer token (access JWT) in `Authorization` header
- Refresh token in HTTP-only cookie (auto-sent by browser)
- Kiosk token (signed) in query param for lobby screens

### Common Error Responses

- `400` — Validation failed
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (insufficient role)
- `404` — Not found
- `409` — Conflict (e.g., slot already booked)

### Endpoints by Module

**See [FRONTEND_PLAN.md](FRONTEND_PLAN.md#api-integration) for shared API contract reference.**

Key endpoints:

- **Auth**: `/register`, `/login`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`, `/me`
- **Appointments**: `/slots`, `GET /`, `POST /`, `PATCH /:id/status`, `DELETE /:id`
- **Waitlist**: `GET /`, `POST /`, `POST /offers/:id/accept`, `POST /offers/:id/decline`
- **Clinic Config**: `GET /clinic-config`, `GET /clinic-config/working-hours`, `GET /clinic-config/holidays`
- **Doctors**: `GET /doctors`, `GET /doctors/:id`, `POST /doctors/:id/schedule-overrides`
- **Analytics (admin)**: `/analytics/kpi-summary`, `/analytics/trends`, `/analytics/status-distribution`, `/analytics/doctor-utilization`, `/analytics/appointments-by-weekday`, `/analytics/cancellation-trends`, `/analytics/follow-ups`, `/analytics/waitlist-summary`
- **Analytics (receptionist)**: `/analytics/today-summary`, `/analytics/today-by-doctor`, `/analytics/kpi-summary`, `/analytics/status-distribution`, `/analytics/follow-ups`, `/analytics/waitlist-summary`
- **Analytics (doctor)**: `/analytics/my-stats`, `/analytics/my-trends`, `/analytics/my-hourly-load`, `/analytics/my-status-distribution`, `/analytics/follow-ups`
- **Appointments (export)**: `GET /appointments/export?format=csv` (admin, receptionist)
- **Queue**: Socket.IO `/queue` namespace

---

## Prisma Schema

See [plan.md — Section 9](plan.md#9-prisma-schema-overall) for the complete schema.

**Key entities**:
- `User` (ADMIN, RECEPTIONIST, DOCTOR, PATIENT) + `RefreshToken`, `PasswordResetToken`
- `DoctorProfile`, `PatientProfile`
- `ClinicConfig`, `WorkingHour`, `Holiday`, `DoctorScheduleOverride`
- `Appointment` (status: PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELED, NO_SHOW)
- `WaitlistEntry`, `WaitlistOffer` (status: PENDING, ACCEPTED, DECLINED, EXPIRED)
- `AuditLog`

---

## Testing

**Unit Tests** (`src/**/*.spec.ts`):
- AuthService: register, login, refresh, password reset
- AppointmentsService: slot generation, booking validation, cancellation 24h rule
- WaitlistOfferEngine: eligibility check (window + arrival buffer), offer cascade

**E2E Tests** (`test/**/*.e2e-spec.ts`):
- Full auth flow: register → login → me → refresh → logout
- Booking flow: GET slots → POST appointment (idempotency) → verify in DB
- Cancellation flow: POST appointment → DELETE → verify slot-opened event → waitlist offer created
- Waitlist accept flow: create offer → POST accept → old appointment canceled + new created atomically

**Run tests**:
```bash
pnpm test                 # unit
pnpm test:watch          # watch mode
pnpm test:cov            # coverage
pnpm test:e2e            # e2e
```

---

## Environment Variables

See `backend/.env.example`:

```
DATABASE_URL=postgresql://dental:dental@localhost:5432/dental
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=...
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRY=7d
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@dentalclinic.local
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

---

## Startup Checklist

- [ ] `pnpm install`
- [ ] `cp .env.example .env`
- [ ] `pnpm prisma migrate dev --name init`
- [ ] `pnpm start:dev`
- [ ] Swagger docs load at `http://localhost:3000/api/docs`
- [ ] Health check: `curl http://localhost:3000/`
- [ ] Can register a user via `POST /api/auth/register`
- [ ] Can log in and get access token
- [ ] Can view current user via `GET /api/auth/me` (with token)
- [ ] Refresh token works; old token invalidated after refresh
- [ ] Jest tests pass: `pnpm test`
- [ ] E2E tests pass: `pnpm test:e2e`
