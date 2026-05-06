# Spec: AppointmentsModule (`backend/src/appointments/`)

**Type**: Backend NestJS Module  
**Plan reference**: [BACKEND_PLAN.md — §5 AppointmentsModule](../../BACKEND_PLAN.md#5-appointmentsmodule)  
**Frontend specs consumed**: [010-booking-page](../010-booking-page/spec.md), [011-my-appointments-page](../011-my-appointments-page/spec.md), [014-staff-queue-page](../014-staff-queue-page/spec.md), [015-appointments-admin-page](../015-appointments-admin-page/spec.md), [017-walk-in-booking-page](../017-walk-in-booking-page/spec.md), [023-doctor-queue-page](../023-doctor-queue-page/spec.md), [024-doctor-today-page](../024-doctor-today-page/spec.md)

> **Frontend implementation status**: All 7 frontend specs above are written (✅) but **not yet implemented** (all 🟡). Phase 3 of this spec is a forward-looking integration contract to be satisfied when frontend implementation begins.

---

## Overview

AppointmentsModule owns the full appointment lifecycle: available-slot computation, booking with idempotency, status transitions via a strict state machine, cancellation with role-based rules, rescheduling, and CSV export. On successful cancellation it emits a `slot-opened` BullMQ event consumed by WaitlistOfferEngineModule.

---

## Phase 1 — DTOs & Validation

### 1.1 File Map

```
backend/src/appointments/
├── appointments.module.ts
├── appointments.controller.ts
├── appointments.service.ts
├── slot-generator.service.ts
└── dto/
    ├── slots-query.dto.ts
    ├── appointments-query.dto.ts
    ├── create-appointment.dto.ts
    ├── update-status.dto.ts
    └── reschedule.dto.ts
```

---

### 1.2 `SlotsQueryDto`

```typescript
// GET /api/appointments/slots
class SlotsQueryDto {
  @IsUUID()
  doctorId: string;

  @IsDateString()           // YYYY-MM-DD
  from: string;

  @IsDateString()           // YYYY-MM-DD
  to: string;
}
```

**Validation rules**:
- `to` must be ≥ `from` → `400 Bad Request`
- Max range 31 days → `400 Bad Request` (prevents abuse)
- No auth required (public endpoint for booking page)

**Response** (`200`):
```json
{
  "statusCode": 200,
  "data": [
    {
      "startsAt": "2026-05-05T08:00:00.000Z",
      "endsAt":   "2026-05-05T08:30:00.000Z",
      "doctorId": "uuid"
    }
  ]
}
```

Slots are returned in ascending `startsAt` order, all timestamps in UTC ISO 8601.

---

### 1.3 `AppointmentsQueryDto`

```typescript
// GET /api/appointments
class AppointmentsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;            // inclusive lower bound for startsAt (YYYY-MM-DD)

  @IsOptional()
  @IsDateString()
  to?: string;              // inclusive upper bound for startsAt (YYYY-MM-DD)

  @IsOptional()
  @IsDateString()
  date?: string;            // shorthand for from=date&to=date (single day)

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  doctorId?: string[];

  @IsOptional()
  @IsArray()
  @IsEnum(AppointmentStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: AppointmentStatus[];

  @IsOptional()
  @IsString()
  @MaxLength(100)
  patientName?: string;     // partial match on firstName + lastName (staff only)

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
  pageSize?: number = 20;

  @IsOptional()
  @IsEnum(['startsAt', 'createdAt', 'status', 'patientName'])
  sortBy?: string = 'startsAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'asc';
}
```

**Access rules**:
- `PATIENT`: `doctorId`, `status`, `from`, `to`, `page`, `pageSize`, `sortBy`, `sortDir` only — `patientId` is forced to `req.user.id`
- `DOCTOR`: same as patient for own appointments (`doctorId` forced to self); `patientName` allowed
- `RECEPTIONIST` / `ADMIN`: full access to all fields including `patientName`, cross-doctor

---

### 1.4 `CreateAppointmentDto`

```typescript
// POST /api/appointments
class CreateAppointmentDto {
  @IsUUID()
  doctorId: string;

  @IsISO8601({ strict: true })
  startsAt: string;          // UTC ISO string from GET /slots response

  @IsOptional()
  @IsUUID()
  patientId?: string;        // only accepted from RECEPTIONIST/ADMIN; patient bookings use req.user.id
}
```

**Idempotency**: `Idempotency-Key` header (UUID v4) is required for `POST /appointments`. The `@IdempotencyKey()` decorator extracts it; the service stores it on the `Appointment` row. A duplicate key returns the original `201` response without re-creating.

**Validation rules**:
- `startsAt` must align to a slot boundary (i.e., minute = 0 or = slotDuration multiple) → `400`
- `startsAt` must not be in the past → `400`
- Slot must actually be available (re-validated server-side) → `409 Conflict` if taken
- `patientId` in body ignored for PATIENT role; only RECEPTIONIST/ADMIN may set it
- Unique constraint on `(doctorId, startsAt)` for non-CANCELED rows → `409 Conflict`

**Response** (`201`):
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "doctorId": "uuid",
    "patientId": "uuid",
    "startsAt": "2026-05-05T08:00:00.000Z",
    "endsAt":   "2026-05-05T08:30:00.000Z",
    "status": "PENDING",
    "createdAt": "2026-05-04T20:00:00.000Z"
  }
}
```

---

### 1.5 `UpdateStatusDto`

```typescript
// PATCH /api/appointments/:id/status
class UpdateStatusDto {
  @IsEnum(AppointmentStatus)
  status: AppointmentStatus;
}
```

**State machine** (only these transitions are valid):

```
PENDING     → CONFIRMED   (RECEPTIONIST, ADMIN)
CONFIRMED   → IN_PROGRESS (DOCTOR-own, RECEPTIONIST, ADMIN)
IN_PROGRESS → COMPLETED   (DOCTOR-own, RECEPTIONIST, ADMIN)
PENDING     → CANCELED    (PATIENT-own if ≥24h before start, RECEPTIONIST, ADMIN)
CONFIRMED   → CANCELED    (PATIENT-own if ≥24h before start, RECEPTIONIST, ADMIN)
CONFIRMED   → NO_SHOW     (RECEPTIONIST, ADMIN)
IN_PROGRESS → NO_SHOW     (RECEPTIONIST, ADMIN)
```

Invalid transition → `422 Unprocessable Entity` with message `"invalid_status_transition"`.  
Patient attempting to cancel within 24h → `403 Forbidden` with message `"cancellation_window_expired"`.

**On CANCELED**: emit `slot-opened` event to BullMQ `waitlist-offer` queue with `{ doctorId, startsAt }`.

**Response** (`200`):
```json
{
  "statusCode": 200,
  "data": { "id": "uuid", "status": "CONFIRMED", "updatedAt": "..." }
}
```

---

### 1.6 `RescheduleDto`

```typescript
// PATCH /api/appointments/:id  (receptionist/admin only)
class RescheduleDto {
  @IsISO8601({ strict: true })
  startsAt: string;          // new UTC slot start

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancellationReason?: string;
}
```

**Validation rules**:
- New slot must be available (same re-validation as booking) → `409` if taken
- New `startsAt` must not be in the past → `400`
- Reschedule emits `slot-opened` event for the **old** slot so waitlist engine can pick it up
- The appointment `status` is reset to `PENDING` after reschedule
- Access: RECEPTIONIST, ADMIN only

**Response** (`200`): full `AppointmentDTO` with updated `startsAt`, `endsAt`, `status`.

---

### 1.7 Slot Generator Service (`slot-generator.service.ts`)

Inputs: `doctorId: string`, `from: Date`, `to: Date` (UTC midnight boundaries)

Algorithm:
```
For each calendar day in [from, to]:
  1. Convert day to clinic timezone (ClinicConfig.timeZone)
  2. If day is in Holiday table → skip entire day
  3. Lookup DoctorScheduleOverride for (doctorId, date):
       - If override exists with null hours → doctor unavailable, skip day
       - If override exists with hours → use override open/close
       - If no override → use WorkingHour for weekday (0=Sun…6=Sat)
  4. If no working hours for weekday → skip day
  5. Generate slots: startsAt = open, step by slotDuration, while startsAt + slotDuration ≤ close
  6. For same-day slots: filter out slots where startsAt < now + minArrivalBuffer (ClinicConfig.minArrivalMinutes)

Load all non-CANCELED Appointment rows for doctorId where startsAt in [from, to].
Remove any generated slot whose startsAt matches a booked appointment's startsAt.

Return remaining slots sorted ascending.
```

All slot times converted to UTC before returning.

---

### 1.8 Prisma Models Used

```prisma
model Appointment {
  id               String            @id @default(uuid())
  doctorId         String
  patientId        String
  startsAt         DateTime
  endsAt           DateTime
  status           AppointmentStatus @default(PENDING)
  idempotencyKey   String?           @unique
  cancellationReason String?
  notes            String?
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  doctor           DoctorProfile     @relation(fields: [doctorId], references: [userId])
  patient          PatientProfile    @relation(fields: [patientId], references: [userId])
  auditLogs        AuditLog[]

  @@index([doctorId, startsAt])
  @@index([patientId, startsAt])
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELED
  NO_SHOW
}
```

Uniqueness of `(doctorId, startsAt)` for non-CANCELED rows is enforced at the application layer (not DB level) to allow the same slot to be re-booked after cancellation.

---

### 1.9 CSV Export

**Endpoint**: `GET /api/appointments/export?format=csv`  
**Auth**: ADMIN, RECEPTIONIST  
**Query**: same `AppointmentsQueryDto` filters, no pagination (returns all matching rows)

Response headers:
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="appointments-<from>-<to>.csv"
```

CSV columns (in order):
```
id, patientFirstName, patientLastName, doctorFirstName, doctorLastName,
startsAt (ISO), endsAt (ISO), status, createdAt (ISO), cancellationReason
```

---

## Phase 2 — Unit & E2E Tests

### 2.1 Unit Tests (`src/appointments/appointments.service.spec.ts`)

#### `getSlots()`

| Scenario | Expected |
|----------|----------|
| Normal weekday with working hours | Returns correct slot array aligned to slotDuration |
| Holiday on requested day | No slots returned for that day |
| Doctor has schedule override (unavailable) | No slots for overridden day |
| Doctor has custom hours override | Slots use override open/close, not working-hour defaults |
| Same-day request: slots within minArrivalBuffer | Those near-term slots filtered out |
| `to < from` | Throws `BadRequestException` |
| Range > 31 days | Throws `BadRequestException` |
| All slots booked | Returns empty array |

#### `createAppointment()`

| Scenario | Expected |
|----------|----------|
| Valid payload, slot free | Creates appointment, returns 201 |
| Duplicate `Idempotency-Key` | Returns original appointment without re-creating |
| Slot already booked (conflict) | Throws `ConflictException` (409) |
| `startsAt` in the past | Throws `BadRequestException` (400) |
| `patientId` in body from PATIENT role | `patientId` ignored, forced to `req.user.id` |
| RECEPTIONIST supplies explicit `patientId` | Used as-is |

#### `updateStatus()`

| Scenario | Expected |
|----------|----------|
| Valid transition `PENDING → CONFIRMED` | Updates status, returns appointment |
| Invalid transition `PENDING → COMPLETED` | Throws `UnprocessableEntityException` (422) |
| Patient cancels 25h before slot | Allowed, slot-opened event emitted |
| Patient cancels 23h before slot | Throws `ForbiddenException` (403) `"cancellation_window_expired"` |
| Receptionist cancels within 24h | Always allowed |
| DOCTOR tries to confirm (not their role) | Throws `ForbiddenException` (403) |
| `slot-opened` event on CANCELED | BullMQ queue receives job with `{ doctorId, startsAt }` |

#### `reschedule()`

| Scenario | Expected |
|----------|----------|
| Valid new slot | Old slot emits `slot-opened`; appointment updated; status reset to PENDING |
| New slot already booked | Throws `ConflictException` (409) |
| New `startsAt` in past | Throws `BadRequestException` (400) |
| Patient attempts reschedule | Throws `ForbiddenException` (403) |

#### `getAppointments()` (query/filter)

| Scenario | Expected |
|----------|----------|
| PATIENT calls: sees only own appointments | `patientId` filter always applied |
| DOCTOR calls: sees only own doctor appointments | `doctorId` filter always applied |
| RECEPTIONIST: `patientName` filter | Returns correct subset |
| `from` + `to` range filter | Correct date boundary filtering |
| `status[]` multi-value | All matching statuses returned |
| Pagination: `page=2, pageSize=5` | Correct offset applied |

---

### 2.2 Unit Tests (`src/appointments/slot-generator.service.spec.ts`)

| Scenario | Expected |
|----------|----------|
| Standard 9-to-5 with 30-min slots | 16 slots (9:00…16:30) |
| Slot boundary: endsAt exactly at close | Slot included |
| Slot boundary: endsAt exceeds close | Slot excluded |
| Holiday removes entire day | Zero slots for that date |
| Schedule override with null hours | Zero slots for overridden doctor/day |
| Schedule override with custom hours | Slots derived from override |
| minArrivalBuffer filters same-day slots | Slots within buffer excluded |
| Booked appointments excluded | Corresponding slots absent from result |

---

### 2.3 E2E Tests (`test/appointments.e2e-spec.ts`)

Test environment: real PostgreSQL (test DB), Redis mocked via BullMQ in-memory queues, NestJS full app bootstrap.

#### Flow 1 — Slot Generation → Booking → Idempotency

```
GET /api/appointments/slots?doctorId=<id>&from=<date>&to=<date>
  → 200, array of slot objects

POST /api/appointments (Idempotency-Key: <uuid-1>)
  body: { doctorId, startsAt: slots[0].startsAt }
  → 201, appointment created with status PENDING

POST /api/appointments (same Idempotency-Key: <uuid-1>)
  → 201, same appointment returned (not created twice)
  → DB has exactly 1 appointment row

GET /api/appointments/slots (same params)
  → booked slot is no longer in results
```

#### Flow 2 — Status Transitions

```
(seed: PENDING appointment)

PATCH /api/appointments/:id/status { status: "CONFIRMED" } (as RECEPTIONIST)
  → 200, status = CONFIRMED

PATCH /api/appointments/:id/status { status: "IN_PROGRESS" } (as DOCTOR)
  → 200, status = IN_PROGRESS

PATCH /api/appointments/:id/status { status: "COMPLETED" } (as DOCTOR)
  → 200, status = COMPLETED

PATCH /api/appointments/:id/status { status: "CANCELED" } (as DOCTOR, COMPLETED → CANCELED)
  → 422, message = "invalid_status_transition"
```

#### Flow 3 — 24-Hour Cancellation Rule

```
(seed: CONFIRMED appointment with startsAt = now + 30 minutes)

DELETE /api/appointments/:id (as owning PATIENT)
  → 403, message = "cancellation_window_expired"

(seed: CONFIRMED appointment with startsAt = now + 48 hours)

DELETE /api/appointments/:id (as owning PATIENT)
  → 200, status = CANCELED
  → BullMQ waitlist-offer queue receives job { doctorId, startsAt }
```

#### Flow 4 — Reschedule by Receptionist

```
(seed: PENDING appointment at slot-A, slot-B available)

PATCH /api/appointments/:id { startsAt: slot-B.startsAt }
  → 200, appointment has new startsAt = slot-B, status = PENDING

GET /api/appointments/slots (same doctor, same date)
  → slot-A is back in results (freed)
  → slot-B is no longer in results (booked)

BullMQ waitlist-offer queue receives job for slot-A
```

#### Flow 5 — Patient Sees Only Own Appointments

```
(seed: 3 appointments for patient-A, 2 for patient-B)

GET /api/appointments (as patient-A)
  → 200, data.items has exactly 3 records
  → no patient-B appointments visible
```

#### Flow 6 — Staff Full Access + CSV Export

```
GET /api/appointments?patientName=Ahmad&status[]=CONFIRMED&status[]=PENDING (as RECEPTIONIST)
  → 200, filtered results

GET /api/appointments/export?format=csv&from=2026-05-01&to=2026-05-31 (as ADMIN)
  → 200, Content-Type: text/csv
  → CSV rows match DB records for the period
```

#### Flow 7 — Slot Conflict

```
(seed: CONFIRMED appointment at slot-A)

POST /api/appointments { doctorId, startsAt: slot-A.startsAt } with new Idempotency-Key
  → 409 Conflict
```

---

### 2.4 Test Setup & Teardown

```typescript
beforeAll(async () => {
  app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  prisma = app.get(PrismaService);
  await app.init();
});

afterEach(async () => {
  await prisma.appointment.deleteMany();
  // seed data removed per-test
});

afterAll(async () => {
  await app.close();
});
```

Seed helpers (`test/helpers/seed.ts`):
- `seedDoctor(overrides?)` — creates User + DoctorProfile
- `seedPatient(overrides?)` — creates User + PatientProfile
- `seedAppointment(doctorId, patientId, overrides?)` — creates Appointment
- `seedWorkingHours(doctorId?)` — creates Mon–Fri 09:00–17:00 working hours
- `seedClinicConfig()` — slotDuration 30, timezone `Asia/Riyadh`, minArrivalMinutes 15

---

## Phase 3 — Frontend Integration

> **Status**: All frontend pages listed below have written specs but **implementation has not started**. This phase defines the contract those pages must satisfy when implementation begins.

### 3.1 Frontend Pages & Their Appointment Endpoints

| Frontend Page | Spec | Endpoints Used |
|---|---|---|
| Booking Page (`/book`) | [010](../010-booking-page/spec.md) | `GET /slots`, `POST /appointments` |
| My Appointments (`/appointments`) | [011](../011-my-appointments-page/spec.md) | `GET /appointments`, `DELETE /appointments/:id` |
| Staff Queue (`/staff/queue`) | [014](../014-staff-queue-page/spec.md) | `GET /appointments` (today, multi-doctor), `PATCH /:id/status` |
| Appointments Admin (`/staff/appointments`) | [015](../015-appointments-admin-page/spec.md) | `GET /appointments`, `PATCH /:id`, `DELETE /:id`, `GET /export?format=csv` |
| Walk-In Booking (`/staff/walkin`) | [017](../017-walk-in-booking-page/spec.md) | `GET /slots`, `POST /appointments` (with `patientId`) |
| Doctor Queue (`/doctor/queue`) | [023](../023-doctor-queue-page/spec.md) | `GET /appointments` (own), `PATCH /:id/status` |
| Doctor Today (`/doctor/today`) | [024](../024-doctor-today-page/spec.md) | `GET /appointments` (own, date scoped) |

---

### 3.2 Shared Response Shape

All appointment objects returned from any endpoint must include:

```typescript
interface AppointmentDTO {
  id: string;
  doctorId: string;
  patientId: string;
  startsAt: string;          // UTC ISO 8601
  endsAt: string;            // UTC ISO 8601
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
  cancellationReason: string | null;
  notes: string | null;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
}
```

List endpoints return:
```json
{
  "statusCode": 200,
  "data": {
    "items": [ AppointmentDTO ],
    "total": 42,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 3.3 Slot Response Shape

```typescript
interface AvailableSlotDTO {
  startsAt: string;          // UTC ISO 8601 — use this value verbatim for POST /appointments
  endsAt: string;            // UTC ISO 8601
  doctorId: string;
}
```

**Frontend must not recompute slot timestamps from local time.** The `startsAt` value received from `GET /slots` must be passed as-is to `POST /appointments`.

---

### 3.4 Idempotency-Key Header

```
POST /api/appointments
Idempotency-Key: <uuid-v4>
```

The frontend generates a fresh UUID v4 per booking attempt (not per page load). Libraries: `crypto.randomUUID()` (browser native) or `uuid` npm package.

```typescript
// booking hook (useBookAppointment)
const idempotencyKey = crypto.randomUUID();
await api.post('/appointments', payload, {
  headers: { 'Idempotency-Key': idempotencyKey },
});
```

On network retry, **reuse the same key** so the server deduplicates. On user-initiated re-submit (new attempt), generate a **new key**.

---

### 3.5 24-Hour Cancellation Rule — Frontend Handling

When `DELETE /appointments/:id` returns `403` with `message: "cancellation_window_expired"`:

```typescript
// MyAppointmentsPage
if (error.response?.status === 403 && error.response.data.message === 'cancellation_window_expired') {
  toast.error('Appointments can only be canceled more than 24 hours before the scheduled time.');
}
```

The frontend should also pre-emptively hide or disable the Cancel button for appointments where `startsAt < now + 24h` (client-side guard, not a substitute for server enforcement).

---

### 3.6 Status Transition Guards (Doctor & Receptionist UIs)

The frontend must only expose transitions allowed by the state machine. Suggested approach: derive button labels and enabled states from a `ALLOWED_TRANSITIONS` constant:

```typescript
// frontend/src/features/appointments/constants.ts
const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING:     ['CONFIRMED', 'CANCELED'],
  CONFIRMED:   ['IN_PROGRESS', 'CANCELED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'NO_SHOW'],
  COMPLETED:   [],
  CANCELED:    [],
  NO_SHOW:     [],
};
```

This constant must be kept in sync with the backend state machine. If the backend returns `422`, the frontend should show `"This action is no longer available"` rather than a generic error.

---

### 3.7 CSV Export

`GET /api/appointments/export?format=csv` returns `text/csv`. The frontend triggers it as a file download:

```typescript
// AppointmentsAdminPage
const response = await api.get('/appointments/export', {
  params: { format: 'csv', from, to, ...activeFilters },
  responseType: 'blob',
});
const url = URL.createObjectURL(response.data);
const a = document.createElement('a');
a.href = url;
a.download = `appointments-${from}-${to}.csv`;
a.click();
URL.revokeObjectURL(url);
```

---

### 3.8 Query Param Serialization

`doctorId[]` and `status[]` are sent as repeated query params:

```
GET /api/appointments?status[]=PENDING&status[]=CONFIRMED&doctorId[]=<uuid>
```

The axios instance should be configured with `paramsSerializer` to handle arrays correctly:

```typescript
// lib/api.ts
import qs from 'qs';
const api = axios.create({
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'brackets' }),
});
```

The backend `AppointmentsQueryDto` uses `@Transform` to handle both single-value and array forms.

---

### 3.9 Real-Time Queue Integration

When an appointment status changes via `PATCH /:id/status`, the backend must emit `queue.updated` on the Socket.IO `/queue` namespace (handled by QueueModule). The frontend `useQueueSocket` hook listens for this event and invalidates the React Query cache:

```
PATCH /api/appointments/:id/status
  → DB update
  → QueueModule notified → emits queue.updated to /queue/doctor:<doctorId> room
  → Frontend useQueueSocket receives queue.updated
  → React Query: invalidate ['appointments'] queries
```

The AppointmentsService must call `QueueService.broadcastStatusChange(appointment)` after every successful status update. Circular dependency resolved via `forwardRef`.

---

### 3.10 Development Checklist (Backend ↔ Frontend)

- [ ] `GET /api/appointments/slots` returns slots array with UTC timestamps; empty array if no availability
- [ ] `POST /api/appointments` accepts `Idempotency-Key` header; duplicate key returns 201 with original data
- [ ] `GET /api/appointments` — PATIENT gets only own records; DOCTOR gets only own doctor records; RECEPTIONIST/ADMIN get all
- [ ] `PATCH /api/appointments/:id/status` enforces state machine; 422 on invalid transition; 403 on 24h violation
- [ ] `PATCH /api/appointments/:id` (reschedule) resets status to PENDING and emits `slot-opened` for old slot
- [ ] `DELETE /api/appointments/:id` delegates to status → CANCELED (same logic)
- [ ] `GET /api/appointments/export?format=csv` returns `text/csv` with correct `Content-Disposition` header
- [ ] Cancellation emits `slot-opened` BullMQ job with `{ doctorId, startsAt }`
- [ ] Status changes call `QueueService.broadcastStatusChange()` for Socket.IO propagation
- [ ] `AppointmentDTO` always includes nested `doctor` and `patient` objects
- [ ] Swagger docs at `/api/docs` include all endpoints, DTOs, example bodies, and error codes

---

## Acceptance Criteria

- [ ] `GET /slots` returns correct slots respecting holidays, overrides, booked appointments, and `minArrivalBuffer`
- [ ] Slot range > 31 days returns `400`
- [ ] `POST /appointments` enforces idempotency via `Idempotency-Key`; concurrent duplicate requests resolve to single row
- [ ] Booking a taken slot returns `409`; taken = non-CANCELED appointment at same `(doctorId, startsAt)`
- [ ] Status machine: only allowed transitions succeed; others return `422 "invalid_status_transition"`
- [ ] Patient cancel within 24h returns `403 "cancellation_window_expired"`; receptionist/admin bypass the rule
- [ ] Reschedule: old slot emits `slot-opened`; appointment status resets to `PENDING`
- [ ] List endpoint: pagination, date range, status[], doctorId[], and patientName filters all work correctly
- [ ] PATIENT role: `patientId` in body ignored; cannot set `patientName` filter; cannot see other patients' records
- [ ] CSV export returns `text/csv` with all filtered rows (no pagination)
- [ ] All unit tests pass: `pnpm test src/appointments`
- [ ] All E2E flows pass: `pnpm test:e2e -- --testPathPattern=appointments`
- [ ] Swagger docs include all 8 endpoints with request/response schemas
