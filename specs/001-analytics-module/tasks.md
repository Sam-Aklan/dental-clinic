---

description: "Executable task list for Analytics Module implementation"
---

# Tasks: Analytics Module

**Input**: Design documents from `/specs/001-analytics-module/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/analytics-api.md`, `quickstart.md`
**Feature Branch**: `035-analytics-module`
**Project Type**: NestJS backend REST module only; frontend integration is excluded

**Tests**: Required by FR-025, the implementation plan, and backend constitution because this module contains auth, RBAC/ownership, DTO validation, analytics role scoping, and timezone-sensitive aggregation.

**Organization**: Tasks are grouped by user story so a low-cost LLM can implement one independently testable increment at a time.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it touches different files and does not depend on an incomplete task
- **[Story]**: Required only for user-story phases, maps to User Story 1 through User Story 5 in `spec.md`
- Every task line includes an exact repository-relative file path

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the analytics module skeleton and register it without adding business behavior.

- [X] T001 Create the analytics source directory and empty module files in `backend/src/analytics/analytics.module.ts`, `backend/src/analytics/analytics.controller.ts`, `backend/src/analytics/analytics.service.ts`, `backend/src/analytics/analytics.types.ts`, and `backend/src/analytics/dto/index.ts`
- [X] T002 Register `AnalyticsModule` in the Nest application imports in `backend/src/app.module.ts`
- [X] T003 Implement `AnalyticsModule` with `PrismaModule`, `AnalyticsController`, `AnalyticsService`, and `SlotGeneratorService` provider wiring in `backend/src/analytics/analytics.module.ts`
- [X] T004 [P] Define shared analytics constants and types for supported appointment statuses, staff roles, doctor role checks, weekday labels, bucket names, and pagination limits in `backend/src/analytics/analytics.types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build shared DTOs, validation tests, service helpers, and controller guard conventions required by all user stories.

**Critical**: No user-story implementation should begin until this phase is complete.

- [X] T005 [P] Add DTO validation tests for valid ISO date-only strings, missing `from`, missing `to`, non-date values, unknown query fields, and transformed query values in `backend/src/analytics/dto/date-range-query.dto.spec.ts`
- [X] T006 [P] Add DTO validation tests for `bucket` values `day`, `week`, `month`, rejection of invalid buckets, cancellation bucket rejection of `month`, follow-up default values, follow-up min/max limits, `my-stats` optional `date`, and `my-trends` required `week` in `backend/src/analytics/dto/analytics-query.dto.spec.ts`
- [X] T007 Implement `DateRangeQueryDto` with required `from` and `to` date-only query fields and Swagger metadata in `backend/src/analytics/dto/date-range-query.dto.ts`
- [X] T008 [P] Implement `BucketedRangeQueryDto` and `CancellationTrendsQueryDto` with enum validation and Swagger metadata in `backend/src/analytics/dto/bucketed-range-query.dto.ts` and `backend/src/analytics/dto/cancellation-trends-query.dto.ts`
- [X] T009 [P] Implement `FollowUpsQueryDto`, `MyStatsQueryDto`, and `MyTrendsQueryDto` with transformed numeric defaults, min/max pagination validation, optional `date`, required `week`, and Swagger metadata in `backend/src/analytics/dto/follow-ups-query.dto.ts`, `backend/src/analytics/dto/my-stats-query.dto.ts`, and `backend/src/analytics/dto/my-trends-query.dto.ts`
- [X] T010 Export all analytics query DTOs from the barrel file in `backend/src/analytics/dto/index.ts`
- [X] T011 Implement shared private helpers in `backend/src/analytics/analytics.service.ts` for loading `ClinicConfig.timeZone`, throwing `BadRequestException` when missing, converting clinic-local date ranges to UTC bounds with Luxon, enforcing `to >= from`, enforcing max 366 days, producing previous equal-length ranges, returning zero-filled status maps, calculating safe rates, and requiring `currentUser.doctorProfileId` for doctor-scoped reports
- [X] T012 Create the `AnalyticsController` class with `@ApiTags('analytics')`, constructor injection, no endpoints yet, and imports for `JwtAuthGuard`, `RolesGuard`, `Roles`, `CurrentUser`, `Role`, and analytics DTOs in `backend/src/analytics/analytics.controller.ts`

**Checkpoint**: Shared validation, module registration, and date/time helpers are ready for story work.

---

## Phase 3: User Story 1 - View Clinic Performance Summary (Priority: P1) MVP

**Goal**: Administrators and receptionists can retrieve clinic-level KPI, active waitlist, and today operational summaries while patients and doctors are denied.

**Independent Test**: Sign in as administrator or receptionist, request `/api/analytics/kpi-summary`, `/api/analytics/waitlist-summary`, and `/api/analytics/today-summary` against deterministic seeded data, verify totals/rates/deltas/zero values/today counts, then verify patient and doctor tokens receive 403.

### Tests for User Story 1

- [ ] T013 [US1] Add service unit tests for KPI totals, completed count, cancellation/no-show rate denominators, active patient distinct count excluding canceled-only patients, current waitlist size, previous-period deltas, empty-range zero values, and missing timezone rejection in `backend/src/analytics/analytics.service.spec.ts`
- [ ] T014 [US1] Add service unit tests for active waitlist summary grouping by doctor, today summary clinic-local bounds, waiting count as `CONFIRMED` with `startTime <= now`, and zero values with no appointments in `backend/src/analytics/analytics.service.spec.ts`
- [ ] T015 [US1] Add e2e tests for administrator/receptionist success, patient/doctor 403, unauthenticated 401, invalid date 400, range over 366 days 400, missing timezone 400, and success envelopes for KPI/waitlist/today summary in `backend/test/analytics.e2e-spec.ts`

### Implementation for User Story 1

- [X] T016 [P] [US1] Implement `KpiSummaryResponseDto`, `WaitlistSummaryResponseDto`, and `TodaySummaryResponseDto` with Swagger properties and integer/decimal field documentation in `backend/src/analytics/dto/kpi-summary-response.dto.ts`, `backend/src/analytics/dto/waitlist-summary-response.dto.ts`, and `backend/src/analytics/dto/today-summary-response.dto.ts`
- [X] T017 [US1] Export User Story 1 response DTOs from `backend/src/analytics/dto/index.ts`
- [X] T018 [US1] Implement `getKpiSummary(query)` in `backend/src/analytics/analytics.service.ts` using read-only Prisma queries for appointments, active patients, waitlist size, immediately preceding equal-length period, safe rates, and zero values when denominators are zero
- [X] T019 [US1] Implement `getWaitlistSummary()` in `backend/src/analytics/analytics.service.ts` using read-only Prisma `waitlistEntry` queries, doctor/user name joins, total active count, by-doctor counts, and count-desc sorting
- [X] T020 [US1] Implement `getTodaySummary()` in `backend/src/analytics/analytics.service.ts` using clinic-local current-day UTC bounds, status counts, waiting proxy, pending confirmation, and missing timezone rejection in `backend/src/analytics/analytics.service.ts`
- [X] T021 [US1] Add `GET /kpi-summary`, `GET /waitlist-summary`, and `GET /today-summary` controller methods with `JwtAuthGuard`, `RolesGuard`, `@Roles(Role.ADMIN, Role.RECEPTIONIST)`, `@ApiBearerAuth`, `@ApiOperation`, and 200/400/401/403 Swagger responses in `backend/src/analytics/analytics.controller.ts`

**Checkpoint**: User Story 1 is independently functional and can be demoed as the MVP.

---

## Phase 4: User Story 2 - Analyze Appointment Patterns (Priority: P2)

**Goal**: Administrators and receptionists can retrieve chart-ready trends, status distributions, weekday counts, and cancellation trends with clinic-timezone zero-filled buckets.

**Independent Test**: Request trend, status, weekday, and cancellation reports over seeded appointments spanning multiple days, weeks, statuses, and cancellation actors; verify continuous bucket output, all status keys, all weekdays, and patient/staff/no-show cancellation breakdowns.

### Tests for User Story 2

- [ ] T022 [US2] Add service unit tests for day/week/month appointment trend bucketing, zero-filled missing periods, `month` bucket rejection for ranges of 31 days or fewer, DST boundary continuity, and max 366-day validation in `backend/src/analytics/analytics.service.spec.ts`
- [ ] T023 [US2] Add service unit tests for all-six-status distribution, weekday label/count mapping in clinic timezone, cancellation trend day/week bucketing, patient versus staff cancellation classification from `AuditLog`, and staff fallback when no audit record exists in `backend/src/analytics/analytics.service.spec.ts`
- [ ] T024 [US2] Add e2e tests for `/trends`, `/status-distribution`, `/appointments-by-weekday`, and `/cancellation-trends` including admin/receptionist success, patient/doctor 403, invalid bucket 400, month cancellation bucket 400, and zero-filled response shapes in `backend/test/analytics.e2e-spec.ts`

### Implementation for User Story 2

- [X] T025 [P] [US2] Implement `AppointmentTrendResponseDto`, `StatusDistributionResponseDto`, `AppointmentsByWeekdayResponseDto`, and `CancellationTrendResponseDto` with Swagger properties in `backend/src/analytics/dto/appointment-trend-response.dto.ts`, `backend/src/analytics/dto/status-distribution-response.dto.ts`, `backend/src/analytics/dto/appointments-by-weekday-response.dto.ts`, and `backend/src/analytics/dto/cancellation-trend-response.dto.ts`
- [X] T026 [US2] Export User Story 2 response DTOs from `backend/src/analytics/dto/index.ts`
- [X] T027 [US2] Implement `getAppointmentTrends(query)` in `backend/src/analytics/analytics.service.ts` using Prisma appointment reads, Luxon clinic-local bucket starts, continuous zero-filled day/week/month buckets, all count fields, and service-level rejection of `month` for ranges of 31 days or fewer
- [X] T028 [US2] Implement `getStatusDistribution(query)` in `backend/src/analytics/analytics.service.ts` using Prisma `appointment.groupBy`, the shared zero-status map, clinic-local UTC bounds, and all six statuses even when absent
- [X] T029 [US2] Implement `getAppointmentsByWeekday(query)` in `backend/src/analytics/analytics.service.ts` by reading appointments in range, mapping each `startTime` to clinic-local weekday, and returning exactly seven Sunday-through-Saturday items with zero counts in `backend/src/analytics/analytics.service.ts`
- [X] T030 [US2] Implement `getCancellationTrends(query)` in `backend/src/analytics/analytics.service.ts` with day/week zero-filled buckets, `CANCELED` and `NO_SHOW` appointment reads, `AuditLog` lookup by appointment IDs and `appointment.canceled` action, patient-role classification, staff fallback, and no `month` bucket support
- [X] T031 [US2] Add `GET /trends`, `GET /status-distribution`, `GET /appointments-by-weekday`, and `GET /cancellation-trends` controller methods with staff-only roles, query DTOs, Swagger response decorators, and no patient PII in aggregate examples in `backend/src/analytics/analytics.controller.ts`

**Checkpoint**: User Story 2 can be validated independently without implementing doctor-specific reports or follow-ups.

---

## Phase 5: User Story 3 - Review Doctor Utilization and Daily Load (Priority: P3)

**Goal**: Administrators can review doctor utilization while administrators and receptionists can see today's per-doctor appointment distribution.

**Independent Test**: Sign in as administrator and request utilization for a seeded range with working hours, holidays, overrides, booked appointments, zero-slot doctors, and overbooked doctors; request today-by-doctor as admin/receptionist and verify active doctors with zero counts are included.

### Tests for User Story 3

- [ ] T032 [US3] Add service unit tests for doctor utilization total slots via `SlotGeneratorService`, booked statuses `CONFIRMED|IN_PROGRESS|COMPLETED`, zero-slot utilization as 0, overbooked utilization capped at 1, and sorting by utilization desc then doctor name asc in `backend/src/analytics/analytics.service.spec.ts`
- [ ] T033 [US3] Add service unit tests for today-by-doctor active doctor inclusion, per-status counts, zero-count doctors, and clinic-local today bounds in `backend/src/analytics/analytics.service.spec.ts`
- [ ] T034 [US3] Add e2e tests for `/doctor-utilization` admin success, receptionist/doctor/patient 403, `/today-by-doctor` admin/receptionist success, doctor/patient 403, and Swagger-envelope response shapes in `backend/test/analytics.e2e-spec.ts`

### Implementation for User Story 3

- [X] T035 [P] [US3] Implement `DoctorUtilizationResponseDto` and `TodayByDoctorResponseDto` with Swagger properties for doctor IDs, doctor names, integer counts, and `utilizationPct` decimal bounds in `backend/src/analytics/dto/doctor-utilization-response.dto.ts` and `backend/src/analytics/dto/today-by-doctor-response.dto.ts`
- [X] T036 [US3] Export User Story 3 response DTOs from `backend/src/analytics/dto/index.ts`
- [X] T037 [US3] Implement `getDoctorUtilization(query)` in `backend/src/analytics/analytics.service.ts` by reading active doctors, clinic config, working hours, holidays, doctor schedule overrides, booked appointments, calling `SlotGeneratorService.generate()` per doctor, calculating capped utilization, and sorting results
- [X] T038 [US3] Implement `getTodayByDoctor()` in `backend/src/analytics/analytics.service.ts` by reading active doctors with user names, aggregating today's `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, and `CANCELED` appointments per doctor, and including zero-count doctors
- [X] T039 [US3] Add `GET /doctor-utilization` with `@Roles(Role.ADMIN)` and `GET /today-by-doctor` with `@Roles(Role.ADMIN, Role.RECEPTIONIST)` plus Swagger 200/400/401/403 responses in `backend/src/analytics/analytics.controller.ts`

**Checkpoint**: User Story 3 works independently after the shared foundation and does not require doctor personal endpoints.

---

## Phase 6: User Story 4 - Monitor Doctor-Specific Workload (Priority: P4)

**Goal**: A doctor can retrieve only their own daily, weekly, hourly, and status analytics; doctors without a linked profile are denied.

**Independent Test**: Sign in as a doctor linked to a `DoctorProfile`, request all `/my-*` endpoints, verify only that doctor's appointments are counted, then sign in as a doctor without a profile and verify 403.

### Tests for User Story 4

- [ ] T040 [US4] Add service unit tests for doctor profile requirement, `my-stats` requested date or clinic-local today, remaining today as `PENDING + CONFIRMED`, in-session/no-show counts, and current clinic-local week total scoped to one doctor in `backend/src/analytics/analytics.service.spec.ts`
- [ ] T041 [US4] Add service unit tests for `my-trends` seven-item Monday-through-Sunday week, `my-hourly-load` sparse positive-count hours, and `my-status-distribution` all status keys scoped to authenticated `doctorProfileId` in `backend/src/analytics/analytics.service.spec.ts`
- [ ] T042 [US4] Add e2e tests for `/my-stats`, `/my-trends`, `/my-hourly-load`, and `/my-status-distribution` doctor success, staff/patient 403, doctor-without-profile 403, invalid dates 400, and no cross-doctor data leakage in `backend/test/analytics.e2e-spec.ts`

### Implementation for User Story 4

- [X] T043 [P] [US4] Implement `DoctorStatsResponseDto`, `MyTrendResponseDto`, `HourlyLoadResponseDto`, and reuse/export `StatusDistributionResponseDto` for doctor status distribution in `backend/src/analytics/dto/doctor-stats-response.dto.ts`, `backend/src/analytics/dto/my-trend-response.dto.ts`, and `backend/src/analytics/dto/hourly-load-response.dto.ts`
- [X] T044 [US4] Export User Story 4 response DTOs from `backend/src/analytics/dto/index.ts`
- [X] T045 [US4] Implement `getMyStats(query, currentUser)` in `backend/src/analytics/analytics.service.ts` by requiring `doctorProfileId`, deriving requested date or clinic-local today, counting only that doctor's appointments, and calculating current week total
- [X] T046 [US4] Implement `getMyTrends(query, currentUser)` in `backend/src/analytics/analytics.service.ts` by requiring `doctorProfileId`, deriving the Monday-to-Sunday clinic-local week containing `week`, returning exactly seven day items, and zero-filling missing days
- [X] T047 [US4] Implement `getMyHourlyLoad(query, currentUser)` and `getMyStatusDistribution(query, currentUser)` in `backend/src/analytics/analytics.service.ts` using clinic-local UTC bounds, doctorProfileId scoping, sparse positive-count hourly load, and all-six-status distribution
- [X] T048 [US4] Add `GET /my-stats`, `GET /my-trends`, `GET /my-hourly-load`, and `GET /my-status-distribution` controller methods with `@Roles(Role.DOCTOR)`, `@CurrentUser()`, query DTOs, and Swagger 200/400/401/403 responses in `backend/src/analytics/analytics.controller.ts`

**Checkpoint**: User Story 4 proves doctor ownership boundaries independently from staff analytics.

---

## Phase 7: User Story 5 - Identify Patients Needing Follow-Up (Priority: P5)

**Goal**: Administrators, receptionists, and doctors can retrieve a paginated follow-up list; doctors see only patients they completed appointments with.

**Independent Test**: Request follow-ups with different thresholds, pages, page sizes, and roles; verify eligibility, sorting, pagination totals, upcoming appointment flags, patient names only in this table response, and doctor ownership scope.

### Tests for User Story 5

- [ ] T049 [US5] Add service unit tests for follow-up eligibility from last `COMPLETED` appointment, exclusion of patients with no completed history, `daysSince > thresholdDays`, upcoming appointment flag for `PENDING|CONFIRMED|IN_PROGRESS`, sorting by `daysSince` desc then patient name asc, and pagination metadata in `backend/src/analytics/analytics.service.spec.ts`
- [ ] T050 [US5] Add service unit tests for doctor follow-up scoping to patients completed with the authenticated doctor's `doctorProfileId`, doctor-without-profile 403, admin/receptionist global scope, and threshold/page/pageSize validation assumptions in `backend/src/analytics/analytics.service.spec.ts`
- [ ] T051 [US5] Add e2e tests for `/follow-ups` admin/receptionist success, doctor own-patient success, doctor cross-patient exclusion, patient 403, invalid threshold/page/pageSize 400, and response envelope pagination shape in `backend/test/analytics.e2e-spec.ts`

### Implementation for User Story 5

- [X] T052 [P] [US5] Implement `FollowUpResponseDto` with `items`, `patientId`, `patientName`, `lastAppointmentDate`, `daysSince`, `hasUpcoming`, `page`, `pageSize`, and `total` Swagger properties in `backend/src/analytics/dto/follow-up-response.dto.ts`
- [X] T053 [US5] Export User Story 5 response DTOs from `backend/src/analytics/dto/index.ts`
- [X] T054 [US5] Implement `getFollowUps(query, currentUser)` in `backend/src/analytics/analytics.service.ts` by applying default `thresholdDays=90`, `page=1`, `pageSize=20`, max `pageSize=100`, clinic-local today, latest completed appointment per patient, doctor ownership filtering, upcoming appointment detection, sorting, pagination, and no non-follow-up PII leakage
- [X] T055 [US5] Add `GET /follow-ups` controller method with `@Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)`, `@CurrentUser()`, `FollowUpsQueryDto`, and Swagger 200/400/401/403 response decorators in `backend/src/analytics/analytics.controller.ts`

**Checkpoint**: User Story 5 completes the final analytics endpoint while preserving ownership and PII boundaries.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Verify contracts, quality, performance, documentation, and read-only guarantees across all stories.

- [ ] T056 [P] Verify all 14 analytics endpoints, authorization matrix, query parameters, response shapes, and Swagger examples match `specs/001-analytics-module/contracts/analytics-api.md`
- [ ] T057 [P] Add or refine controller metadata tests for analytics guards, roles, Swagger tags, and route paths in `backend/src/analytics/analytics.controller.spec.ts`
- [ ] T058 Audit `backend/src/analytics/analytics.service.ts` to ensure it performs no Prisma writes, creates no audit log rows, logs no secrets or PII, and exposes patient names only from `getFollowUps()`
- [ ] T059 Review and optimize Prisma read patterns in `backend/src/analytics/analytics.service.ts` so typical single-clinic reports avoid obvious N+1 appointment, user, and waitlist queries while preserving readable service logic
- [X] T060 Run targeted analytics unit tests and fix failures in `backend/src/analytics/analytics.service.spec.ts` and `backend/src/analytics/dto/analytics-query.dto.spec.ts` using `pnpm --dir backend test -- --testPathPattern=analytics`
- [ ] T061 Run analytics e2e tests and fix failures in `backend/test/analytics.e2e-spec.ts` using `pnpm --dir backend test:e2e -- --testPathPattern=analytics`
- [ ] T062 Run backend build and Prisma checks, then fix any analytics-related TypeScript or Prisma issues in `backend/src/analytics/` using `pnpm --dir backend build`, `pnpm --dir backend prisma format`, and `pnpm --dir backend prisma generate`
- [ ] T063 Update the quickstart validation notes if any analytics command or endpoint behavior differs from the implemented backend in `specs/001-analytics-module/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; start immediately
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational; MVP scope
- **User Story 2 (Phase 4)**: Depends on Foundational and can be implemented after or alongside US1, but sequential delivery should keep P1 first
- **User Story 3 (Phase 5)**: Depends on Foundational and benefits from shared date/status helpers
- **User Story 4 (Phase 6)**: Depends on Foundational and shared status/date helpers
- **User Story 5 (Phase 7)**: Depends on Foundational and doctor-profile ownership helper
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories after Foundational; suggested MVP
- **US2 (P2)**: No dependency on US1 implementation, but reuses foundational date/status helpers
- **US3 (P3)**: No dependency on US1 or US2 implementation, but reuses foundational date helpers and `SlotGeneratorService`
- **US4 (P4)**: No dependency on staff reports, but reuses foundational doctor-profile helper and status map
- **US5 (P5)**: No dependency on other endpoint implementations, but reuses foundational doctor-profile helper and pagination DTO

### Within Each User Story

- Write or update tests before implementation tasks when feasible and verify they fail for missing behavior
- Create response DTOs before adding controller Swagger response decorators
- Implement service methods before adding controller endpoints that call them
- Keep controller methods transport-only; Prisma queries belong only in `AnalyticsService`
- Stop at each checkpoint and run that story's relevant unit/e2e tests before continuing

---

## Parallel Execution Examples

### User Story 1

```text
Task: T016 Implement response DTOs in backend/src/analytics/dto/kpi-summary-response.dto.ts, backend/src/analytics/dto/waitlist-summary-response.dto.ts, and backend/src/analytics/dto/today-summary-response.dto.ts
Task: T013 Add KPI service unit tests in backend/src/analytics/analytics.service.spec.ts
Task: T015 Add US1 e2e tests in backend/test/analytics.e2e-spec.ts
```

### User Story 2

```text
Task: T025 Implement pattern response DTOs in backend/src/analytics/dto/*response.dto.ts
Task: T022 Add trend service unit tests in backend/src/analytics/analytics.service.spec.ts
Task: T024 Add pattern e2e tests in backend/test/analytics.e2e-spec.ts
```

### User Story 3

```text
Task: T035 Implement doctor response DTOs in backend/src/analytics/dto/doctor-utilization-response.dto.ts and backend/src/analytics/dto/today-by-doctor-response.dto.ts
Task: T032 Add utilization service unit tests in backend/src/analytics/analytics.service.spec.ts
Task: T034 Add utilization e2e tests in backend/test/analytics.e2e-spec.ts
```

### User Story 4

```text
Task: T043 Implement doctor personal response DTOs in backend/src/analytics/dto/doctor-stats-response.dto.ts, backend/src/analytics/dto/my-trend-response.dto.ts, and backend/src/analytics/dto/hourly-load-response.dto.ts
Task: T040 Add my-stats service unit tests in backend/src/analytics/analytics.service.spec.ts
Task: T042 Add doctor personal e2e tests in backend/test/analytics.e2e-spec.ts
```

### User Story 5

```text
Task: T052 Implement follow-up response DTO in backend/src/analytics/dto/follow-up-response.dto.ts
Task: T049 Add follow-up service unit tests in backend/src/analytics/analytics.service.spec.ts
Task: T051 Add follow-up e2e tests in backend/test/analytics.e2e-spec.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 Setup: T001 through T004
2. Complete Phase 2 Foundational: T005 through T012
3. Complete Phase 3 User Story 1: T013 through T021
4. Stop and validate with targeted analytics unit/e2e tests for KPI, waitlist summary, and today summary
5. Demo the MVP endpoints `/api/analytics/kpi-summary`, `/api/analytics/waitlist-summary`, and `/api/analytics/today-summary`

### Incremental Delivery

1. Deliver US1 as the MVP and verify admin/receptionist success plus patient/doctor denial
2. Add US2 appointment pattern reports and verify zero-filled chart payloads
3. Add US3 doctor utilization and today-by-doctor reports
4. Add US4 doctor-owned personal analytics and verify ownership scoping
5. Add US5 follow-up list and verify patient-name exposure is limited to authorized table results
6. Complete Phase 8 quality, build, and quickstart validation tasks

### Low-Cost LLM Guidance

1. Implement tasks in numeric order unless explicitly marked `[P]` and assigned to a separate worker
2. Read `specs/001-analytics-module/contracts/analytics-api.md` before each controller task
3. Read `specs/001-analytics-module/data-model.md` before each service aggregation task
4. Never add Prisma migrations or schema changes for this feature
5. Never add frontend files for this feature
6. Never write to Prisma models from analytics service methods
7. If a task conflicts with existing code, preserve existing module conventions and make the smallest compatible change

---

## Notes

- `AnalyticsService` is the only analytics class that may inject `PrismaService`
- `AnalyticsController` must not call Prisma directly
- All successful controller methods should return raw service data and let the existing global transform interceptor produce `{ statusCode, data }`
- All date math must use Luxon and `ClinicConfig.timeZone`
- Missing clinic timezone should return `400 Bad Request`
- Patient role must be denied for every analytics endpoint
- Doctor endpoints must return `403 Forbidden` when `AuthenticatedUser.doctorProfileId` is missing
- Aggregate chart responses must never include patient names or IDs
- `/follow-ups` is the only analytics endpoint that may return `patientName`
