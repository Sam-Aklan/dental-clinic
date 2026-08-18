# Research: Analytics Module

**Branch**: `035-analytics-module` | **Phase**: 0 | **Date**: 2026-05-16

All NEEDS CLARIFICATION items from the spec were resolved via spec clarifications and codebase inspection. No external research was required. Findings are documented below.

---

## R-001: Timezone-Aware Date Math

**Decision**: Use Luxon for all clinic-local date boundary and bucket calculations.

**Rationale**: Luxon is already a direct dependency used by `SlotGeneratorService` (`backend/src/appointments/slot-generator.service.ts`). It handles DST transitions correctly via `setZone` and produces correct day/week/month starts in the clinic's IANA timezone. PostgreSQL `AT TIME ZONE` functions would require `$queryRaw` or `$queryRawUnsafe`, bypassing TypeScript typing and making queries harder to maintain and test.

**Alternatives considered**:
- Day.js + timezone plugin: not installed; adds a dependency.
- date-fns-tz: not installed; adds a dependency.
- Native JavaScript `Date`: no timezone support; would require manual offset math.

**How to apply**: Load `ClinicConfig.timeZone` once per request. Convert `from`/`to` YYYY-MM-DD strings to `DateTime.fromISO(date, { zone })`, then derive UTC bounds as `startOfDay.toUTC().toJSDate()` (inclusive) and `endOfDay.plus({ days: 1 }).startOf('day').toUTC().toJSDate()` (exclusive). Pass UTC bounds to all Prisma queries.

---

## R-002: Bucket Filling Strategy

**Decision**: Fetch bounded appointment rows from Prisma, then fill buckets in application code using Luxon.

**Rationale**: PostgreSQL `generate_series` with timezone-aware truncation requires raw SQL. Application-side filling with Luxon is simpler, self-contained, and consistent with the slot generation approach already in the codebase. For the data volumes expected (single clinic, limited date ranges), in-memory bucket filling is negligible.

**Alternatives considered**:
- `$queryRaw` with `generate_series` + `date_trunc`: bypasses TypeScript typing, complicates tests.
- Prisma `groupBy`: cannot produce zero-filled buckets for missing time periods.

**How to apply**: After fetching appointments in UTC range, build a map of `bucketStart → counts`. Then iterate from `rangeStart` to `rangeEnd` incrementing by the bucket size (day / week / month) in clinic timezone, output zero-filled entries for missing buckets.

---

## R-003: Cancellation Actor Classification

**Decision**: Derive cancellation actor from `AuditLog` records joined by `entityId` (appointmentId) and `action = 'appointment.canceled'`; fall back to `canceledByStaff` when no audit record is found.

**Rationale**: The `Appointment` model has no `canceledByRole` or `canceledByPatientId` field (confirmed from `scheduling.prisma`). The `AuditLog` model records `actorId` (User), `action` (string), and `entityId`. For cancellation trend reports, fetching AuditLog records where `entityType = 'appointment'`, `action = 'appointment.canceled'`, and `entityId IN (canceledIds)` enables looking up the actor's `role` to classify as PATIENT (`→ canceledByPatient`) or staff (`→ canceledByStaff`).

**Alternatives considered**:
- Default all CANCELED to `canceledByStaff`: simpler but inaccurate when patients cancel their own appointments.
- Add `canceledByRole` to Appointment: requires schema change and migration — excluded per spec (no schema changes needed).

**Risk**: If audit logs are not written for every cancellation event (e.g., direct DB updates or future code paths without audit calls), some cancellations will fall through to the `canceledByStaff` default. This is acceptable per the spec fallback rule.

---

## R-004: Doctor Utilization Slot Calculation

**Decision**: Reuse `SlotGeneratorService` to enumerate total available slots per doctor per date range, then count booked appointments separately.

**Rationale**: `SlotGeneratorService.generate()` already handles working hours, holidays, and doctor schedule overrides correctly. Reusing it avoids duplicating complex schedule math. Inject `SlotGeneratorService` into `AnalyticsService` and call it per doctor over the requested range.

**Alternatives considered**:
- Approximate slot count from working hours only: misses holidays and overrides — inaccurate.
- Raw SQL slot math: duplicates `SlotGeneratorService` logic, harder to maintain.

**How to apply**: For each active `DoctorProfile`, call `slotGenerator.generate({ ... range, clinicConfig, workingHours, holidays, overrides, bookedStartTimes: [] })` to get total slots. Count the result array length for `totalSlots`. Count booked appointments (CONFIRMED | IN_PROGRESS | COMPLETED) for `bookedSlots`. Cap `utilizationPct = min(bookedSlots / totalSlots, 1.0)`. Return `0` when `totalSlots = 0`.

---

## R-005: Waitlist "Active" Definition

**Decision**: Count all current `WaitlistEntry` records as active (no status field exists on the model).

**Rationale**: The `WaitlistEntry` model has no `status` field (confirmed from `waitlist.prisma`). Entries are removed from the table when an offer is accepted or the entry is removed. All existing rows are therefore currently-active waitlist members.

**Alternatives considered**:
- Filter by outstanding `WaitlistOffer` status: entry-level activity is not tied to offer status.
- Filter by `availableUntil` date: this field is optional and not a reliable active indicator.

---

## R-006: Active Patients Definition (KPI Summary)

**Decision**: Count distinct `patientUserId` values from appointments in the range where `status != CANCELED`.

**Rationale**: Spec clarification confirmed "unique patients with at least one non-canceled appointment in the selected range." Prisma `findMany` with `select: { patientUserId: true }`, `distinct: ['patientUserId']`, and `where: { status: { not: AppointmentStatus.CANCELED } }` expresses this directly.

**Alternatives considered**:
- Count distinct across all statuses including CANCELED: incorrect per spec.
- Separate `groupBy` query: equivalent but less readable than `distinct`.

---

## R-007: Prisma Query Strategy per Endpoint

**Decision**: Use `groupBy` for simple status distribution; use `findMany` + in-memory aggregation for trend series, follow-ups, and doctor stats.

**Rationale**: `groupBy` is clean for flat counts (status distribution, appointments by weekday). For time-bucketed trends, hourly grouping, and follow-up eligibility, `findMany` with TypeScript processing is safer for timezone-aware bucket assignment, zero-fill, and complex multi-query joins.

| Endpoint | Query Strategy |
|---|---|
| `getStatusDistribution` | `groupBy(['status'])` |
| `getAppointmentsByWeekday` | `findMany` → map to clinic-local `dayOfWeek` in Luxon |
| `getTrends` | `findMany` → in-memory bucketing with zero-fill |
| `getCancellationTrends` | `findMany(CANCELED + NO_SHOW)` + AuditLog join |
| `getKpiSummary` | multiple targeted queries |
| `getDoctorUtilization` | per-doctor slot generation + appointment count |
| `getFollowUps` | last COMPLETED per patient + upcoming check + pagination |
| `getMyHourlyLoad` | `findMany` → map to clinic-local hour via Luxon |
| `getMyTrends` | `findMany` for 7-day week range → day-label map |
| All "today" endpoints | bounded UTC range for clinic-local today |

---

## R-008: `month` Bucket Validation

**Decision**: Reject `bucket = 'month'` for ranges of 31 days or fewer at the service level (not DTO level) since the range is needed to validate the bucket choice.

**Rationale**: DTO validation operates on individual fields; cross-field validation (bucket vs range length) belongs in service initialization. Throw `BadRequestException` when `bucket = 'month'` and `durationDays <= 31`.

---

## R-009: `waiting` Status Mapping in Today Summary

**Decision**: `waiting` counts `CONFIRMED` appointments whose `startTime <= now` that have not yet transitioned to `IN_PROGRESS`.

**Rationale**: The spec defines "waiting" as confirmed patients who have arrived but are not yet in session. Since `startTime <= now` and `status = CONFIRMED` is the nearest proxy in the current schema (no explicit check-in timestamp), this is the correct approximation.

---

## Resolved Clarifications

All four spec clarifications are implemented as follows:

| Clarification | Resolution |
|---|---|
| Missing clinic timezone | Reject with `BadRequestException` before any date math |
| Active patients count | Distinct `patientUserId` with at least one non-CANCELED appointment |
| Cancellation/no-show rate denominator | All scheduled appointments in range (all statuses) |
| Previous-period deltas | Immediately preceding equal-length period |
