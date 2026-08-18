# Spec: NotificationsModule (`backend/src/notifications/`)

**Type**: Backend NestJS Module (Nodemailer + BullMQ Email Processor)  
**Plan reference**: [BACKEND_PLAN.md — §9 NotificationsModule](../../BACKEND_PLAN.md#9-notificationsmodule)  
**Frontend specs consumed**:
- [004-forgot-password-page](../004-forgot-password-page/spec.md) — triggers `password-reset` email
- [005-reset-password-page](../005-reset-password-page/spec.md) — destination of the password-reset email link
- [013-waitlist-offer-page](../013-waitlist-offer-page/spec.md) — destination of the waitlist-offer email link
- [009-profile-page](../009-profile-page/spec.md) — user sets `preferredLocale` (en/ar) which determines email language
- Booking pages (010, 017) — trigger `appointment-confirmation` email on booking

> **Frontend implementation status**: Specs 004, 005, 009, 013 are written. Ask the user whether these pages are already implemented before finalising Phase 3 integration details.

---

## Overview

NotificationsModule owns all outbound email communication for the clinic. It provides:

1. **A `NotificationsService`** — synchronous entry point that enqueues email jobs into BullMQ queues. Other modules call this service and return immediately; actual sending is handled asynchronously.
2. **A `NotificationsProcessor`** — BullMQ processor that dequeues jobs, renders locale-specific templates, and sends email via Nodemailer.
3. **Per-locale email templates** — plain-text + HTML templates for four event types in English (`en`) and Arabic (`ar`).
4. **Four BullMQ queues** — `password-reset`, `appointment-confirmation`, `reminder`, `waitlist-offer`.

All email jobs are idempotent: the processor checks whether the triggering entity (appointment, offer, token) is still valid before sending. Stale or canceled records cause the job to be silently dropped.

---

## Phase 1 — DTOs, Validation & Service Interfaces

### 1.1 File Map

```
backend/src/notifications/
├── notifications.module.ts
├── notifications.service.ts          ← enqueue jobs
├── notifications.processor.ts        ← BullMQ worker / email sender
├── template.service.ts               ← loads + renders Handlebars templates
└── templates/
    ├── en/
    │   ├── password-reset.hbs
    │   ├── appointment-confirmation.hbs
    │   ├── appointment-reminder.hbs
    │   └── waitlist-offer.hbs
    └── ar/
        ├── password-reset.hbs
        ├── appointment-confirmation.hbs
        ├── appointment-reminder.hbs
        └── waitlist-offer.hbs
```

> Templates are Handlebars (`.hbs`) files so that variable interpolation and simple conditionals are available without a compile step. Each file contains both a `subject` line (first line, prefixed `{{!-- subject: ... --}}`) and the HTML body.

---

### 1.2 BullMQ Queue Names

| Constant | Queue Name | Triggered By |
|---|---|---|
| `QUEUE_PASSWORD_RESET` | `password-reset` | `AuthService.forgotPassword()` |
| `QUEUE_APPOINTMENT_CONFIRMATION` | `appointment-confirmation` | `AppointmentsService.createAppointment()` |
| `QUEUE_REMINDER` | `reminder` | `AppointmentsService.createAppointment()` (delayed job) |
| `QUEUE_WAITLIST_OFFER` | `waitlist-offer` | `WaitlistOfferEngineService.createOffer()` |

Export these as string constants from `notifications.module.ts` so caller modules can reference them without hard-coding strings.

---

### 1.3 Job Payload DTOs

Each queue has a typed payload interface. These are **not HTTP DTOs** (no `class-validator`); they are internal TypeScript interfaces used to type BullMQ `Job<T>` generics.

#### `PasswordResetJobPayload`

```typescript
interface PasswordResetJobPayload {
  userId: string;           // UUID — used to load user + locale
  tokenId: string;          // UUID of the PasswordResetToken row
  resetUrl: string;         // full URL: ${FRONTEND_URL}/reset-password?token=<raw-token>
  locale: 'en' | 'ar';
}
```

#### `AppointmentConfirmationJobPayload`

```typescript
interface AppointmentConfirmationJobPayload {
  appointmentId: string;    // UUID — processor re-reads appointment to guard against cancellation
  patientUserId: string;
  locale: 'en' | 'ar';
}
```

#### `ReminderJobPayload`

```typescript
interface ReminderJobPayload {
  appointmentId: string;    // UUID — processor checks status before sending
  patientUserId: string;
  locale: 'en' | 'ar';
}
```

#### `WaitlistOfferJobPayload`

```typescript
interface WaitlistOfferJobPayload {
  offerId: string;          // UUID — processor checks offer.status = PENDING before sending
  patientUserId: string;
  offerUrl: string;         // full URL: ${FRONTEND_URL}/offers/<offerId>
  locale: 'en' | 'ar';
}
```

---

### 1.4 `NotificationsService` API

`NotificationsService` is **exported** from `NotificationsModule` so other modules can inject it.

```typescript
@Injectable()
export class NotificationsService {
  /**
   * Queue a password-reset email. Fire-and-forget.
   */
  async queuePasswordReset(payload: PasswordResetJobPayload): Promise<void>;

  /**
   * Queue an appointment confirmation email. Fire-and-forget.
   */
  async queueAppointmentConfirmation(
    payload: AppointmentConfirmationJobPayload,
  ): Promise<void>;

  /**
   * Queue a reminder email with a delay so it fires `reminderHours` before the appointment.
   * The delay is computed as: max(0, startsAt.getTime() - reminderHours * 3_600_000 - Date.now())
   */
  async queueReminder(
    payload: ReminderJobPayload,
    startsAt: Date,
    reminderHours: number,
  ): Promise<void>;

  /**
   * Queue a waitlist-offer email. Fire-and-forget.
   */
  async queueWaitlistOffer(payload: WaitlistOfferJobPayload): Promise<void>;
}
```

**BullMQ job options**:

| Queue | `attempts` | `backoff` | `delay` |
|---|---|---|---|
| `password-reset` | 3 | exponential, 2 000 ms | 0 |
| `appointment-confirmation` | 3 | exponential, 2 000 ms | 0 |
| `reminder` | 3 | exponential, 5 000 ms | computed (see `queueReminder`) |
| `waitlist-offer` | 3 | exponential, 2 000 ms | 0 |

If `delay ≤ 0` for reminders (appointment is too close), the job is enqueued immediately with `delay: 0`.

---

### 1.5 `NotificationsProcessor`

```typescript
@Processor('password-reset')
@Processor('appointment-confirmation')
@Processor('reminder')
@Processor('waitlist-offer')
export class NotificationsProcessor {
  @Process()
  async handlePasswordReset(job: Job<PasswordResetJobPayload>): Promise<void>;

  @Process()
  async handleAppointmentConfirmation(
    job: Job<AppointmentConfirmationJobPayload>,
  ): Promise<void>;

  @Process()
  async handleReminder(job: Job<ReminderJobPayload>): Promise<void>;

  @Process()
  async handleWaitlistOffer(job: Job<WaitlistOfferJobPayload>): Promise<void>;
}
```

**Idempotency guards** (processor checks before sending):

| Handler | Guard condition | On failure |
|---|---|---|
| `handlePasswordReset` | `PasswordResetToken` with `tokenId` exists AND `usedAt IS NULL` AND `expiresAt > now` | Skip send; log `token_expired_or_used` |
| `handleAppointmentConfirmation` | `Appointment` with `appointmentId` has status ≠ `CANCELED` | Skip send; log `appointment_canceled` |
| `handleReminder` | `Appointment` status is `CONFIRMED` or `IN_PROGRESS` | Skip send; log `appointment_not_active` |
| `handleWaitlistOffer` | `WaitlistOffer` with `offerId` has status = `PENDING` | Skip send; log `offer_not_pending` |

---

### 1.6 `TemplateService`

Renders Handlebars templates for a given event type and locale.

```typescript
@Injectable()
export class TemplateService {
  /**
   * Load and render a template. Returns { subject, html, text }.
   * `text` is derived by stripping HTML tags from the rendered html.
   */
  render(
    templateName: 'password-reset'
               | 'appointment-confirmation'
               | 'appointment-reminder'
               | 'waitlist-offer',
    locale: 'en' | 'ar',
    variables: Record<string, unknown>,
  ): { subject: string; html: string; text: string };
}
```

Templates are **read from disk at startup** (not on every render call) and cached in memory. If a locale file is missing, `TemplateService` falls back to `en`.

---

### 1.7 Template Variables

#### `password-reset.hbs`

| Variable | Type | Example |
|---|---|---|
| `firstName` | string | `"Sara"` |
| `resetUrl` | string | `"http://localhost:5173/reset-password?token=abc123"` |
| `expiresInMinutes` | number | `60` |
| `clinicName` | string | `"Bright Smile Dental"` |

#### `appointment-confirmation.hbs`

| Variable | Type | Example |
|---|---|---|
| `firstName` | string | `"Ahmad"` |
| `doctorName` | string | `"Dr. Reem Al-Farsi"` |
| `date` | string | `"Monday, 5 May 2026"` (locale-formatted) |
| `time` | string | `"10:30 AM"` (clinic timezone) |
| `clinicName` | string | `"Bright Smile Dental"` |
| `myAppointmentsUrl` | string | `"http://localhost:5173/my-appointments"` |

#### `appointment-reminder.hbs`

| Variable | Type | Example |
|---|---|---|
| `firstName` | string | `"Ahmad"` |
| `doctorName` | string | `"Dr. Reem Al-Farsi"` |
| `date` | string | `"Monday, 5 May 2026"` |
| `time` | string | `"10:30 AM"` |
| `hoursUntil` | number | `24` |
| `clinicName` | string | `"Bright Smile Dental"` |
| `myAppointmentsUrl` | string | `"http://localhost:5173/my-appointments"` |

#### `waitlist-offer.hbs`

| Variable | Type | Example |
|---|---|---|
| `firstName` | string | `"Sara"` |
| `doctorName` | string | `"Dr. Reem Al-Farsi"` |
| `date` | string | `"Monday, 5 May 2026"` |
| `time` | string | `"10:30 AM"` |
| `offerUrl` | string | `"http://localhost:5173/offers/uuid-here"` |
| `expiresAt` | string | `"2026-05-05T14:00:00.000Z"` (ISO) |
| `clinicName` | string | `"Bright Smile Dental"` |

---

### 1.8 Nodemailer Transport Configuration

```typescript
// Created in NotificationsModule.register() from env vars
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,         // 'localhost' in dev
  port: Number(process.env.SMTP_PORT), // 1025 in dev (MailHog)
  secure: process.env.NODE_ENV === 'production',
  auth: process.env.NODE_ENV === 'production'
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});
```

In development, all emails are captured by **MailHog** at `http://localhost:8025`. No actual email is sent.

**Send options** (common to all handlers):

```typescript
await transporter.sendMail({
  from: `"Bright Smile Dental" <${process.env.SMTP_FROM}>`,
  to: recipientEmail,
  subject: rendered.subject,
  html: rendered.html,
  text: rendered.text,
});
```

---

### 1.9 `NotificationsModule` Registration

```typescript
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'password-reset' },
      { name: 'appointment-confirmation' },
      { name: 'reminder' },
      { name: 'waitlist-offer' },
    ),
    PrismaModule,
  ],
  providers: [NotificationsService, NotificationsProcessor, TemplateService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
```

`BullModule.forRoot()` (Redis connection) is registered once in `AppModule`. The four queues here use the shared Redis connection.

---

### 1.10 Environment Variables

| Variable | Purpose | Dev Default |
|---|---|---|
| `SMTP_HOST` | SMTP server hostname | `localhost` |
| `SMTP_PORT` | SMTP server port | `1025` |
| `SMTP_FROM` | Sender address | `noreply@dentalclinic.local` |
| `SMTP_USER` | SMTP auth user (prod only) | — |
| `SMTP_PASS` | SMTP auth password (prod only) | — |
| `FRONTEND_URL` | Base URL for email links | `http://localhost:5173` |

Add to `backend/.env.example`:
```
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@dentalclinic.local
# SMTP_USER=  # production only
# SMTP_PASS=  # production only
FRONTEND_URL=http://localhost:5173
```

---

### 1.11 Integration Points (Callers of NotificationsService)

| Triggering Action | Module | Method Called |
|---|---|---|
| `POST /api/auth/forgot-password` | AuthModule | `queuePasswordReset(...)` |
| `POST /api/appointments` (booking) | AppointmentsModule | `queueAppointmentConfirmation(...)` + `queueReminder(...)` |
| `WaitlistOfferEngineService.createOffer()` | WaitlistOfferEngineModule | `queueWaitlistOffer(...)` |

`AppointmentsModule` reads `ClinicConfig.reminderHours` and passes it to `queueReminder()`. If `reminderHours` is 0 or if the appointment is already past the reminder threshold, the reminder job is enqueued immediately with `delay: 0` (processor guard will still run).

---

## Phase 2 — Unit & E2E Tests

### 2.1 Unit Tests: `TemplateService` (`src/notifications/template.service.spec.ts`)

| Scenario | Expected |
|---|---|
| Render `password-reset` / `en` with all variables | Returns non-empty `html`, `text`, `subject` |
| Render `appointment-confirmation` / `ar` | Returns Arabic subject string |
| Render `waitlist-offer` / `en` | `html` contains `offerUrl` value |
| Render `appointment-reminder` / `en` | `html` contains `hoursUntil` value |
| `locale = 'ar'` file missing (simulate) | Falls back to `en` template; no throw |
| Unknown `templateName` | Throws `Error('Template not found')` |
| `variables` has extra fields | Rendered without error (Handlebars ignores unknowns) |
| `variables` missing a required field | Handlebars renders empty string for that variable; no throw |

---

### 2.2 Unit Tests: `NotificationsService` (`src/notifications/notifications.service.spec.ts`)

Mock the four BullMQ queues as `{ add: jest.fn() }`. Do not test actual email delivery here.

| Method | Scenario | Expected |
|---|---|---|
| `queuePasswordReset` | Called with valid payload | `passwordResetQueue.add()` called once with correct payload and options |
| `queueAppointmentConfirmation` | Called with valid payload | `confirmationQueue.add()` called once |
| `queueReminder` | `startsAt` 24 h in future, `reminderHours = 24` | `reminderQueue.add()` called with `delay ≈ 0` (fire ~now) |
| `queueReminder` | `startsAt` 48 h in future, `reminderHours = 24` | `reminderQueue.add()` called with `delay ≈ 86_400_000 ms` |
| `queueReminder` | `startsAt` is past (already over) | `reminderQueue.add()` called with `delay: 0` |
| `queueWaitlistOffer` | Called with valid payload | `waitlistOfferQueue.add()` called once |
| All methods | BullMQ `.add()` rejects | Error is propagated (not swallowed) |

---

### 2.3 Unit Tests: `NotificationsProcessor` (`src/notifications/notifications.processor.spec.ts`)

Mock `PrismaService`, `TemplateService`, and the Nodemailer transporter. Use `createMock<Job<T>>()` to construct BullMQ job mocks.

#### `handlePasswordReset`

| Scenario | DB State | Expected |
|---|---|---|
| Valid token, not used, not expired | Token found; `usedAt = null`; `expiresAt > now` | Transporter `sendMail` called once; `to` = patient email |
| Token already used | `usedAt != null` | `sendMail` NOT called; logs `token_expired_or_used` |
| Token expired | `expiresAt < now` | `sendMail` NOT called; logs `token_expired_or_used` |
| Token row not found | `null` from Prisma | `sendMail` NOT called |
| Transporter throws `ECONNREFUSED` | — | Job throws so BullMQ retries |

#### `handleAppointmentConfirmation`

| Scenario | DB State | Expected |
|---|---|---|
| Appointment is `PENDING` | Found; status = PENDING | `sendMail` called; subject includes doctor name |
| Appointment is `CONFIRMED` | Found; status = CONFIRMED | `sendMail` called |
| Appointment is `CANCELED` | Found; status = CANCELED | `sendMail` NOT called; logs `appointment_canceled` |
| Appointment not found | Null | `sendMail` NOT called |

#### `handleReminder`

| Scenario | DB State | Expected |
|---|---|---|
| Appointment is `CONFIRMED` | — | `sendMail` called |
| Appointment is `COMPLETED` | — | `sendMail` NOT called; logs `appointment_not_active` |
| Appointment is `CANCELED` | — | `sendMail` NOT called |
| Appointment is `PENDING` | — | `sendMail` NOT called (only CONFIRMED / IN_PROGRESS) |

#### `handleWaitlistOffer`

| Scenario | DB State | Expected |
|---|---|---|
| Offer is `PENDING` | — | `sendMail` called; `to` = patient email |
| Offer is `ACCEPTED` | — | `sendMail` NOT called; logs `offer_not_pending` |
| Offer is `EXPIRED` | — | `sendMail` NOT called |
| Offer not found | Null | `sendMail` NOT called |

---

### 2.4 E2E Tests (`test/notifications.e2e-spec.ts`)

Test environment: full NestJS bootstrap with real PostgreSQL (test DB), real Redis (BullMQ), and **MailHog** for SMTP capture. Emails are read from MailHog's API at `http://localhost:8025/api/v2/messages`.

Seed helpers (extend `test/helpers/seed.ts`):
- `seedPatient()` — creates `User` (role PATIENT) + `PatientProfile`; returns `{ user, accessToken }`
- `seedDoctor()` — creates `User` (role DOCTOR) + `DoctorProfile`
- `seedAppointment(patientId, doctorId, startsAt, status?)` — inserts `Appointment` row
- `clearMailhog()` — `DELETE http://localhost:8025/api/v1/messages`

#### Flow 1 — Password Reset Email

```
POST /api/auth/forgot-password  { email: patient.email }
  → 200 (always, even if email unknown)

Wait for BullMQ job to process (poll MailHog, timeout 5s)

GET http://localhost:8025/api/v2/messages
  → at least 1 message
  → messages[0].To[0].Mailbox = patient.email (local part)
  → messages[0].Content.Body contains resetUrl substring '/reset-password?token='
  → subject contains 'password' (case-insensitive)
```

#### Flow 2 — Password Reset Email Not Sent for Unknown Email

```
POST /api/auth/forgot-password  { email: 'nobody@example.com' }
  → 200

Wait 2s
GET http://localhost:8025/api/v2/messages
  → total count = 0 (no email sent for unknown address)
```

#### Flow 3 — Appointment Confirmation Email

```
seed: doctor-A, patient-B

POST /api/appointments  { doctorId: doctor-A.id, startsAt: <tomorrow 10:00> }
  (as patient-B)
  → 201

Wait for BullMQ job

GET MailHog messages
  → 1 email to patient-B.email
  → subject contains 'confirmation' or 'appointment' (case-insensitive)
  → body contains doctor-A name
  → body contains '/my-appointments' link
```

#### Flow 4 — Confirmation Not Sent for Canceled Appointment

```
seed: appointment-X (patient-B, doctor-A) — CANCELED

Manually enqueue confirmation job for appointment-X
  (simulate a race condition: booked then immediately canceled)

Wait for job to process

GET MailHog messages
  → 0 emails (guard skipped send)
```

#### Flow 5 — Reminder Email Delayed

```
seed: doctor-A, patient-B
  appointment at now + 25h
  ClinicConfig.reminderHours = 24

POST /api/appointments  → creates appointment + queues reminder with delay ≈ 1h

Wait 2s (reminder not yet fired)
GET MailHog messages → only confirmation email present (no reminder yet)

(Full delayed delivery is not tested in e2e — delay duration is a unit-level concern)
```

#### Flow 6 — Waitlist Offer Email

```
seed: doctor-A, patient-B in waitlist
  WaitlistOfferEngineService.createOffer() called → offer created → email queued

Wait for BullMQ job

GET MailHog messages
  → 1 email to patient-B.email
  → body contains '/offers/' link
  → body contains doctor-A name
```

#### Flow 7 — Arabic Locale Email

```
seed: patient-C with preferredLocale = 'ar'

POST /api/auth/forgot-password  { email: patient-C.email }
  → wait for job

GET MailHog messages
  → messages[0].Content.Body does NOT start with 'Dear' (English greeting)
  → subject is in Arabic characters (or at least contains Arabic glyphs)
```

#### Flow 8 — SMTP Failure Triggers Retry

```
Temporarily disable MailHog / set invalid SMTP port in test

Enqueue a confirmation job

Wait for retry attempts (BullMQ back-off)
  → job attempts > 1 in BullMQ job state

Restore SMTP

→ job eventually succeeds and email arrives
```

---

### 2.5 Test Setup & Teardown

```typescript
// test/notifications.e2e-spec.ts (outline)
let app: INestApplication;
let prisma: PrismaService;

beforeAll(async () => {
  app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  prisma = app.get(PrismaService);
  await app.init();
});

beforeEach(async () => {
  await clearMailhog();  // DELETE /api/v1/messages
});

afterEach(async () => {
  await prisma.appointment.deleteMany();
  await prisma.waitlistOffer.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await app.close();
});

// Helper: poll MailHog until n messages arrive or timeout
async function waitForEmails(count = 1, timeoutMs = 5000): Promise<MailhogMessage[]> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch('http://localhost:8025/api/v2/messages');
    const body = await res.json();
    if (body.total >= count) return body.items;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Expected ${count} email(s) but got none within ${timeoutMs}ms`);
}
```

---

## Phase 3 — Frontend Integration

> **Frontend implementation status**: Specs 004 (forgot-password), 005 (reset-password), 009 (profile), and 013 (waitlist-offer) are written. Ask the user whether these pages are already implemented before confirming integration requirements.

---

### 3.1 Email-Driven Frontend Flows

NotificationsModule drives four frontend touchpoints via email links. The backend generates these URLs using `FRONTEND_URL` from env.

| Email Type | Link Pattern | Frontend Destination | Auth Required |
|---|---|---|---|
| Password Reset | `/reset-password?token=<raw-token>` | ResetPasswordPage (005) | None (token auth) |
| Waitlist Offer | `/offers/<offerId>` | WaitlistOfferPage (013) | JWT (patient) |
| Appointment Confirmation | `/my-appointments` | MyAppointmentsPage | JWT (patient) |
| Appointment Reminder | `/my-appointments` | MyAppointmentsPage | JWT (patient) |

---

### 3.2 Password Reset Flow (Frontend ↔ Backend)

```
[ForgotPasswordPage]
  POST /api/auth/forgot-password  { email }
  ← 200 { message: 'If that email exists, a reset link was sent.' }
  → Show "Check your email" message regardless of response

[Email received by patient]
  Link: http://localhost:5173/reset-password?token=<raw-token>

[ResetPasswordPage]
  Reads token from query string: useSearchParams().get('token')
  POST /api/auth/reset-password  { token, newPassword, confirmPassword }
  ← 200 → redirect to /login with success toast
  ← 400 (invalid/expired token) → show inline error "This link has expired or is invalid."
```

**Backend contract**:
- `POST /api/auth/forgot-password` always returns `200` (security — no user enumeration).
- `POST /api/auth/reset-password` returns `400` with `message: 'Token is invalid or expired'` when the token row is missing, already used, or past its expiry.
- Token is **single-use**: the processor sets `usedAt` before sending the email? No — `usedAt` is set by `AuthService.resetPassword()` when the token is consumed. The notification processor only checks whether `usedAt IS NULL` to decide whether to send.

---

### 3.3 Waitlist Offer Flow (Frontend ↔ Backend)

```
[Email received by patient]
  Link: http://localhost:5173/offers/<offerId>

[WaitlistOfferPage] — requires JWT auth
  If user is not logged in → redirect to /login?redirect=/offers/<offerId>

  GET /api/waitlist/offers/<offerId>
  ← 200 { offerId, doctorName, date, time, status, expiresAt }
  ← 404 if offerId not found or does not belong to this patient

  If offer.status ≠ 'PENDING':
    Show "This offer has already been accepted, declined, or expired."

  If offer.status = 'PENDING' and now > offer.expiresAt:
    Show "This offer has expired."
    (Backend will also reject accept/decline with 409)

  User clicks "Accept":
    POST /api/waitlist/offers/<offerId>/accept
    ← 200 → show success + redirect to /my-appointments
    ← 409 (slot taken) → show "This slot was taken before you could accept. You remain on the waitlist."

  User clicks "Decline":
    POST /api/waitlist/offers/<offerId>/decline
    ← 200 → show "Offer declined. We'll notify you when another slot opens."
```

**Backend contract**:
- `GET /api/waitlist/offers/:offerId` requires the patient's JWT. Returns `403` if the offer belongs to a different patient.
- Accept/decline are idempotent on repeated calls for already-resolved offers.

---

### 3.4 Appointment Confirmation & Reminder (Frontend ↔ Backend)

These emails have no interactive backend integration — they contain a deep link to the patient's appointment list. The frontend only needs to ensure the `/my-appointments` page is accessible to authenticated patients.

The email body must include:
- Doctor name
- Appointment date and time (in clinic timezone)
- A clearly visible "View My Appointments" CTA button linking to `${FRONTEND_URL}/my-appointments`

The reminder email additionally includes:
- A "how many hours until" message (e.g., "Your appointment is in 24 hours")

---

### 3.5 Locale Preference Integration

The `preferredLocale` field on the `User` entity (`'en' | 'ar'`) controls which template folder is used. This is set from the Profile page (009).

**Frontend responsibility**:
- `PATCH /api/users/:id` with `{ preferredLocale: 'ar' }` updates the user's locale.
- The profile page should show a language selector that persists this setting.
- The UI locale and the email locale are separate concerns — the email locale follows `preferredLocale`; the UI locale follows whatever the frontend i18n system decides (e.g., from `localStorage`).

**Backend contract**:
- All `queueXxx()` calls pass `locale: user.preferredLocale` (or default `'en'` if not set).
- `TemplateService` falls back to `en` if the locale directory lacks the requested template.

---

### 3.6 Email Template Design Requirements

All templates must satisfy:

- **Responsive HTML** — renders on mobile devices (patients check email on phones).
- **RTL support** — Arabic templates use `dir="rtl"` on the `<html>` tag and appropriate font stacks.
- **Plain-text fallback** — every email includes a `text` part for clients that block HTML.
- **No tracking pixels** — clinic policy: no open/click tracking.
- **Unsubscribe footer** — display the clinic contact info; transactional emails are exempt from unsubscribe links under most jurisdictions, but a contact email should be present.

---

### 3.7 Development Testing Workflow

During development, all emails land in **MailHog** at `http://localhost:8025`. To test each email type:

| Action | Triggers email |
|---|---|
| `POST /api/auth/forgot-password` | Password reset |
| `POST /api/appointments` | Appointment confirmation + scheduled reminder |
| Cancel appointment that has a waitlist entry | Waitlist offer (via `WaitlistOfferEngineModule`) |

**Docker Compose** should include MailHog as a service:

```yaml
# docker-compose.dev.yml
mailhog:
  image: mailhog/mailhog:latest
  ports:
    - "1025:1025"   # SMTP
    - "8025:8025"   # Web UI
```

---

### 3.8 Development Checklist (Backend ↔ Frontend)

- [ ] `POST /api/auth/forgot-password` always returns 200; queues `password-reset` job
- [ ] Password-reset email arrives in MailHog within 3s of the request
- [ ] Reset link in email uses correct `FRONTEND_URL` and includes raw token as query param
- [ ] `POST /api/auth/reset-password` with valid token → 200; token marked used; old refresh tokens invalidated
- [ ] `POST /api/auth/reset-password` with expired/used token → 400 with clear error message
- [ ] Appointment booking triggers confirmation email to patient within 3s
- [ ] Reminder job is delayed by `(startsAt - reminderHours) - now` milliseconds
- [ ] Waitlist offer email contains correct `/offers/<offerId>` link
- [ ] Waitlist offer page guards unauthenticated access (redirects to login)
- [ ] Arabic-locale user receives email with Arabic template
- [ ] MailHog web UI accessible at `http://localhost:8025` in dev
- [ ] All email jobs have `attempts: 3` with exponential back-off configured
- [ ] Canceled appointment does not receive reminder (idempotency guard)
- [ ] Accepted/declined/expired offer does not receive offer email (idempotency guard)

---

## Acceptance Criteria

### Email Delivery

- [ ] Password-reset email sent only when `PasswordResetToken` is valid, unused, and unexpired
- [ ] Appointment confirmation email sent for every new booking (status PENDING or CONFIRMED)
- [ ] Confirmation email NOT sent if appointment is CANCELED at job processing time
- [ ] Reminder email sent only for CONFIRMED or IN_PROGRESS appointments
- [ ] Reminder job fires at the correct time (`startsAt - reminderHours`)
- [ ] Waitlist offer email sent only when `WaitlistOffer.status = PENDING`
- [ ] All emails include both HTML and plain-text parts
- [ ] Arabic template used when `user.preferredLocale = 'ar'`; English fallback if template missing

### BullMQ Reliability

- [ ] All queues configured with `attempts: 3` and exponential back-off
- [ ] SMTP failure causes job retry, not silent drop
- [ ] Jobs are processed in the same NestJS process as the API (no separate worker needed in dev)

### Frontend Link Correctness

- [ ] Password-reset link uses `FRONTEND_URL/reset-password?token=<raw-token>`
- [ ] Waitlist offer link uses `FRONTEND_URL/offers/<offerId>`
- [ ] Confirmation/reminder CTA links to `FRONTEND_URL/my-appointments`

### Test Coverage

- [ ] All unit test scenarios in §2.1, §2.2, §2.3 pass: `pnpm test src/notifications`
- [ ] All E2E flows in §2.4 pass: `pnpm test:e2e -- --testPathPattern=notifications`
- [ ] `TemplateService` unit coverage = 100% (pure rendering logic)
- [ ] `NotificationsProcessor` branch coverage ≥ 90% (all idempotency guards tested)
