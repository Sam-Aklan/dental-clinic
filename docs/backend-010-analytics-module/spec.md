# Spec: AnalyticsModule (`backend/src/analytics/`)

**Type**: Backend NestJS Module  
**Plan reference**: [BACKEND_PLAN.md - section 10 AnalyticsModule](../../BACKEND_PLAN.md#10-analyticsmodule)  
**Frontend specs consumed**:
- [014-staff-queue-page](../014-staff-queue-page/spec.md) - receptionist operational dashboard KPI cards and today-by-doctor chart
- [018-admin-dashboard-page](../018-admin-dashboard-page/spec.md) - admin KPI cards, charts, follow-ups, waitlist summary
- [023-doctor-queue-page](../023-doctor-queue-page/spec.md) - optional doctor daily KPI source
- [024-doctor-today-page](../024-doctor-today-page/spec.md) - doctor KPI cards and personal charts

> **Frontend implementation status**: User confirmed on 2026-05-05 that the corresponding analytics/dashboard pages are not in place yet. Phase 3 is therefore a contract-first handoff for future frontend implementation, not an implementation dependency.

---

## Overview

AnalyticsModule owns role-scoped read-only reporting for clinic dashboards. It aggregates appointment, doctor, patient, and waitlist data into KPI cards, chart series, and paginated follow-up tables.

All analytics endpoints:

1. Are authenticated with `JwtAuthGuard`.
2. Use `RolesGuard` to enforce endpoint-level role access.
3. Return the standard response wrapper: `{ "statusCode": 200, "data": ... }`.
4. Use UTC timestamps in database queries while interpreting date boundaries in `ClinicConfig.timeZone`.
5. Never expose patient PII in chart payloads; only table payloads that staff roles can access include patient names.
6. Are read-only and do not write audit events.

---

## Phase 1 - DTOs, Validation & Controller Contracts

### 1.1 File Map

```
backend/src/analytics/
|-- analytics.module.ts
|-- analytics.controller.ts
|-- analytics.service.ts
|-- dto/
|   |-- date-range-query.dto.ts
|   |-- bucketed-range-query.dto.ts
|   |-- follow-ups-query.dto.ts
|   |-- my-stats-query.dto.ts
|   |-- my-trends-query.dto.ts
|   |-- appointment-trend-response.dto.ts
|   |-- status-distribution-response.dto.ts
|   |-- doctor-utilization-response.dto.ts
|   |-- kpi-summary-response.dto.ts
|   |-- follow-up-response.dto.ts
|   |-- waitlist-summary-response.dto.ts
|   |-- today-summary-response.dto.ts
|   `-- doctor-stats-response.dto.ts
`-- analytics.types.ts
```

### 1.2 Shared Query DTOs

#### `DateRangeQueryDto`

Used by endpoints that accept `from` and `to` only.

```typescript
class DateRangeQueryDto {
  @IsDateString()
  from: string; // YYYY-MM-DD, interpreted in clinic timezone

  @IsDateString()
  to: string; // YYYY-MM-DD, interpreted in clinic timezone
}
```

**Validation rules**:

- `to` must be greater than or equal to `from`.
- Max range is 366 days for admin/receptionist endpoints.
- Date-only strings are preferred; full ISO strings are accepted only if date parsing remains deterministic.
- Service converts the local clinic date range to UTC `[startInclusive, endExclusive)` before querying Prisma.

#### `BucketedRangeQueryDto`

Used by trend endpoints.

```typescript
class BucketedRangeQueryDto extends DateRangeQueryDto {
  @IsEnum(['day', 'week', 'month'])
  bucket: 'day' | 'week' | 'month';
}
```

**Validation rules**:

- `month` bucket is allowed only for ranges longer than 31 days.
- `week` and `month` buckets must still return ISO date strings representing the bucket start in clinic timezone.
- Empty buckets must be included with zero counts so charts render continuous series.

#### `CancellationTrendsQueryDto`

```typescript
class CancellationTrendsQueryDto extends DateRangeQueryDto {
  @IsEnum(['day', 'week'])
  bucket: 'day' | 'week';
}
```

#### `FollowUpsQueryDto`

```typescript
class FollowUpsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  thresholdDays?: number = 90;

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

#### `MyStatsQueryDto`

```typescript
class MyStatsQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string; // defaults to today in clinic timezone
}
```

#### `MyTrendsQueryDto`

```typescript
class MyTrendsQueryDto {
  @IsDateString()
  week: string; // any date inside the requested clinic-local week
}
```

### 1.3 Controller Endpoints

All routes are mounted under `/api/analytics`.

| Endpoint | Method | Roles | Query DTO | Service Method |
|---|---|---|---|---|
| `/trends` | GET | ADMIN, RECEPTIONIST | `BucketedRangeQueryDto` | `getTrends()` |
| `/status-distribution` | GET | ADMIN, RECEPTIONIST | `DateRangeQueryDto` | `getStatusDistribution()` |
| `/doctor-utilization` | GET | ADMIN | `DateRangeQueryDto` | `getDoctorUtilization()` |
| `/appointments-by-weekday` | GET | ADMIN, RECEPTIONIST | `DateRangeQueryDto` | `getAppointmentsByWeekday()` |
| `/cancellation-trends` | GET | ADMIN, RECEPTIONIST | `CancellationTrendsQueryDto` | `getCancellationTrends()` |
| `/kpi-summary` | GET | ADMIN, RECEPTIONIST | `DateRangeQueryDto` | `getKpiSummary()` |
| `/follow-ups` | GET | ADMIN, RECEPTIONIST, DOCTOR | `FollowUpsQueryDto` | `getFollowUps()` |
| `/waitlist-summary` | GET | ADMIN, RECEPTIONIST | none | `getWaitlistSummary()` |
| `/today-summary` | GET | ADMIN, RECEPTIONIST | none | `getTodaySummary()` |
| `/today-by-doctor` | GET | ADMIN, RECEPTIONIST | none | `getTodayByDoctor()` |
| `/my-stats` | GET | DOCTOR | `MyStatsQueryDto` | `getMyStats()` |
| `/my-trends` | GET | DOCTOR | `MyTrendsQueryDto` | `getMyTrends()` |
| `/my-hourly-load` | GET | DOCTOR | `DateRangeQueryDto` | `getMyHourlyLoad()` |
| `/my-status-distribution` | GET | DOCTOR | `DateRangeQueryDto` | `getMyStatusDistribution()` |

### 1.4 Response DTOs

#### `AppointmentTrendItemDto`

```typescript
class AppointmentTrendItemDto {
  date: string;
  total: number;
  confirmed: number;
  completed: number;
  canceled: number;
  noShow: number;
}
```

#### `StatusDistributionDto`

```typescript
class StatusDistributionDto {
  PENDING: number;
  CONFIRMED: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  CANCELED: number;
  NO_SHOW: number;
}
```

For doctor-only status distribution, the same shape is returned. Missing statuses must be returned as `0`.

#### `DoctorUtilizationItemDto`

```typescript
class DoctorUtilizationItemDto {
  doctorId: string;
  doctorName: string;
  bookedSlots: number;
  totalSlots: number;
  utilizationPct: number; // decimal, e.g. 0.76
}
```

**Calculation rules**:

- `bookedSlots` counts appointments with status `CONFIRMED`, `IN_PROGRESS`, or `COMPLETED`.
- `totalSlots` is derived from clinic working hours, holidays, and doctor schedule overrides for the selected range.
- A doctor with `totalSlots = 0` returns `utilizationPct = 0` to avoid division by zero.
- Results are sorted by `utilizationPct` descending, then `doctorName` ascending.

#### `AppointmentsByWeekdayItemDto`

```typescript
class AppointmentsByWeekdayItemDto {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  label: 'Sun' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
  count: number;
}
```

#### `CancellationTrendItemDto`

```typescript
class CancellationTrendItemDto {
  date: string;
  canceledByPatient: number;
  canceledByStaff: number;
  noShow: number;
}
```

If the schema does not yet distinguish cancellation actor, `canceledByStaff` must count cancellations where the actor role is not `PATIENT`; this can be derived from audit logs only if appointment rows do not carry `canceledByRole`.

#### `KpiSummaryDto`

```typescript
class KpiSummaryDto {
  totalAppointments: number;
  completed: number;
  cancellationRate: number;
  noShowRate: number;
  activePatients: number;
  waitlistSize: number;
  deltaTotalPct: number;
  deltaCompletedPct: number;
}
```

**Calculation rules**:

- `totalAppointments` counts all appointments in the range.
- `completed` counts status `COMPLETED`.
- `cancellationRate = CANCELED / totalAppointments`; return `0` when denominator is `0`.
- `noShowRate = NO_SHOW / totalAppointments`; return `0` when denominator is `0`.
- `activePatients` counts unique patients with at least one appointment in the range.
- `waitlistSize` counts active waitlist entries at query time, not historically over the range.
- `delta*Pct` compares the requested range to the immediately preceding equal-length range.

#### `FollowUpListDto`

```typescript
class FollowUpListDto {
  items: FollowUpItemDto[];
  page: number;
  pageSize: number;
  total: number;
}

class FollowUpItemDto {
  patientId: string;
  patientName: string;
  lastAppointmentDate: string;
  daysSince: number;
  hasUpcoming: boolean;
}
```

**Selection rules**:

- Include patients whose last completed appointment is older than `thresholdDays`.
- Exclude patients with no completed appointments.
- `hasUpcoming` is true when the patient has any `PENDING`, `CONFIRMED`, or `IN_PROGRESS` appointment after now.
- DOCTOR role is scoped to patients who have completed appointments with that doctor.
- Sort by `daysSince` descending, then `patientName` ascending.

#### `WaitlistSummaryDto`

```typescript
class WaitlistSummaryDto {
  totalActive: number;
  byDoctor: Array<{
    doctorId: string;
    doctorName: string;
    count: number;
  }>;
}
```

#### `TodaySummaryDto`

```typescript
class TodaySummaryDto {
  total: number;
  inProgress: number;
  waiting: number;
  completed: number;
  canceledToday: number;
  pendingConfirmation: number;
}
```

**Status mapping**:

- `waiting` counts today's `CONFIRMED` appointments whose `startsAt` is less than or equal to now and not yet `IN_PROGRESS`.
- `pendingConfirmation` counts today's `PENDING` appointments.
- `canceledToday` counts today's appointments with status `CANCELED`.

#### `TodayByDoctorItemDto`

```typescript
class TodayByDoctorItemDto {
  doctorId: string;
  doctorName: string;
  confirmed: number;
  inProgress: number;
  completed: number;
  canceled: number;
}
```

#### `DoctorStatsDto`

```typescript
class DoctorStatsDto {
  todayTotal: number;
  completedToday: number;
  remainingToday: number;
  inSession: number;
  noShowsToday: number;
  weekTotal: number;
}
```

#### `MyTrendItemDto`

```typescript
class MyTrendItemDto {
  date: string;
  dayLabel: string;
  count: number;
}
```

#### `HourlyLoadItemDto`

```typescript
class HourlyLoadItemDto {
  hour: number; // 0-23
  count: number;
}
```

### 1.5 Service Responsibilities

`AnalyticsService` should keep endpoint methods thin and move shared mechanics into private methods only when reused by multiple endpoints.

```typescript
@Injectable()
export class AnalyticsService {
  getTrends(query: BucketedRangeQueryDto): Promise<AppointmentTrendItemDto[]>;
  getStatusDistribution(query: DateRangeQueryDto): Promise<StatusDistributionDto>;
  getDoctorUtilization(query: DateRangeQueryDto): Promise<DoctorUtilizationItemDto[]>;
  getAppointmentsByWeekday(query: DateRangeQueryDto): Promise<AppointmentsByWeekdayItemDto[]>;
  getCancellationTrends(query: CancellationTrendsQueryDto): Promise<CancellationTrendItemDto[]>;
  getKpiSummary(query: DateRangeQueryDto): Promise<KpiSummaryDto>;
  getFollowUps(query: FollowUpsQueryDto, user: CurrentUser): Promise<FollowUpListDto>;
  getWaitlistSummary(): Promise<WaitlistSummaryDto>;
  getTodaySummary(): Promise<TodaySummaryDto>;
  getTodayByDoctor(): Promise<TodayByDoctorItemDto[]>;
  getMyStats(query: MyStatsQueryDto, user: CurrentUser): Promise<DoctorStatsDto>;
  getMyTrends(query: MyTrendsQueryDto, user: CurrentUser): Promise<MyTrendItemDto[]>;
  getMyHourlyLoad(query: DateRangeQueryDto, user: CurrentUser): Promise<HourlyLoadItemDto[]>;
  getMyStatusDistribution(query: DateRangeQueryDto, user: CurrentUser): Promise<StatusDistributionDto>;
}
```

**Shared implementation rules**:

- Load `ClinicConfig.timeZone` once per request path that needs date math; fallback should be explicit only if the config table has not been seeded.
- Convert clinic-local date ranges to UTC before passing bounds to Prisma.
- Prefer Prisma `groupBy` where it can express the aggregation cleanly.
- For bucket filling and timezone-aware grouping, use application code after fetching bounded rows if PostgreSQL timezone functions would make the query hard to maintain.
- Doctor endpoints must resolve the current user's `DoctorProfile` and return `403` if the user has role `DOCTOR` but no linked profile.
- Counts must be integers; percentages must be decimals in `[0, 1]` unless utilization exceeds scheduled capacity due to overbooking, in which case cap `utilizationPct` at `1`.

### 1.6 Authorization Matrix

| Endpoint | ADMIN | RECEPTIONIST | DOCTOR | PATIENT |
|---|---:|---:|---:|---:|
| `/trends` | yes | yes | no | no |
| `/status-distribution` | yes | yes | no | no |
| `/doctor-utilization` | yes | no | no | no |
| `/appointments-by-weekday` | yes | yes | no | no |
| `/cancellation-trends` | yes | yes | no | no |
| `/kpi-summary` | yes | yes | no | no |
| `/follow-ups` | yes | yes | own patients only | no |
| `/waitlist-summary` | yes | yes | no | no |
| `/today-summary` | yes | yes | no | no |
| `/today-by-doctor` | yes | yes | no | no |
| `/my-stats` | no | no | own data only | no |
| `/my-trends` | no | no | own data only | no |
| `/my-hourly-load` | no | no | own data only | no |
| `/my-status-distribution` | no | no | own data only | no |

---

## Phase 2 - Unit & E2E Tests

### 2.1 Unit Tests: DTO Validation

File: `src/analytics/dto/*.spec.ts`

Cover these cases:

| Case | Expected Result |
|---|---|
| Missing `from` or `to` on date range endpoint | validation fails with `400` |
| `to` before `from` | validation fails with `400` |
| Range longer than 366 days | validation fails with `400` |
| Invalid bucket value | validation fails with `400` |
| `thresholdDays` below 1 or above 365 | validation fails with `400` |
| `pageSize` above 100 | validation fails with `400` |
| Optional doctor date defaults omitted | validation passes |

### 2.2 Unit Tests: `AnalyticsService` Date Handling

File: `src/analytics/analytics.service.spec.ts`

Cover these cases:

| Case | Expected Result |
|---|---|
| Clinic timezone has non-UTC offset | local day boundaries query correct UTC range |
| DST boundary in clinic timezone | no duplicate or missing daily bucket |
| Empty date range with no appointments | returns zero-filled DTOs, not empty status maps |
| Bucketed range by day/week/month | returns bucket start dates and zero-filled missing buckets |
| Today endpoints | use clinic-local today, not server-local date |

### 2.3 Unit Tests: Admin and Receptionist Aggregations

File: `src/analytics/analytics.service.spec.ts`

Cover these cases:

| Method | Cases |
|---|---|
| `getTrends` | counts status buckets, includes `total`, excludes rows outside UTC converted range |
| `getStatusDistribution` | returns all statuses with `0` for missing statuses |
| `getDoctorUtilization` | computes booked slots, total slots, holidays, overrides, zero-slot doctors |
| `getAppointmentsByWeekday` | maps clinic-local weekday labels correctly |
| `getCancellationTrends` | separates patient cancellations, staff cancellations, and no-shows |
| `getKpiSummary` | computes rates, active patients, waitlist size, previous-period deltas |
| `getWaitlistSummary` | counts active entries only and groups by doctor |
| `getTodaySummary` | maps `PENDING`, waiting, `IN_PROGRESS`, completed, canceled today |
| `getTodayByDoctor` | returns every doctor with today's counts, including zero-count doctors if active |

### 2.4 Unit Tests: Doctor-Scoped Aggregations

File: `src/analytics/analytics.service.spec.ts`

Cover these cases:

| Method | Cases |
|---|---|
| `getMyStats` | only counts appointments for current doctor's profile |
| `getMyTrends` | returns exactly 7 clinic-local days for selected week |
| `getMyHourlyLoad` | groups by clinic-local hour, not UTC hour |
| `getMyStatusDistribution` | returns status counts scoped to current doctor |
| `getFollowUps` as DOCTOR | returns only patients with completed appointments for that doctor |
| Missing doctor profile | throws `ForbiddenException` |

### 2.5 E2E Tests

File: `test/analytics.e2e-spec.ts`

Seed a deterministic dataset with:

- One admin, one receptionist, two doctors, and at least three patients.
- Clinic timezone set to a non-UTC timezone.
- Working hours, one holiday, and one doctor schedule override.
- Appointments across multiple statuses, weekdays, and hours.
- Active and inactive waitlist entries.

E2E flows:

| Flow | Request | Assertions |
|---|---|---|
| Admin dashboard | `GET /api/analytics/kpi-summary`, `/trends`, `/doctor-utilization` | `200`, wrapped response shape, expected counts |
| Receptionist dashboard | `GET /api/analytics/today-summary`, `/today-by-doctor` | `200`, today's clinic-local data only |
| Doctor dashboard | `GET /api/analytics/my-stats`, `/my-trends`, `/my-hourly-load`, `/my-status-distribution` | `200`, only own doctor's appointments counted |
| Follow-ups | `GET /api/analytics/follow-ups` as admin and doctor | admin sees all eligible patients; doctor sees own eligible patients only |
| RBAC | patient token calls every analytics endpoint | `403` for all analytics endpoints |
| Admin-only endpoint | receptionist calls `/doctor-utilization` | `403` |
| Validation | invalid dates and invalid bucket | `400` with standardized error response |
| Empty range | valid range with no data | `200` with zero counts and continuous empty buckets |

**Run commands**:

```bash
pnpm test -- --testPathPattern=analytics
pnpm test:e2e -- --testPathPattern=analytics
```

---

## Phase 3 - Frontend Integration

### 3.1 Integration Status

The user confirmed that the corresponding frontend pages are not implemented yet. Backend implementation should still publish stable contracts through Swagger and typed DTOs so frontend work can proceed later without re-negotiating endpoint shapes.

Frontend routes expected to consume this module later:

| Route | Spec | Role | Analytics Endpoints |
|---|---|---|---|
| `/admin/dashboard` | [018](../018-admin-dashboard-page/spec.md) | ADMIN | `/kpi-summary`, `/trends`, `/status-distribution`, `/doctor-utilization`, `/appointments-by-weekday`, `/cancellation-trends`, `/follow-ups`, `/waitlist-summary` |
| `/staff/queue` | [014](../014-staff-queue-page/spec.md) | RECEPTIONIST, ADMIN | `/today-summary`, `/today-by-doctor` |
| `/doctor/queue` | [023](../023-doctor-queue-page/spec.md) | DOCTOR | optional `/my-stats` |
| `/doctor/today` | [024](../024-doctor-today-page/spec.md) | DOCTOR | `/my-stats`, `/my-trends`, `/my-hourly-load`, `/my-status-distribution` |

### 3.2 Frontend API Client Contract

When frontend pages are implemented, create API client functions equivalent to:

```typescript
getAnalyticsKpiSummary(params: DateRangeParams): Promise<KpiSummary>;
getAnalyticsTrends(params: BucketedRangeParams): Promise<AppointmentTrendItem[]>;
getAnalyticsStatusDistribution(params: DateRangeParams): Promise<StatusDistribution>;
getDoctorUtilization(params: DateRangeParams): Promise<DoctorUtilizationItem[]>;
getAppointmentsByWeekday(params: DateRangeParams): Promise<AppointmentsByWeekdayItem[]>;
getCancellationTrends(params: CancellationTrendsParams): Promise<CancellationTrendItem[]>;
getFollowUps(params: FollowUpsParams): Promise<Paginated<FollowUpItem>>;
getWaitlistSummary(): Promise<WaitlistSummary>;
getTodaySummary(): Promise<TodaySummary>;
getTodayByDoctor(): Promise<TodayByDoctorItem[]>;
getMyStats(params?: { date?: string }): Promise<DoctorStats>;
getMyTrends(params: { week: string }): Promise<MyTrendItem[]>;
getMyHourlyLoad(params: DateRangeParams): Promise<HourlyLoadItem[]>;
getMyStatusDistribution(params: DateRangeParams): Promise<StatusDistribution>;
```

All functions must unwrap the backend response from `{ statusCode, data }` before returning to components.

### 3.3 Refresh and Cache Expectations

Recommended TanStack Query keys:

| UI Area | Query Key |
|---|---|
| Admin KPI cards | `['analytics', 'kpi-summary', from, to]` |
| Admin trends | `['analytics', 'trends', from, to, bucket]` |
| Admin status distribution | `['analytics', 'status-distribution', from, to]` |
| Admin doctor utilization | `['analytics', 'doctor-utilization', from, to]` |
| Admin follow-ups | `['analytics', 'follow-ups', thresholdDays, page, pageSize]` |
| Staff today summary | `['analytics', 'today-summary']` |
| Staff today by doctor | `['analytics', 'today-by-doctor']` |
| Doctor stats | `['analytics', 'my-stats', date]` |
| Doctor weekly trends | `['analytics', 'my-trends', week]` |

Refresh behavior:

- Staff operational dashboard should refetch `/today-summary` and `/today-by-doctor` every 30 seconds.
- Admin dashboard should refetch KPI and chart endpoints every 60 seconds while visible.
- Doctor daily dashboard should refetch `/my-stats` every 30 seconds while visible.
- Appointment mutations in AppointmentsModule should invalidate relevant analytics query keys after success.

### 3.4 Frontend Error Handling

Frontend pages should handle:

| Backend Response | Frontend Behavior |
|---|---|
| `401` | redirect to login or refresh token flow |
| `403` | render `/403` or permission-denied state |
| `400` validation error | show inline date/filter error and keep previous data |
| `200` with zero counts | render empty chart states, not an error |

### 3.5 Open Frontend Handoff Items

Before frontend implementation starts, confirm:

- Whether `/staff/queue` remains the receptionist analytics landing page or a separate receptionist dashboard route should be added.
- Whether admin dashboard CSV export remains backed by `GET /appointments/export?format=csv` rather than AnalyticsModule.
- Whether frontend chart components expect `noShow` camelCase or raw enum key `NO_SHOW`; this spec uses endpoint-specific camelCase where already defined by BACKEND_PLAN.

---

## Acceptance Criteria

- [ ] All AnalyticsModule files in section 1.1 exist.
- [ ] Every endpoint in section 1.3 is implemented with Swagger decorators.
- [ ] Every route is protected with `JwtAuthGuard` and `RolesGuard`.
- [ ] Query DTOs reject invalid dates, invalid buckets, and oversized pagination.
- [ ] Date range queries use clinic timezone for boundaries and buckets.
- [ ] Doctor endpoints are scoped to the authenticated doctor's own profile.
- [ ] Empty result sets return zero-filled response shapes.
- [ ] Unit tests in sections 2.1 through 2.4 pass.
- [ ] E2E tests in section 2.5 pass.
- [ ] Swagger docs show all AnalyticsModule endpoints under `/api/analytics`.
- [ ] Frontend handoff notes in Phase 3 are revisited when dashboard pages are implemented.
