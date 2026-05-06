# Spec: Admin Dashboard Page

**Route**: `/admin/dashboard`  
**Component**: `AdminDashboardPage`  
**Auth**: ADMIN  
**File**: `frontend/src/features/admin/pages/AdminDashboardPage.tsx`

---

## 1. Purpose

Gives clinic administrators a high-level operational view across appointments, doctors, patients, cancellations, follow-ups, and waitlist demand. The page is for decision-making, not daily front-desk queue control.

---

## 2. Layout

Uses `AdminLayout`. The page has a date-range-controlled analytics surface followed by drill-down tables.

```
┌────────────────────────────────────────────────────────────────────────┐
│ [AdminLayout sidebar/header]                                           │
│                                                                        │
│ Admin Dashboard                          [Date range] [Bucket] [Export]│
│ Clinic performance, utilization, and follow-up demand.                 │
│                                                                        │
│ [Total] [Completed] [Cancellation] [No-show] [Patients] [Waitlist]     │
│                                                                        │
│ ┌───────────────────────────────┐ ┌───────────────────────────────┐   │
│ │ Appointment Trends            │ │ Status Distribution            │   │
│ │ [multi-line chart]            │ │ [donut chart]                  │   │
│ └───────────────────────────────┘ └───────────────────────────────┘   │
│ ┌───────────────────────────────┐ ┌───────────────────────────────┐   │
│ │ Doctor Utilization            │ │ Busiest Days / Cancellations   │   │
│ │ [horizontal bar]              │ │ [tabs: bar / line]             │   │
│ └───────────────────────────────┘ └───────────────────────────────┘   │
│                                                                        │
│ [Appointments] [Follow-ups] [Waitlist]                                 │
│ [table filters]                                                        │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ Date | Doctor | Patient | Status | Booked at | Actions           │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

- Desktop: KPI cards in a 6-column grid, charts in a 2-column grid, tables full width.
- Tablet: KPI cards wrap to 3 columns, charts stack into a single column when needed.
- Mobile: KPI cards become horizontally scrollable cards, charts stack, tables switch to stacked cards.
- Use shared `KpiCard`, `Sparkline`, `DateRangePicker`, `DataTable`, `ExportCsvButton`, `StatusBadge`, and Recharts wrappers.

---

## 3. Date Range and URL State

Default date range is current calendar month in clinic timezone.

| Param | Purpose | Default |
|---|---|---|
| `from` | Analytics/table start date | First day of current month |
| `to` | Analytics/table end date | Last day of current month |
| `bucket` | Trend grouping | `day` for <= 45 days, `week` otherwise |
| `tab` | Active table | `appointments` |
| `doctorId` | Table/chart drill-down doctor filter | none |
| `status` | Table/chart drill-down status filter | none |
| `patientName` | Appointment table patient search | none |
| `thresholdDays` | Follow-up threshold | `90` |
| `page` | Active table page | `1` |
| `sortBy` | Active table sort field | table-specific |
| `sortDir` | Sort direction | `asc` or `desc` |

All filter, tab, pagination, and sorting state must survive refresh/back navigation by syncing with query params.

---

## 4. KPI Cards

Data source: `GET /analytics/kpi-summary?from=&to=`.

| Card | Field | Display | Notes |
|---|---|---|---|
| Total Appointments | `totalAppointments` | integer | Excludes canceled if backend follows plan calculation |
| Completed | `completed` | integer | Completed appointments in range |
| Cancellation Rate | `cancellationRate` | percent | `0.12` displays as `12%` |
| No-Show Rate | `noShowRate` | percent | Red warning palette |
| Active Patients | `activePatients` | integer | Unique patients with recent activity |
| Waitlist Size | `waitlistSize` | integer | Current active waitlist entries |

Each card shows value, optional delta vs previous equal period, and optional sparkline. Backend currently returns `deltaTotalPct` and `deltaCompletedPct`; cards without delta show `Current period` instead of an empty delta.

---

## 5. Charts

### `AppointmentTrendsChart`

Data source: `GET /analytics/trends?from=&to=&bucket=`.

Series:

| Series | Color source |
|---|---|
| `confirmed` | `StatusBadge.CONFIRMED` palette |
| `completed` | `StatusBadge.COMPLETED` palette |
| `canceled` | `StatusBadge.CANCELED` palette |
| `noShow` | `StatusBadge.NO_SHOW` palette |

Clicking a series point sets the appointment table date/status filter for that point.

### `StatusDistributionChart`

Data source: `GET /analytics/status-distribution?from=&to=`.

Renders a donut chart for `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`, and `NO_SHOW`. Clicking a slice sets `status` and switches to the appointments table.

### `DoctorUtilizationChart`

Data source: `GET /analytics/doctor-utilization?from=&to=`.

Renders a horizontal bar chart sorted by `utilizationPct` descending. Tooltip shows `bookedSlots / totalSlots`. Clicking a bar sets `doctorId` and switches to the appointments table.

### `BusiestDaysChart`

Data source: `GET /analytics/appointments-by-weekday?from=&to=`.

Renders appointments grouped by weekday. Labels localize and respect RTL.

### `CancellationTrendChart`

Data source: `GET /analytics/cancellation-trends?from=&to=&bucket=`.

Renders a line chart for `canceledByPatient`, `canceledByStaff`, and `noShow`.

---

## 6. Data Models

```typescript
type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW';

interface AdminKpiSummaryDTO {
  totalAppointments: number;
  completed: number;
  cancellationRate: number;
  noShowRate: number;
  activePatients: number;
  waitlistSize: number;
  deltaTotalPct?: number;
  deltaCompletedPct?: number;
}

interface AppointmentTrendPointDTO {
  date: string;
  total: number;
  confirmed: number;
  completed: number;
  canceled: number;
  noShow: number;
}

interface DoctorUtilizationDTO {
  doctorId: string;
  doctorName: string;
  bookedSlots: number;
  totalSlots: number;
  utilizationPct: number;
}

interface AdminAppointmentRowDTO {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  createdAt: string;
  patient: { id: string; firstName: string; lastName: string };
  doctor: { id: string; firstName: string; lastName: string };
}

interface FollowUpRowDTO {
  patientId: string;
  patientName: string;
  lastAppointmentDate: string;
  daysSince: number;
  hasUpcoming: boolean;
}
```

---

## 7. Tables

### Appointments Table

Data source: `GET /appointments`.

| Column | Sortable | Filterable | Notes |
|---|---|---|---|
| Date & Time | Yes | Date range | Clinic timezone |
| Doctor | Yes | Multi-select | `Dr. First Last` |
| Patient name | No | Text search | Patient full name |
| Status | Yes | Multi-select | Shared `StatusBadge` |
| Booked at | Yes | No | Localized date/time |
| Actions | No | No | Cancel if admin cancellation is allowed by endpoint |

Pagination: 20 rows per page. Export uses `GET /appointments/export?format=csv` with current filters.

### Follow-ups Table

Data source: `GET /analytics/follow-ups?thresholdDays=&page=&pageSize=`.

| Column | Notes |
|---|---|
| Patient name | Full name |
| Last appointment | Most recent completed appointment |
| Days since | Computed by backend |
| Upcoming | Yes/No badge from `hasUpcoming` |
| Action | Link to `/staff/walkin?patientId=<id>` |

### Waitlist Table

Data source: `GET /waitlist`.

| Column | Notes |
|---|---|
| Position | Position in doctor's waitlist |
| Patient name | Full name |
| Doctor | Doctor name |
| Available from/until | `HH:mm - HH:mm` or `Any time` |
| On waitlist since | `createdAt` localized |
| Action | Remove entry if admin endpoint allows staff removal |

---

## 8. Hooks and API Layer

```typescript
// features/admin/api/admin-api.ts
export async function getKpiSummary(params: DateRangeParams): Promise<AdminKpiSummaryDTO>;
export async function getTrends(params: DateRangeParams & { bucket: 'day' | 'week' | 'month' }): Promise<AppointmentTrendPointDTO[]>;
export async function getStatusDistribution(params: DateRangeParams): Promise<Record<AppointmentStatus, number>>;
export async function getDoctorUtilization(params: DateRangeParams): Promise<DoctorUtilizationDTO[]>;
export async function getAppointmentsByWeekday(params: DateRangeParams): Promise<Array<{ dayOfWeek: number; label: string; count: number }>>;
export async function getCancellationTrends(params: DateRangeParams & { bucket: 'day' | 'week' }): Promise<Array<{ date: string; canceledByPatient: number; canceledByStaff: number; noShow: number }>>;
export async function getFollowUps(params: { thresholdDays?: number; page?: number; pageSize?: number }): Promise<PaginatedResponse<FollowUpRowDTO>>;
export async function getWaitlistSummary(): Promise<{ totalActive: number; byDoctor: Array<{ doctorId: string; doctorName: string; count: number }> }>;
```

```typescript
export function useKpiSummary(params: DateRangeParams) {
  return useQuery({
    queryKey: ['analytics', 'kpi-summary', params],
    queryFn: () => getKpiSummary(params),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
```

Use the same stale time/refetch interval for all analytics queries on this page.

---

## 9. Loading and Error States

| State | UI |
|---|---|
| Initial page load | KPI skeleton cards, chart skeletons, table skeleton rows |
| One chart fails | Error alert inside only that chart card with Retry |
| Table query fails | Table-level error row with Retry |
| Empty analytics | Show zero-state charts, not broken axes |
| Export pending | Disable export and show spinner |
| `403` | Route redirects to `/403` via `ProtectedRoute` |

---

## 10. Routing

```tsx
{
  path: '/admin/dashboard',
  element: (
    <ProtectedRoute roles={['ADMIN']}>
      <AdminLayout>
        <AdminDashboardPage />
      </AdminLayout>
    </ProtectedRoute>
  ),
}
```

---

## 11. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "adminDashboard": {
    "title": "Admin Dashboard",
    "subtitle": "Clinic performance, utilization, and follow-up demand.",
    "dateRange": "Date range",
    "bucket": "Bucket",
    "export": "Export",
    "totalAppointments": "Total Appointments",
    "completed": "Completed",
    "cancellationRate": "Cancellation Rate",
    "noShowRate": "No-Show Rate",
    "activePatients": "Active Patients",
    "waitlistSize": "Waitlist Size",
    "appointmentTrends": "Appointment Trends",
    "statusDistribution": "Status Distribution",
    "doctorUtilization": "Doctor Utilization",
    "busiestDays": "Busiest Days of Week",
    "cancellationTrend": "Cancellation Trend",
    "appointments": "Appointments",
    "followUps": "Follow-ups",
    "waitlist": "Waitlist",
    "bookForPatient": "Book for Patient",
    "noData": "No data for the selected period."
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "adminDashboard": {
    "title": "لوحة تحكم المدير",
    "subtitle": "أداء العيادة، استخدام الأطباء، وطلبات المتابعة.",
    "dateRange": "نطاق التاريخ",
    "bucket": "التجميع",
    "export": "تصدير",
    "totalAppointments": "إجمالي المواعيد",
    "completed": "المكتملة",
    "cancellationRate": "معدل الإلغاء",
    "noShowRate": "معدل عدم الحضور",
    "activePatients": "المرضى النشطون",
    "waitlistSize": "حجم قائمة الانتظار",
    "appointmentTrends": "اتجاهات المواعيد",
    "statusDistribution": "توزيع الحالات",
    "doctorUtilization": "استخدام الأطباء",
    "busiestDays": "أكثر أيام الأسبوع ازدحاماً",
    "cancellationTrend": "اتجاه الإلغاء",
    "appointments": "المواعيد",
    "followUps": "المتابعات",
    "waitlist": "قائمة الانتظار",
    "bookForPatient": "حجز للمريض",
    "noData": "لا توجد بيانات للفترة المحددة."
  }
}
```

---

## 12. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/analytics/kpi-summary` | KPI cards |
| GET | `/analytics/trends` | Appointment trends chart |
| GET | `/analytics/status-distribution` | Status donut |
| GET | `/analytics/doctor-utilization` | Doctor utilization chart |
| GET | `/analytics/appointments-by-weekday` | Busiest days chart |
| GET | `/analytics/cancellation-trends` | Cancellation/no-show chart |
| GET | `/analytics/follow-ups` | Follow-ups table |
| GET | `/analytics/waitlist-summary` | Waitlist summary |
| GET | `/appointments` | Appointments table |
| GET | `/appointments/export?format=csv` | Appointment CSV export |
| GET | `/waitlist` | Waitlist table |

---

## 13. Accessibility

- Chart cards include table-equivalent summaries for screen readers.
- Chart click filters are also available through visible table filters.
- KPI deltas do not rely on color alone; include arrow text and percent.
- Date range fields have labels and announce validation errors.
- Tabs expose `aria-selected` and are keyboard navigable.
- Export success/failure uses accessible toast/status messaging.

---

## 14. Acceptance Criteria

- [ ] Admin can load `/admin/dashboard`; non-admin roles redirect to `/403`.
- [ ] Date range defaults to the current clinic month and syncs to query params.
- [ ] Six KPI cards render from `GET /analytics/kpi-summary` and refresh every 60 seconds.
- [ ] All five chart areas render with loading, empty, and error states.
- [ ] Clicking chart segments/bars applies table filters without full-page reload.
- [ ] Appointments, follow-ups, and waitlist tabs preserve filters and pagination in URL state.
- [ ] Appointment CSV export includes the current appointment filters.
- [ ] Mobile layout has no horizontal page scroll.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds once backend analytics contracts exist.
