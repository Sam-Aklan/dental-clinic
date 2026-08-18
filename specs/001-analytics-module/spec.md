# Feature Specification: Analytics Module

**Feature Branch**: `035-analytics-module`  
**Created**: 2026-05-16  
**Status**: Draft  
**Input**: User description: "Create specifications from docs/backend/backend-010-analytics-module/spec.md, excluding frontend integration content."

## Clarifications

### Session 2026-05-16

- Q: What should analytics do if the clinic timezone is missing? → A: Reject analytics requests with a validation/configuration error until a clinic timezone is configured.
- Q: How should active patients be counted in clinic KPI summary? → A: Count unique patients with at least one non-canceled appointment in the selected range.
- Q: What denominator should cancellation and no-show rates use? → A: Divide by all scheduled appointments in the range, including completed, canceled, and no-show visits.
- Q: What should previous-period deltas compare against? → A: Compare against the immediately preceding equal-length period.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Clinic Performance Summary (Priority: P1)

As an administrator or receptionist, I need a reliable clinic-level analytics summary for a selected date range so I can understand appointment volume, completion, cancellations, no-shows, active patients, and waitlist pressure without manually counting records.

**Why this priority**: Clinic leadership and operations staff need accurate summary metrics before any deeper reporting is useful.

**Independent Test**: Can be fully tested by signing in as an administrator or receptionist, requesting analytics for a known date range, and verifying the returned totals, rates, deltas, and zero-count behavior against seeded clinic data.

**Acceptance Scenarios**:

1. **Given** an administrator has selected a valid date range with appointments, **When** they request the clinic KPI summary, **Then** the response includes total appointments, completed appointments, cancellation rate, no-show rate, active patient count, waitlist size, and previous-period deltas.
2. **Given** a receptionist has selected a valid date range with no appointments, **When** they request the clinic KPI summary, **Then** the response succeeds and returns zero values rather than missing fields or an error.
3. **Given** a patient account is signed in, **When** the patient attempts to access clinic analytics, **Then** access is denied.

---

### User Story 2 - Analyze Appointment Patterns (Priority: P2)

As an administrator or receptionist, I need chart-ready appointment trends, status distributions, weekday patterns, and cancellation trends so I can identify demand, operational bottlenecks, and schedule reliability issues.

**Why this priority**: Pattern analysis helps staff plan capacity and identify problems after the summary metrics establish the overall state.

**Independent Test**: Can be fully tested by requesting trend, status, weekday, and cancellation reports over seeded appointments spanning multiple days, weeks, statuses, and cancellation types.

**Acceptance Scenarios**:

1. **Given** appointments exist across multiple statuses in a selected range, **When** an authorized staff user requests trend data by day, week, or month, **Then** the response includes continuous time buckets with zero-filled missing periods.
2. **Given** only some appointment statuses occur in a selected range, **When** an authorized staff user requests status distribution, **Then** every supported status is present and missing statuses have a count of zero.
3. **Given** canceled and no-show appointments exist in a selected range, **When** an authorized staff user requests cancellation trends, **Then** patient cancellations, staff cancellations, and no-shows are counted separately where the source data supports that distinction.

---

### User Story 3 - Review Doctor Utilization and Daily Load (Priority: P3)

As an administrator, I need doctor utilization and daily appointment distribution by doctor so I can assess provider capacity and balance clinic schedules.

**Why this priority**: Utilization analysis is valuable for management decisions but depends on the core analytics foundations being accurate first.

**Independent Test**: Can be fully tested by signing in as an administrator and requesting utilization for a known range that includes working hours, a holiday, a schedule override, booked appointments, and doctors with no available slots.

**Acceptance Scenarios**:

1. **Given** doctors have schedules, holidays, overrides, and booked appointments in a selected range, **When** an administrator requests doctor utilization, **Then** each doctor's booked slots, total available slots, and utilization percentage are returned with zero-slot doctors handled safely.
2. **Given** a receptionist account is signed in, **When** the receptionist requests doctor utilization, **Then** access is denied because this report is administrator-only.
3. **Given** today has appointments assigned to multiple active doctors, **When** an administrator or receptionist requests today's appointment counts by doctor, **Then** each active doctor appears with confirmed, in-progress, completed, and canceled counts, including zero-count doctors where applicable.

---

### User Story 4 - Monitor Doctor-Specific Workload (Priority: P4)

As a doctor, I need analytics scoped to my own appointments and eligible follow-up patients so I can manage today's workload, weekly trends, hourly demand, status mix, and patient follow-up needs.

**Why this priority**: Doctor-scoped analytics improves individual workflow while preserving privacy and ownership boundaries.

**Independent Test**: Can be fully tested by signing in as a doctor linked to a doctor profile and verifying that all personal analytics count only that doctor's appointments and patients.

**Acceptance Scenarios**:

1. **Given** a doctor has appointments today and during the current week, **When** the doctor requests personal stats and weekly trends, **Then** only appointments assigned to that doctor's profile are counted.
2. **Given** a doctor requests hourly load or status distribution for a valid date range, **When** the report is returned, **Then** counts are grouped by the clinic-local hour and scoped to that doctor only.
3. **Given** a doctor account has no linked doctor profile, **When** the account requests doctor-scoped analytics, **Then** access is denied.

---

### User Story 5 - Identify Patients Needing Follow-Up (Priority: P5)

As an administrator, receptionist, or doctor, I need a paginated follow-up list so I can identify patients whose last completed appointment is older than a configurable threshold and who may need outreach.

**Why this priority**: Follow-up discovery supports patient retention and care continuity but can be delivered after the core reporting endpoints.

**Independent Test**: Can be fully tested by requesting follow-ups with different thresholds and pages, then verifying patient eligibility, pagination totals, sorting, upcoming-appointment flags, and doctor ownership scope.

**Acceptance Scenarios**:

1. **Given** patients have completed appointments older than the threshold, **When** an administrator or receptionist requests follow-ups, **Then** eligible patients are returned with last appointment date, days since last completed appointment, and whether they have an upcoming appointment.
2. **Given** a doctor requests follow-ups, **When** eligible patients exist across multiple doctors, **Then** the doctor sees only patients who completed appointments with that doctor.
3. **Given** a follow-up request has invalid pagination or threshold values, **When** the request is submitted, **Then** it is rejected with a validation error.

### Edge Cases

- Date ranges where the end date is before the start date are rejected.
- Date ranges longer than 366 days for clinic-level reports are rejected.
- Time ranges crossing daylight saving changes still produce complete, non-duplicated clinic-local buckets.
- Empty appointment ranges return complete zero-filled shapes, not missing status maps or empty required fields.
- Doctors with no available slots return zero utilization rather than causing division errors.
- Overbooked doctors have utilization capped at 100%.
- Missing cancellation actor data falls back to a documented staff-versus-patient classification rule based on available source records.
- Active waitlist counts include only currently active waitlist entries.
- Patient names appear only in authorized follow-up table results and never in chart-style aggregate payloads.
- Analytics operations are read-only and do not create audit events.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide read-only analytics reporting for appointment, doctor, patient, and waitlist data.
- **FR-002**: System MUST require authenticated access for every analytics operation.
- **FR-003**: System MUST restrict clinic-level trend, status distribution, weekday, cancellation, KPI, waitlist, today summary, and today-by-doctor reports to administrators and receptionists unless a stricter role is specified.
- **FR-004**: System MUST restrict doctor utilization reporting to administrators only.
- **FR-005**: System MUST restrict doctor personal analytics to the authenticated doctor's own data.
- **FR-006**: System MUST deny patient users access to all analytics reports.
- **FR-007**: System MUST validate required date ranges, bucket options, follow-up thresholds, and pagination values before producing analytics results.
- **FR-008**: System MUST interpret date boundaries, day labels, week starts, and hourly grouping in the clinic's configured timezone, and reject analytics requests when the clinic timezone is missing.
- **FR-009**: System MUST return complete appointment trend series for valid day, week, and month buckets, including zero-count buckets for periods with no appointments.
- **FR-010**: System MUST return appointment status distributions with every supported status present and missing statuses counted as zero.
- **FR-011**: System MUST calculate doctor utilization from booked appointments and available schedule capacity, accounting for working hours, holidays, and doctor-specific schedule overrides.
- **FR-012**: System MUST calculate appointment counts by weekday using clinic-local dates.
- **FR-013**: System MUST calculate cancellation trends that distinguish patient cancellations, staff cancellations, and no-shows when the source records support that distinction.
- **FR-014**: System MUST calculate clinic KPI summaries including total appointments, completed appointments, cancellation rate, no-show rate, active patients, active waitlist size, and previous-period deltas, where active patients means unique patients with at least one non-canceled appointment in the selected range, cancellation/no-show rates use all scheduled appointments in the range as the denominator, and deltas compare against the immediately preceding equal-length period.
- **FR-015**: System MUST identify follow-up candidates whose last completed appointment is older than the requested threshold, excluding patients with no completed appointment history.
- **FR-016**: System MUST indicate whether each follow-up candidate has an upcoming pending, confirmed, or in-progress appointment.
- **FR-017**: System MUST paginate follow-up results and sort them by longest time since completed appointment, then patient name.
- **FR-018**: System MUST calculate active waitlist totals and group active waitlist entries by requested doctor where applicable.
- **FR-019**: System MUST calculate today's operational summary from the clinic-local current day, including total, waiting, in-progress, completed, canceled today, and pending confirmation counts.
- **FR-020**: System MUST calculate today's appointment counts by doctor, including active doctors with zero counts where applicable.
- **FR-021**: System MUST calculate doctor personal stats, weekly trends, hourly load, and status distribution using only the authenticated doctor's appointments.
- **FR-022**: System MUST return standardized success, validation failure, unauthenticated, and unauthorized outcomes consistently with the existing backend behavior.
- **FR-023**: System MUST avoid exposing patient personally identifiable information in aggregate chart reports.
- **FR-024**: System MUST expose patient names only in authorized follow-up table results for roles allowed to view those patients.
- **FR-025**: System MUST provide automated validation, service-level, authorization, and end-to-end coverage for analytics behavior using deterministic clinic data.

### Backend Contract & Security Requirements *(include for backend features)*

- **BC-001**: Owning backend module MUST be `backend/src/analytics`.
- **BC-002**: Analytics routes MUST be grouped under `/api/analytics` and preserve the contracts defined for trends, status distribution, doctor utilization, appointments by weekday, cancellation trends, KPI summary, follow-ups, waitlist summary, today summary, today by doctor, doctor personal stats, doctor personal trends, doctor hourly load, and doctor personal status distribution.
- **BC-003**: Protected access MUST define authentication, roles, and ownership scope for every analytics operation, including administrator-only doctor utilization and doctor-only personal reports.
- **BC-004**: Request query parameters MUST define validation rules for date ranges, bucket values, cancellation trend buckets, follow-up thresholds, pages, page sizes, optional doctor dates, and selected weeks.
- **BC-005**: Analytics workflows MUST be read-only, MUST NOT modify clinic data, and MUST NOT write audit events.
- **BC-006**: Public backend documentation MUST cover request and response shapes, authentication requirements, role restrictions, ownership scope, and major validation and authorization error cases.
- **BC-007**: Successful analytics responses MUST use the backend's standard success envelope and include complete response shapes suitable for direct dashboard consumption.
- **BC-008**: All count values MUST be integers, all rate and percentage values MUST be decimals from 0 to 1 unless otherwise bounded by explicit utilization capping, and invalid denominators MUST return zero rates.

### Key Entities *(include if feature involves data)*

- **Appointment Analytics Range**: A requested clinic-local date interval used to count appointments, statuses, cancellations, active patients, and deltas.
- **Trend Bucket**: A day, week, or month period in clinic-local time that contains appointment counts and must be present even when its count is zero.
- **Appointment Status Distribution**: Counts for pending, confirmed, in-progress, completed, canceled, and no-show appointments.
- **Doctor Utilization Summary**: A doctor's booked slots, available slots, display name, and utilization percentage for a selected range.
- **Clinic KPI Summary**: High-level operational metrics covering appointment totals, completion, cancellation, no-shows, active patients, waitlist size, and period-over-period changes.
- **Follow-Up Candidate**: A patient with an old last completed appointment, a calculated days-since value, and an upcoming-appointment indicator.
- **Waitlist Summary**: Active waitlist totals and grouped counts by doctor.
- **Today Summary**: Clinic-local current-day counts for total, waiting, in-progress, completed, canceled, and pending appointments.
- **Doctor Personal Analytics**: Doctor-owned daily, weekly, hourly, and status-based appointment metrics.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of analytics reports deny unauthenticated users and deny roles outside the authorization matrix.
- **SC-002**: Authorized users can retrieve each analytics report for valid inputs with complete required fields in at least 99% of test requests against deterministic seeded data.
- **SC-003**: 100% of empty valid ranges return successful zero-filled responses for required count fields and continuous trend buckets.
- **SC-004**: 100% of invalid date ranges, invalid buckets, invalid thresholds, and oversized pagination requests are rejected with validation errors before report generation.
- **SC-005**: Analytics counts match deterministic source data for appointment statuses, date buckets, doctor scope, waitlist activity, and follow-up eligibility across all automated acceptance tests.
- **SC-006**: Reports involving clinic-local dates remain accurate across at least one non-UTC timezone and one daylight saving boundary in automated tests.
- **SC-007**: Aggregate chart-style reports expose zero patient names or other patient-identifying table details.
- **SC-008**: Doctor-scoped analytics and follow-ups include only the authenticated doctor's eligible appointments and patients in 100% of ownership-scope tests.

## Assumptions

- Existing authentication, role, and current-user identity mechanisms are available and will be reused.
- Existing clinic configuration includes a clinic timezone; if it is missing, analytics requests fail with a validation/configuration error.
- Appointment, doctor, patient, schedule, holiday, schedule override, and waitlist data already exist in the backend domain model.
- Frontend integration content from the source document is intentionally excluded from this specification.
- Analytics responses are designed for dashboards but this feature does not implement dashboard pages, client-side caching, or frontend refresh behavior.
- Follow-up eligibility defaults to a 90-day threshold when the requester does not provide one.
- Follow-up pagination defaults to page 1 and 20 items per page, with a maximum page size of 100.
- Clinic-level date range reports allow a maximum range of 366 days.
