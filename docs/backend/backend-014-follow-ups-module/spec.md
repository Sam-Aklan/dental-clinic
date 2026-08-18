# Spec: FollowUpsModule (`backend/src/follow-ups/`)

**Type**: Backend NestJS Module  
**Plan reference**: [BACKEND_PLAN.md - section 6 FollowUpsModule](../../BACKEND_PLAN.md#6-followupsmodule)  
**Frontend specs consumed**:
- [017-walk-in-booking-page](../017-walk-in-booking-page/spec.md) - staff patient selection can be seeded from follow-up workflows
- [018-admin-dashboard-page](../018-admin-dashboard-page/spec.md) - admin follow-ups table and scheduling oversight

> **Frontend implementation status**: The admin dashboard spec is written (✅) but the page implementation is pending. The walk-in booking spec is written (✅) and already references follow-up-driven patient preselection. Phase 4 of this spec is a contract-first handoff for future frontend wiring.

---

## Overview

FollowUpsModule owns staff-created follow-up scheduling. A follow-up is not a reminder-only task; it reserves an appointment slot immediately, creates a linked `Appointment` row in confirmed state, and stores follow-up metadata for later filtering, rescheduling, completion, cancellation, and analytics.

This module enforces hard slot blocking. If the doctor's requested slot is already reserved, the API returns `409 Conflict` and never overbooks.

All follow-up state changes write audit logs for staff actions and reuse the same clinic time rules as normal appointment booking.

---

## Phase 1 - DTOs & Validation

### 1.1 File Map

```
backend/src/follow-ups/
├── follow-ups.module.ts
├── follow-ups.controller.ts
├── follow-ups.service.ts
└── dto/
    ├── create-follow-up.dto.ts
    ├── update-follow-up.dto.ts
    ├── update-follow-up-status.dto.ts
    └── follow-ups-query.dto.ts
```

---

### 1.2 `CreateFollowUpDto`

```typescript
// POST /api/follow-ups
class CreateFollowUpDto {
  @IsUUID()
  patientId: string;

  @IsUUID()
  doctorId: string;

  @IsDateString()
  startsAt: string;

  @IsString()
  @MaxLength(500)
  reason: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsUUID()
  sourceAppointmentId?: string;
}
```

**Validation rules**:
- `patientId`, `doctorId`, `startsAt`, and `reason` are required.
- `startsAt` must be in the future.
- `reason` is trimmed and cannot be empty after trimming.
- `notes` are optional and trimmed.
- `sourceAppointmentId`, if provided, must belong to the same patient and doctor.
- `DOCTOR` can only create a follow-up for their own patients and their own doctor profile.
- `RECEPTIONIST` can create a follow-up for any patient and any doctor.
- `ADMIN` can create a follow-up for any patient and any doctor.
- Slot overlap checks are done inside the service transaction, not only in controller validation.
- If the slot is already occupied, return `409 Conflict` with suggested alternatives when available.

**Response** (`201`):
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "appointmentId": "uuid",
    "sourceAppointmentId": "uuid",
    "followUpAt": "2026-05-05T08:00:00.000Z",
    "reason": "Review healing progress",
    "notes": "Check implant site",
    "status": "SCHEDULED",
    "scheduledById": "uuid",
    "createdAt": "2026-05-01T08:00:00.000Z"
  }
}
```

---

### 1.3 `UpdateFollowUpDto`

```typescript
// PATCH /api/follow-ups/:id
class UpdateFollowUpDto {
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsUUID()
  sourceAppointmentId?: string;
}
```

**Validation rules**:
- At least one of `startsAt`, `reason`, `notes`, or `sourceAppointmentId` must be provided; empty updates should be rejected with `400 Bad Request`.
- If `startsAt` changes, the new slot must be revalidated against the doctor's schedule and existing reservations.
- If the new slot is unavailable, return `409 Conflict`.
- If `sourceAppointmentId` changes, the source appointment must still match the patient and doctor.
- Doctors can only update their own follow-ups.
- Receptionists and admins can update any follow-up.

---

### 1.4 `UpdateFollowUpStatusDto`

```typescript
// PATCH /api/follow-ups/:id/status
class UpdateFollowUpStatusDto {
  @IsEnum(FollowUpStatus)
  status: FollowUpStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  cancelReason?: string;
}
```

**Validation rules**:
- `status` is required.
- `cancelReason` is required when `status = CANCELED`.
- `COMPLETED`, `CANCELED`, and `MISSED` are terminal states.
- `SCHEDULED -> COMPLETED`, `SCHEDULED -> CANCELED`, and `SCHEDULED -> MISSED` are valid transitions.
- Attempts to transition from a terminal state return `409 Conflict`.

---

### 1.5 `FollowUpsQueryDto`

```typescript
// GET /api/follow-ups
class FollowUpsQueryDto {
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  patientName?: string;

  @IsOptional()
  @IsEnum(FollowUpStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: FollowUpStatus[];

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  overdueOnly?: boolean = false;

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
}
```

**Validation rules**:
- `to` must be greater than or equal to `from` when both are present.
- `overdueOnly=true` must ignore completed/canceled/missed follow-ups.
- `DOCTOR` queries are automatically scoped to the authenticated doctor.
- `PATIENT` access is not part of this module's primary surface; patient-facing views should consume appointments or dashboard-derived endpoints instead.

---

## Phase 2 - Services & Controllers

### 2.1 Controller Responsibilities

**`FollowUpsController`**
- Expose CRUD and status endpoints.
- Apply `JwtAuthGuard` and `RolesGuard`.
- Use `@CurrentUser()` to derive the active staff member.
- Accept `Idempotency-Key` on creation and deduplicate repeated submits.
- Return standard response wrappers through the common transform interceptor.

**Endpoint matrix**

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/follow-ups` | admin, receptionist, doctor | list follow-ups with filters |
| GET | `/follow-ups/:id` | admin, receptionist, doctor | fetch a single follow-up |
| POST | `/follow-ups` | admin, receptionist, doctor | reserve a slot and create follow-up |
| PATCH | `/follow-ups/:id` | admin, receptionist, doctor | reschedule or edit metadata |
| PATCH | `/follow-ups/:id/status` | admin, receptionist, doctor | change lifecycle state |
| DELETE | `/follow-ups/:id` | admin, receptionist, doctor | cancel reserved follow-up |

---

### 2.2 Service Responsibilities

**`FollowUpsService`** owns the business rules:
- Validate role scope before any write.
- Reuse appointment slot validation logic from `AppointmentsModule` or a shared slot helper.
- Create the reserved appointment and follow-up in one Prisma transaction.
- Prevent double booking by checking the same `(doctorId, startsAt)` uniqueness invariant used by appointments.
- Attach `sourceAppointmentId` only when it matches the same patient and doctor.
- Write `AuditLog` entries for create, update, status change, and cancel actions.
- Queue appointment confirmation and reminder emails after successful create/reschedule.
- Keep the follow-up record and linked appointment state consistent.

**Suggested service methods**
- `create(user, dto)`
- `findAll(user, query)`
- `findOne(user, id)`
- `update(user, id, dto)`
- `updateStatus(user, id, dto)`
- `cancel(user, id, cancelReason)`
- `suggestAlternativeSlots(doctorId, startsAt)`
- `assertWriteAccess(user, followUp)`
- `assertOwnershipOrScope(user, doctorId, patientId)`

### 2.3 Transaction Rules

- Slot availability is checked inside the same transaction that creates or updates the reserved appointment.
- If another request books the slot first, the unique constraint should surface as `409 Conflict`.
- Follow-up creation should not leave a partially created appointment or follow-up row.
- Reschedule must update the appointment time atomically with the follow-up metadata.
- Cancel must update both records and set timestamps/reason fields consistently.

### 2.4 Error Contract

Common failure cases:
- `400 Bad Request` - invalid DTO, missing reason, empty update, invalid window, missing cancel reason
- `401 Unauthorized` - missing or invalid access token
- `403 Forbidden` - role or ownership violation
- `404 Not Found` - follow-up, patient, doctor, or source appointment not found
- `409 Conflict` - occupied slot, invalid status transition, terminal record update

---

## Phase 3 - Unit & E2E Tests

### 3.1 Unit Tests

**`FollowUpsService`**
- creates a follow-up and reserved appointment in one transaction
- rejects occupied slots with `409 Conflict`
- rejects a doctor creating a follow-up for another doctor's patient
- accepts receptionist and admin cross-doctor scheduling
- rejects invalid `sourceAppointmentId` mappings
- reschedules only when the new slot is free
- updates status only through valid transitions
- requires `cancelReason` for cancellations
- writes audit logs on create/update/status/cancel

**`FollowUpsController`**
- maps route params and DTOs correctly
- enforces role guards
- passes the authenticated user into service methods
- returns correct response wrappers and status codes

**Suggested unit coverage table**

| Area | Cases |
|---|---|
| Create | success, occupied slot, invalid patient/doctor scope, source mismatch |
| Update | metadata-only, reschedule success, reschedule conflict, empty body |
| Status | complete, cancel, missed, terminal transition conflict |
| List | admin all, receptionist all, doctor scoped |
| Delete | cancel reserved slot and mark linked appointment canceled |

### 3.2 E2E Tests

**Core scenarios**
- Admin creates a follow-up for any patient and doctor.
- Receptionist creates a follow-up for any patient and doctor.
- Doctor creates a follow-up for their own patient.
- Doctor cannot create a follow-up for another doctor's patient.
- Creating a follow-up on an occupied slot returns `409 Conflict`.
- Rescheduling to an occupied slot returns `409 Conflict`.
- Completing a follow-up updates the follow-up and linked appointment state.
- Canceling a follow-up writes an audit event and frees the reserved slot.
- Follow-up list filters by doctor, patient, status, date range, and overdue flag.

**Recommended test files**
- `test/follow-ups.e2e-spec.ts`
- `src/follow-ups/follow-ups.service.spec.ts`
- `src/follow-ups/follow-ups.controller.spec.ts`

### 3.3 Verification Expectations

- All unit tests pass with mocked Prisma transactions.
- E2E tests run against the test database and verify real slot conflicts.
- Conflict cases return stable API payloads that the frontend can display without custom parsing.

---

## Phase 4 - Frontend Integration

### 4.1 Consumer Surfaces

**Current frontend consumers**
- `018-admin-dashboard-page` uses `GET /api/analytics/follow-ups` for the follow-ups table.
- `017-walk-in-booking-page` can preselect a patient when a follow-up workflow points into booking.

**Future staff surfaces**
- receptionist follow-up scheduling modal
- doctor follow-up scheduling modal
- admin follow-up management table actions

### 4.2 API Integration Contract

Frontend should use these backend endpoints:
- `GET /api/follow-ups`
- `GET /api/follow-ups/:id`
- `POST /api/follow-ups`
- `PATCH /api/follow-ups/:id`
- `PATCH /api/follow-ups/:id/status`
- `DELETE /api/follow-ups/:id`
- `GET /api/analytics/follow-ups`

### 4.3 UI Behavior

- Create form must block submission when the slot is already reserved.
- When a `409 Conflict` is returned, the UI should surface the message and any suggested alternative slots.
- Follow-up rows should display:
  - patient name
  - doctor name
  - follow-up time
  - status
  - source appointment link
  - reserved appointment link
- Staff actions should be scoped by role:
  - doctor sees own follow-ups only
  - receptionist sees all clinic follow-ups
  - admin sees all follow-ups and analytics filters

### 4.4 Data Flow Notes

- The frontend should treat follow-up creation as an appointment reservation, not as a background task.
- The follow-up table and follow-up form should share the same date/time picker logic used by appointment booking.
- If a slot is unavailable, the UI should keep the selected patient/doctor context and let the user pick a new time without losing form data.

---

## Acceptance Criteria

- Follow-ups can be created only by doctor, receptionist, or admin.
- Follow-up creation reserves an appointment slot immediately.
- Reserved slots are never overbooked.
- Follow-up updates and reschedules revalidate slot availability.
- Follow-up lifecycle transitions are validated.
- Audit logs are written for staff mutations.
- Unit and E2E tests cover create, update, status, list, conflict, and ownership rules.
- Frontend integrations can consume the API without custom backend adapters.
