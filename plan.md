# Dental Clinic Scheduling & Queue Management — Master Plan

## 1. Overview

A full-stack web application that lets patients book dental appointments remotely, lets clinic staff manage live queues and schedules, and lets administrators configure clinic operations. The system is bilingual (English LTR / Arabic RTL), uses real-time updates for queue state, and runs an automatic waitlist offer engine to fill cancellations.

**Stack**

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TypeScript + TailwindCSS + shadcn/ui + react-i18next + react-hook-form + zod + @tanstack/react-query + axios + dayjs + socket.io-client |
| Backend | NestJS 10 + Prisma + PostgreSQL + Redis + BullMQ + Passport (JWT) + Socket.IO + Nodemailer + argon2 + helmet |
| Infra (dev) | Docker Compose (postgres, redis, mailhog) |
| Methodology | Spec-Driven Development with [GitHub Spec Kit](https://github.com/github/spec-kit) |

**Repo layout**

```
.
├── .specify/        # Spec Kit constitution, templates, scripts
├── specs/           # One folder per feature: spec.md → plan.md → tasks.md
├── docker-compose.yml
├── frontend/
└── backend/
```

## 2. Goals

1. **Remote booking** — patients can self-serve appointment booking inside working hours, avoiding holidays and full slots.
2. **Reduced no-shows** — automatic email reminders and a 24-hour cancellation window.
3. **Cancellation recapture** — when a slot opens, automatically offer it to the next eligible patient on the waitlist whose available time window overlaps with the slot, with a sufficient arrival-time buffer.
4. **Real-time queue** — staff and lobby views update live as appointments transition through `PENDING → CONFIRMED → IN_PROGRESS → COMPLETED`.
5. **Operational insight** — role-scoped analytics dashboards: **Admin** sees KPI summary cards (total, completion rate, cancellation rate, no-show rate, active patients, waitlist size), appointment trends (line chart), status distribution (donut), doctor utilization (bar), busiest weekdays (bar), cancellation trends (line), and filterable data tables for appointments, follow-ups, and waitlist. **Receptionist** sees today's live KPI cards (total, in-session, waiting, completed, cancellations, pending) plus a grouped-by-doctor bar chart and filterable today/upcoming appointments tables. **Doctor** sees their own daily KPI cards (today's total, completed, remaining, in-session, no-shows), week-at-a-glance bar chart, hourly load chart, status donut, and today's schedule data table with inline status transition actions.
6. **Bilingual** — every screen and email is available in EN and AR; layout flips between LTR and RTL on language change.
7. **Secure by default** — JWT short-lived access + HTTP-only refresh cookie, RBAC on every protected route, input validation at boundaries, audit logging of staff actions.

**Non-goals (v1)**: native/hybrid mobile apps, payment processing, SMS/push notifications.

## 3. User Roles

| Role | Capabilities |
|---|---|
| **Admin** | Full access. Manages clinic config (working hours, holidays, slot duration), per-doctor schedule overrides, user accounts, and views all analytics. |
| **Receptionist** | Manages appointments and the live queue. Can book/cancel on behalf of patients, transition appointment statuses, and override the 24h cancellation rule. |
| **Doctor** | Views their own queue, transitions their own appointments (`CONFIRMED → IN_PROGRESS → COMPLETED`), adds notes. |
| **Patient** | Books appointments, joins/leaves waitlists, cancels own appointments (within rules), accepts/declines waitlist offers, views appointment history. |

## 4. Core Flows

### 4.1 Authentication

1. Patient registers → email + password (hashed with argon2id) → row inserted in `User` and `PatientProfile`.
2. Login → returns short-lived access JWT in body + sets HTTP-only `refreshToken` cookie.
3. Frontend axios interceptor catches 401 → POST `/auth/refresh` (cookie auto-sent) → retries original request.
4. Logout → clears refresh token row + cookie.
5. Forgot password → emails one-time token (1h expiry) → `/reset-password?token=...` page → posts new password → all old refresh tokens invalidated.

### 4.2 Booking an Appointment (Patient)

1. Patient picks a doctor → frontend GETs available slots for a date range.
2. Backend slot generator computes slots using: `ClinicConfig.slotDurationMinutes` × `WorkingHour[dayOfWeek]`, minus `Holiday`, minus `DoctorScheduleOverride`, minus already-booked slots, minus past times if same-day.
3. Patient selects a slot → POST `/appointments` with `Idempotency-Key` header → server re-validates window/holiday/capacity and creates `Appointment(status=PENDING)`.
4. Patient receives confirmation email; appointment auto-transitions to `CONFIRMED` after a configurable delay (or on staff confirmation).

### 4.3 Cancellation

1. Patient or receptionist requests cancellation.
2. **Patient self-cancel**: rejected if `appointment.startsAt - now < 24h`.
3. **Receptionist cancel**: always allowed (no-show or staff override) — written to `AuditLog`.
4. Successful cancel → appointment status `CANCELED` → fires `slot-opened` event → BullMQ job `waitlist-offer-engine` picks up.

### 4.4 Waitlist & Auto-Offer Engine

1. Patient with a confirmed booking can join a waitlist for the same doctor with an `availableFromTime`/`availableUntilTime` window (their defined arrival ability).
2. When a slot opens (cancellation, no-show, schedule extension):
   - BullMQ job finds the highest-priority `WaitlistEntry` for that doctor whose window covers the slot start time **and** has sufficient arrival buffer (`now + minArrivalMinutes ≤ slot.startsAt`).
   - Creates `WaitlistOffer(status=PENDING, expiresAt = now + offerWindowMinutes)`.
   - Emails the patient with accept/decline links.
3. On accept: original confirmed appointment is canceled, new appointment created at the offered slot, waitlist entry removed.
4. On decline or expiry: status updated, job re-queues to find next eligible patient.
5. If no eligible patient found, slot remains open for normal booking.

### 4.5 Live Queue

1. Each doctor has a Socket.IO room `doctor:<id>`.
2. Doctor / receptionist clients subscribe on login.
3. Status transitions write to DB and emit `queue.updated` to the room.
4. Lobby display (read-only, no auth) subscribes via signed kiosk token to a single doctor's queue.

### 4.6 Reminders

1. On appointment creation, BullMQ schedules a `reminder` job at `startsAt - reminderHours`.
2. Job sends email via Nodemailer; idempotent — skips if status is `CANCELED` or already `COMPLETED`.

### 4.7 Internationalization

1. Initial language detected from browser; stored in `localStorage`.
2. Switcher → `i18n.changeLanguage('ar')` → `<html lang>` and `<html dir>` updated.
3. All strings in `i18n/en.json` + `i18n/ar.json`. Logical CSS properties throughout (`margin-inline-start`, `text-start`).
4. Backend emails rendered from per-locale templates based on the user's stored language preference.

## 5. Edge Cases

| Area | Edge case | Handling |
|---|---|---|
| Booking | Slot booked between availability check and POST | Server re-validates inside a transaction with a unique constraint on `(doctorId, startsAt)` for non-canceled rows; returns 409 on conflict. |
| Booking | Patient retries due to network error | `Idempotency-Key` header; second request returns the same appointment. |
| Booking | DST transition crosses midnight | All slot math in UTC; clinic timezone applied only at display + working-hour rule evaluation. |
| Cancellation | Receptionist tries to cancel an `IN_PROGRESS` appointment | Allowed, logged with reason in AuditLog; queue updated immediately. |
| Cancellation | Concurrent cancel + status change | Optimistic lock via `updatedAt` check; loser retries. |
| Waitlist | Patient on waitlist also has the existing slot at the same time as the offer | Offer engine cancels old slot atomically with new booking; never holds two confirmed slots. |
| Waitlist | Slot opens too close to current time (no arrival buffer for anyone) | Engine skips offers, leaves slot open; logs `no_eligible_patient`. |
| Waitlist | Patient declines, offer expires before next eligible found | Re-enqueues immediately on decline/expiry. |
| Queue | Doctor offline when status changes | Socket.IO buffers nothing; client refetches on reconnect via `useQuery({ refetchOnReconnect: true })`. |
| Auth | Refresh token reuse (stolen cookie) | Refresh tokens rotate; reuse of an old token invalidates all tokens for the user and forces re-login. |
| Auth | Password reset token used twice | Single-use; deleted after consumption. |
| i18n | Untranslated key | i18next `fallbackLng: 'en'`; missing-key handler logs to backend in dev. |
| Reminders | Patient cancels after reminder scheduled | Worker checks status before sending. |
| Analytics | Time zone for trend buckets | Server aggregates in clinic timezone, not UTC; dashboard date-picker uses same. |

## 6. Frontend Pages & Components

**Detailed specification of all frontend pages, components, and hooks is in [FRONTEND_PLAN.md](FRONTEND_PLAN.md).**

Routes are role-gated by `<ProtectedRoute roles={[...]}>`. Layout shells (`AdminLayout`, `PatientLayout`, `DoctorLayout`, `ReceptionistLayout`) provide navigation; all share `LanguageSwitcher` and `<html dir>` toggle.

**Page organization**:
- **Public**: Landing, Login, Register, Forgot Password, Reset Password, Lobby Queue
- **All Auth**: Profile
- **Patient**: Booking, Appointments, Waitlist, Offer Accept/Decline
- **Doctor**: Queue, Today's Schedule
- **Receptionist/Admin**: Queue, Appointments, Patients, Walk-In Booking
- **Admin**: Dashboard, Clinic Settings, Doctors, Users, Audit Log
- **Errors**: 403 Forbidden, 404 Not Found

**Progress tracking**: See [FRONTEND_PROGRESS.md](FRONTEND_PROGRESS.md) for implementation status.

## 7. Backend Modules

**Detailed specification of all backend modules, responsibilities, and endpoints is in [BACKEND_PLAN.md](BACKEND_PLAN.md).**

NestJS modules under `backend/src/`:

1. **AuthModule** — Register, login, JWT issuance, refresh-token rotation, logout, password reset
2. **UsersModule** — User CRUD, profile updates, language preference, password change
3. **DoctorsModule** — Doctor profiles, schedule overrides, public directory
4. **ClinicConfigModule** — Clinic config (slot duration, timezone), working hours, holidays
5. **AppointmentsModule** — Slot generation, booking, validation, status transitions, cancellation
6. **WaitlistModule** — Waitlist entries, availability windows, offer accept/decline
7. **WaitlistOfferEngineModule** — BullMQ processor for auto-offer engine
8. **QueueModule** — Socket.IO gateway (room-per-doctor), kiosk tokens
9. **NotificationsModule** — Nodemailer, per-locale templates, BullMQ queues
10. **AnalyticsModule** — Trends, status distribution, doctor utilization, follow-ups
11. **AuditModule** — Immutable audit logs
12. **PrismaModule** — Database connection lifecycle
13. **Common** — Guards, decorators, interceptors, filters

**Progress tracking**: See [BACKEND_PROGRESS.md](BACKEND_PROGRESS.md) for implementation status.

## 8. API Contracts (Swagger / OpenAPI)

**All API endpoints and contracts are documented in detail in [BACKEND_PLAN.md — API Contracts](BACKEND_PLAN.md#api-contracts-swagger).**

**Key points**:
- All endpoints prefixed with `/api`
- Responses wrapped as `{ data, statusCode }`; errors as `{ statusCode, message, error, timestamp, path }`
- Swagger UI at `/api/docs`
- Socket.IO namespace `/queue` with JWT or kiosk-token auth
- Idempotency-Key header support for booking endpoints
- OpenAPI decorators: `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`, `@ApiCookieAuth`

**Frontend integration**: See [FRONTEND_PLAN.md — API Integration](FRONTEND_PLAN.md#api-integration) for how frontend consumes APIs via axios hooks and Socket.IO listeners.

## 9. Prisma Schema (overall)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  RECEPTIONIST
  DOCTOR
  PATIENT
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELED
  NO_SHOW
}

enum WaitlistOfferStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

enum Locale {
  EN
  AR
}

model User {
  id                  String   @id @default(cuid())
  email               String   @unique
  hashedPassword      String
  firstName           String
  lastName            String
  role                Role
  preferredLocale     Locale   @default(EN)
  isActive            Boolean  @default(true)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  refreshTokens       RefreshToken[]
  passwordResetTokens PasswordResetToken[]
  doctorProfile       DoctorProfile?
  patientProfile      PatientProfile?
  auditLogs           AuditLog[]      @relation("AuditActor")
}

model RefreshToken {
  id         String   @id @default(cuid())
  userId     String
  tokenHash  String   @unique
  expiresAt  DateTime
  revokedAt  DateTime?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model PasswordResetToken {
  id         String   @id @default(cuid())
  userId     String
  tokenHash  String   @unique
  expiresAt  DateTime
  usedAt     DateTime?
  createdAt  DateTime @default(now())
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model DoctorProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  licenseNumber   String
  specialization  String
  bio             String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user              User                       @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointments      Appointment[]
  scheduleOverrides DoctorScheduleOverride[]
  waitlistEntries   WaitlistEntry[]
}

model PatientProfile {
  id            String    @id @default(cuid())
  userId        String    @unique
  phoneNumber   String?
  dateOfBirth   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  appointments    Appointment[]
  waitlistEntries WaitlistEntry[]
}

model ClinicConfig {
  id                  String   @id @default(cuid())
  slotDurationMinutes Int      @default(30)
  timeZone            String   @default("UTC")
  reminderHoursBefore Int      @default(24)
  offerWindowMinutes  Int      @default(30)
  minArrivalMinutes   Int      @default(45)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model WorkingHour {
  id         String   @id @default(cuid())
  dayOfWeek  Int      // 0-6 (Sunday-Saturday)
  startTime  String   // HH:MM
  endTime    String   // HH:MM
  isClosed   Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([dayOfWeek])
}

model Holiday {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([date])
}

model DoctorScheduleOverride {
  id          String   @id @default(cuid())
  doctorId    String
  date        DateTime @db.Date
  startTime   String?  // null when doctor is unavailable that day
  endTime     String?
  reason      String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  doctor      DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([doctorId, date])
  @@index([date])
}

model Appointment {
  id              String            @id @default(cuid())
  doctorId        String
  patientId       String
  startsAt        DateTime
  endsAt          DateTime
  status          AppointmentStatus @default(PENDING)
  notes           String?
  idempotencyKey  String?           @unique
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  canceledAt      DateTime?
  canceledById    String?
  cancelReason    String?

  doctor          DoctorProfile     @relation(fields: [doctorId], references: [id])
  patient         PatientProfile    @relation(fields: [patientId], references: [id])

  @@index([doctorId, startsAt])
  @@index([patientId])
  @@index([status])
}

model WaitlistEntry {
  id                 String   @id @default(cuid())
  patientId          String
  doctorId           String
  availableFromTime  String?  // HH:MM, null = flexible
  availableUntilTime String?  // HH:MM
  position           Int      // priority within (doctorId)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  patient           PatientProfile  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  doctor            DoctorProfile   @relation(fields: [doctorId], references: [id], onDelete: Cascade)
  offers            WaitlistOffer[]

  @@unique([patientId, doctorId])
  @@index([doctorId, position])
}

model WaitlistOffer {
  id              String              @id @default(cuid())
  waitlistEntryId String
  appointmentSlot DateTime
  status          WaitlistOfferStatus @default(PENDING)
  expiresAt       DateTime
  respondedAt     DateTime?
  acceptedAppointmentId String?       @unique
  createdAt       DateTime            @default(now())

  waitlistEntry   WaitlistEntry       @relation(fields: [waitlistEntryId], references: [id], onDelete: Cascade)

  @@index([status, expiresAt])
}

model AuditLog {
  id        String   @id @default(cuid())
  actorId   String
  action    String   // e.g. "APPOINTMENT_CREATED", "APPOINTMENT_CANCELED"
  target    String   // entity type
  targetId  String
  payload   Json?
  createdAt DateTime @default(now())

  actor     User     @relation("AuditActor", fields: [actorId], references: [id])

  @@index([actorId])
  @@index([target, targetId])
  @@index([createdAt])
}
```

## 10. Verification Checklist

Implementation is "done" when each of the following passes end-to-end on a clean clone:

- `docker compose up -d` brings up postgres, redis, mailhog.
- `pnpm --dir backend prisma migrate dev` succeeds; seeds an admin + at least one doctor.
- Backend starts (`pnpm --dir backend start:dev`) and Swagger renders at `http://localhost:3000/api/docs`.
- Frontend dev server (`pnpm --dir frontend dev`) loads at `http://localhost:5173`.
- Patient can register, log in, book a slot, see it in `/appointments`, cancel it (>24h away).
- Patient can join waitlist; cancellation triggers an offer email visible in MailHog (`http://localhost:8025`); accepting it cancels the old slot and creates a new appointment atomically.
- Doctor sees the appointment in `/doctor/queue`, transitions it through statuses, and the receptionist tab updates live.
- Admin sets a holiday and a doctor override; booking page hides those slots.
- Language switcher flips `<html dir>` to `rtl` and Arabic strings render; emails arrive in the correct language.
- Backend Jest unit + e2e tests pass; frontend `pnpm build` and `pnpm test` pass.

---

## Progress Tracking

Keep track of implementation progress:
- **[BACKEND_PROGRESS.md](BACKEND_PROGRESS.md)** — Module completion, API endpoint status, tests, migrations
- **[FRONTEND_PROGRESS.md](FRONTEND_PROGRESS.md)** — Page completion, component status, API integration, i18n translations

---

## Detailed Plans

For detailed specifications on implementation:
- **[BACKEND_PLAN.md](BACKEND_PLAN.md)** — NestJS modules, API contracts, Prisma schema, testing strategy, environment setup
- **[FRONTEND_PLAN.md](FRONTEND_PLAN.md)** — React pages, components, hooks, API integration, i18n, forms, state management
