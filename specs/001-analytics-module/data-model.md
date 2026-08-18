# Data Model: Analytics Module

**Branch**: `035-analytics-module` | **Date**: 2026-05-16

## Summary

The analytics module is entirely read-only. No new Prisma models, migrations, or schema changes are required. All entities below are logical aggregates computed from existing Prisma data.

---

## Existing Prisma Models Used (Read-Only)

| Prisma Model | Analytics Role |
|---|---|
| `Appointment` | Core data source for all endpoints |
| `DoctorProfile` | Name resolution, doctor scope, utilization capacity |
| `User` (via DoctorProfile / PatientProfile) | Name fields for follow-up and utilization responses |
| `PatientProfile` | Follow-up candidate resolution |
| `ClinicConfig` | `timeZone` for all date math |
| `WorkingHour` | Slot capacity calculation for doctor utilization |
| `Holiday` | Slot capacity adjustment |
| `DoctorScheduleOverride` | Per-doctor slot capacity adjustment |
| `WaitlistEntry` | Waitlist summary counts |
| `AuditLog` | Cancellation actor classification (optional join) |

No `@@map`, `@db`, or migration changes. No new models.

---

## Logical Entities

### 1. Appointment Analytics Range

A validated clinic-local date interval. Instantiated at the start of every date-range endpoint.

| Field | Type | Notes |
|---|---|---|
| `from` | `string` (YYYY-MM-DD) | Requested range start in clinic timezone |
| `to` | `string` (YYYY-MM-DD) | Requested range end in clinic timezone (inclusive) |
| `utcFrom` | `Date` | `startOf('day')` for `from` in clinic tz, converted to UTC |
| `utcTo` | `Date` | `startOf('day')` for day after `to` in clinic tz, converted to UTC (exclusive bound) |
| `durationDays` | `number` | Calendar days between `from` and `to` inclusive |

**Validation rules**:
- `to >= from` — reject with 400 otherwise
- `durationDays <= 366` — reject clinic-level reports exceeding this
- `ClinicConfig.timeZone` must be present — reject with 400 if missing

---

### 2. Trend Bucket

One time bucket in a trend series. The series must be continuous and zero-filled.

| Field | Type | Notes |
|---|---|---|
| `date` | `string` | ISO date string of bucket start in clinic timezone |
| `total` | `number` | All appointments in this bucket (integer) |
| `confirmed` | `number` | CONFIRMED status count |
| `completed` | `number` | COMPLETED status count |
| `canceled` | `number` | CANCELED status count |
| `noShow` | `number` | NO_SHOW status count |

**Bucket rules**:
- `day` → bucket start = clinic-local YYYY-MM-DD
- `week` → bucket start = Monday of clinic-local week (ISO week start)
- `month` → bucket start = first day of clinic-local month
- `month` bucket rejected for ranges ≤ 31 days
- Missing periods receive zero values for all count fields

---

### 3. Appointment Status Distribution

All six appointment statuses, with zero for any status absent in the range.

| Field | Type | Notes |
|---|---|---|
| `PENDING` | `number` | Integer count |
| `CONFIRMED` | `number` | |
| `IN_PROGRESS` | `number` | |
| `COMPLETED` | `number` | |
| `CANCELED` | `number` | |
| `NO_SHOW` | `number` | |

**Source query**: `prisma.appointment.groupBy({ by: ['status'], where: { startTime: { gte: utcFrom, lt: utcTo } } })`

---

### 4. Doctor Utilization Summary

Per-doctor schedule capacity vs. actual bookings.

| Field | Type | Notes |
|---|---|---|
| `doctorId` | `string` | `DoctorProfile.id` |
| `doctorName` | `string` | `user.firstName + ' ' + user.lastName` |
| `bookedSlots` | `number` | Appointments with status CONFIRMED \| IN_PROGRESS \| COMPLETED |
| `totalSlots` | `number` | Available slots from schedule, holidays, overrides (via `SlotGeneratorService`) |
| `utilizationPct` | `number` | `min(bookedSlots / totalSlots, 1.0)`; `0` when `totalSlots = 0` |

**Sort**: `utilizationPct` desc, then `doctorName` asc

---

### 5. Appointments By Weekday

Appointment count per clinic-local day of week.

| Field | Type | Notes |
|---|---|---|
| `dayOfWeek` | `0–6` | 0 = Sunday, 6 = Saturday |
| `label` | `string` | `'Sun'` \| `'Mon'` \| `'Tue'` \| `'Wed'` \| `'Thu'` \| `'Fri'` \| `'Sat'` |
| `count` | `number` | All appointments on that weekday in clinic-local time |

**Note**: Weekday assignment uses `DateTime.fromJSDate(startTime, { zone }).weekday` mapped to 0-indexed Sunday.

---

### 6. Cancellation Trend Item

Per-bucket cancellation breakdown.

| Field | Type | Notes |
|---|---|---|
| `date` | `string` | Bucket start in clinic timezone |
| `canceledByPatient` | `number` | CANCELED where actor role = PATIENT (via AuditLog join) |
| `canceledByStaff` | `number` | CANCELED where actor role ≠ PATIENT, or no audit record found |
| `noShow` | `number` | NO_SHOW count |

**Bucket options**: `day` or `week` only (no `month`)

---

### 7. Clinic KPI Summary

Aggregate metrics for a date range with previous-period comparison.

| Field | Type | Notes |
|---|---|---|
| `totalAppointments` | `number` | All appointments in range |
| `completed` | `number` | COMPLETED status count |
| `cancellationRate` | `number` | `CANCELED / totalAppointments`; `0` if denominator is `0` |
| `noShowRate` | `number` | `NO_SHOW / totalAppointments`; `0` if denominator is `0` |
| `activePatients` | `number` | Distinct `patientUserId` with ≥1 non-CANCELED appointment |
| `waitlistSize` | `number` | Count of all current `WaitlistEntry` records |
| `deltaTotalPct` | `number` | `(current - previous) / previous`; `0` if previous is `0` |
| `deltaCompletedPct` | `number` | Same formula for completed count |

**Previous period**: immediately preceding equal-length date range (e.g., for Jan 1–15, previous = Dec 17–31)

---

### 8. Follow-Up Candidate

A patient eligible for outreach based on recency of last completed appointment.

| Field | Type | Notes |
|---|---|---|
| `patientId` | `string` | `User.id` of the patient |
| `patientName` | `string` | `user.firstName + ' ' + user.lastName` |
| `lastAppointmentDate` | `string` | ISO date string of last COMPLETED appointment |
| `daysSince` | `number` | Calendar days between last completed and today (clinic-local) |
| `hasUpcoming` | `boolean` | `true` if any PENDING \| CONFIRMED \| IN_PROGRESS appointment has `startTime > now` |

**Eligibility rules**:
- Must have at least one COMPLETED appointment
- `daysSince > thresholdDays` (default 90, max 365)
- DOCTOR role: scoped to patients who completed appointments with that doctor's `doctorProfileId`
- ADMIN / RECEPTIONIST: all eligible patients

**Sort**: `daysSince` desc, `patientName` asc
**Pagination**: `page` (default 1), `pageSize` (default 20, max 100)

---

### 9. Waitlist Summary

Current-state aggregation of all active waitlist entries.

| Field | Type | Notes |
|---|---|---|
| `totalActive` | `number` | Total `WaitlistEntry` count |
| `byDoctor` | `Array` | Per-doctor breakdown |
| `byDoctor[].doctorId` | `string` | `DoctorProfile.id` |
| `byDoctor[].doctorName` | `string` | `user.firstName + ' ' + user.lastName` |
| `byDoctor[].count` | `number` | WaitlistEntry count for this doctor |

**Sort**: `byDoctor` sorted by `count` desc

---

### 10. Today Summary

Clinic-local current-day appointment snapshot (no date range parameters).

| Field | Type | Notes |
|---|---|---|
| `total` | `number` | All appointments in clinic-local today |
| `inProgress` | `number` | IN_PROGRESS status |
| `waiting` | `number` | CONFIRMED where `startTime <= now` (patient arrived, not yet in session) |
| `completed` | `number` | COMPLETED status |
| `canceledToday` | `number` | CANCELED status within today's UTC range |
| `pendingConfirmation` | `number` | PENDING status |

**Today bounds**: `startOf('day')` to `endOf('day')` in clinic timezone, converted to UTC

---

### 11. Today By Doctor Item

Today's appointment status breakdown per active doctor.

| Field | Type | Notes |
|---|---|---|
| `doctorId` | `string` | `DoctorProfile.id` |
| `doctorName` | `string` | `user.firstName + ' ' + user.lastName` |
| `confirmed` | `number` | |
| `inProgress` | `number` | |
| `completed` | `number` | |
| `canceled` | `number` | |

**Note**: All active `DoctorProfile` records appear even if they have zero appointments today.

---

### 12. Doctor Personal Stats

Today and this-week summary scoped to the authenticated doctor.

| Field | Type | Notes |
|---|---|---|
| `todayTotal` | `number` | All of today's appointments for this doctor |
| `completedToday` | `number` | COMPLETED today |
| `remainingToday` | `number` | PENDING + CONFIRMED remaining today |
| `inSession` | `number` | IN_PROGRESS today |
| `noShowsToday` | `number` | NO_SHOW today |
| `weekTotal` | `number` | All appointments in clinic-local current week |

---

### 13. My Trend Item

One day in the authenticated doctor's weekly trend (7 items always returned).

| Field | Type | Notes |
|---|---|---|
| `date` | `string` | Clinic-local date (YYYY-MM-DD) |
| `dayLabel` | `string` | e.g., `'Mon'`, `'Tue'` |
| `count` | `number` | Appointment count for this doctor on this date |

---

### 14. Hourly Load Item

Appointment count per clinic-local hour.

| Field | Type | Notes |
|---|---|---|
| `hour` | `number` | 0–23 (clinic-local) |
| `count` | `number` | Appointment count starting in this hour |

---

## Entity Relationship to Existing Schema

```
Appointment
├── doctorProfileId  → DoctorProfile → User (name)
├── patientUserId    → User (follow-up name, active patient count)
│                    → PatientProfile
└── startTime (UTC)  → converted to clinic tz via ClinicConfig.timeZone

WaitlistEntry
└── doctorProfileId  → DoctorProfile → User (name)

WorkingHour + Holiday + DoctorScheduleOverride
└── consumed by SlotGeneratorService for doctor utilization

AuditLog
└── actorId → User.role (for cancellation actor classification)
    entityId = Appointment.id
    action = 'appointment.canceled'
```
