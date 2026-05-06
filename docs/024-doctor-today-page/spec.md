# Spec: Doctor Today Page

**Route**: `/doctor/today`  
**Component**: `DoctorTodayPage`  
**Auth**: DOCTOR  
**File**: `frontend/src/features/queue/pages/DoctorTodayPage.tsx`

---

## 1. Purpose

Gives an authenticated doctor a dashboard for their own daily and weekly schedule. The page combines today's operational schedule, doctor-specific KPI cards, lightweight charts, and editable appointment notes so the doctor can understand workload, gaps, completed work, and no-shows.

---

## 2. Layout

Uses `DoctorLayout`. The primary view is today's schedule table with KPI cards and charts above it. A secondary tab shows this week's appointments.

```
┌────────────────────────────────────────────────────────────────────────┐
│ [DoctorLayout sidebar/header]                                          │
│                                                                        │
│ Today's Schedule                         [Date] [Refresh] [My Queue]   │
│ Review your day, gaps, and appointment progress.                       │
│                                                                        │
│ [Today's Total] [Completed] [Remaining] [In Session] [No-Shows]        │
│                                                                        │
│ ┌───────────────────────────────┐ ┌───────────────────────────────┐   │
│ │ My Week at a Glance           │ │ My Status Distribution         │   │
│ │ [bar chart]                   │ │ [donut chart]                  │   │
│ └───────────────────────────────┘ └───────────────────────────────┘   │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ My Hourly Load                                                    │   │
│ │ [bar chart]                                                       │   │
│ └──────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│ [Today] [This Week] [Status filter]                                    │
│ ┌──────────────────────────────────────────────────────────────────┐   │
│ │ Time | Patient # | Status | Duration | Notes | Actions           │   │
│ └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

- Desktop: KPI cards in a 5-column grid, charts in a 2-column grid with hourly load full width, table full width.
- Tablet: KPI cards wrap; all charts stack when needed.
- Mobile: KPI cards scroll horizontally; charts stack; tables render as stacked appointment cards.
- Use shared `KpiCard`, `DataTable`, `StatusBadge`, `DonutChart`, `BarChart`, and shadcn primitives.

---

## 3. Date, Tabs, and URL State

Default date is today in the clinic timezone.

| Param | Purpose | Default |
|---|---|---|
| `date` | Selected schedule date for the Today tab | today's clinic date |
| `week` | ISO date inside selected week for weekly chart/table | current clinic week |
| `tab` | Active table tab | `today` |
| `status` | Comma-separated appointment statuses | none |
| `page` | Active table page | `1` |
| `sortBy` | Active table sort field | `startsAt` |
| `sortDir` | Sort direction | `asc` |

All date, tab, filter, pagination, and sorting state must survive refresh/back navigation by syncing with query params.

---

## 4. KPI Cards

Data source: `GET /analytics/my-stats?date=`.

| Card | Field | Metric |
|---|---|---|
| Today's Total | `todayTotal` | All of my appointments on selected date |
| Completed | `completed` | `status = COMPLETED` on selected date |
| Remaining | `remaining` | `CONFIRMED` and `startsAt > now` on selected date |
| In Session | `inSession` | `status = IN_PROGRESS` |
| No-Shows | `noShows` | `status = NO_SHOW` on selected date |

Each card uses shared `KpiCard`. If selected date is not today, replace live wording with `Selected date` and compute remaining relative to the date instead of current time if backend supports it.

---

## 5. Charts

### `MyWeekAtGlanceChart`

Data source: `GET /analytics/my-trends?week=`.

Renders appointment count per day for the current selected week. Bars use the color of the dominant appointment status for that day, with tooltip counts by status.

| Field | Notes |
|---|---|
| `date` | ISO date |
| `total` | Total appointments for doctor that day |
| `dominantStatus` | Status with highest count |
| `completed`, `confirmed`, `canceled`, `noShow` | Tooltip breakdown |

Clicking a bar sets `date` to that day and switches to the Today tab.

### `MyStatusDistributionChart`

Data source: `GET /analytics/my-status-distribution?from=&to=` for the current month.

Renders donut slices for `PENDING`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELED`, and `NO_SHOW`. Clicking a slice sets `status` filter.

### `MyHourlyLoadChart`

Data source: `GET /analytics/my-hourly-load?from=&to=` for the current month.

Renders appointments grouped by hour of day. Tooltip shows count and percentage of month total. The chart helps identify peak clinical hours and gaps.

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

interface DoctorStatsDTO {
  todayTotal: number;
  completed: number;
  remaining: number;
  inSession: number;
  noShows: number;
}

interface DoctorTrendPointDTO {
  date: string;
  total: number;
  dominantStatus: AppointmentStatus | null;
  confirmed: number;
  completed: number;
  canceled: number;
  noShow: number;
}

interface DoctorStatusDistributionDTO {
  status: AppointmentStatus;
  count: number;
}

interface DoctorHourlyLoadDTO {
  hour: number;
  count: number;
  percentage: number;
}

interface DoctorScheduleAppointmentDTO {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  patientSequence: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
```

The UI must not depend on patient name being present. If a shared backend DTO includes patient data, render `Patient #{{patientSequence}}` in doctor tables to preserve the privacy rule from the plan.

---

## 7. Tables

### Today's Schedule Table

Data source: `GET /appointments` filtered by authenticated doctor and selected `date`.

Rows are sorted by `startsAt` ascending. The currently `IN_PROGRESS` row is highlighted with a green left border.

| Column | Sortable | Notes |
|---|---|---|
| Time | Yes | Clinic timezone, localized `HH:mm` range |
| Patient # | No | Sequential position number, no name |
| Status | Yes | Shared `StatusBadge` |
| Duration | No | `endsAt - startsAt` in minutes |
| Notes | No | Truncated; editable inline or via dialog |
| Actions | No | Confirm, start, complete, no-show when valid |

Gaps should be shown as subtle spacer rows when there is at least one free slot between appointments and backend provides slot duration or clinic schedule config.

### This Week's Appointments Table

Data source: `GET /appointments` filtered to selected week and authenticated doctor.

| Column | Sortable | Notes |
|---|---|---|
| Date | Yes | Day label, for example `Mon 5 May` |
| Time | Yes | Clinic timezone, localized `HH:mm` range |
| Patient # | No | Sequential position within that day |
| Status | Yes | Shared `StatusBadge` |
| Notes | No | Editable inline or via dialog |

Pagination defaults to 20 rows per page. Weekly table should preserve `status`, `page`, and sorting query params.

---

## 8. Components

### `DoctorTodayHeader`

Renders title, subtitle, date picker, manual refresh, and link button to `/doctor/queue`.

### `DoctorKpiCards`

Renders the five doctor stats cards from `DoctorStatsDTO`.

### `MyWeekAtGlanceChart`

Recharts bar chart for selected week.

### `MyStatusDistributionChart`

Shared donut chart wrapper for monthly status distribution.

### `MyHourlyLoadChart`

Shared vertical bar chart wrapper for monthly hourly load.

### `DoctorScheduleTabs`

Controls Today and This Week table views and keeps active tab in URL query params.

### `DoctorScheduleTable`

Shared table/card renderer for today's and weekly appointment rows.

### `AppointmentNotesEditor`

Inline or dialog-based notes editor reused with `DoctorQueuePage`.

### `DoctorScheduleActions`

Renders the same doctor transition map as `DoctorQueuePage` so schedule and queue behavior stays consistent.

---

## 9. Hooks and API Layer

```typescript
// features/queue/api/queue-api.ts
export async function getDoctorSchedule(params: {
  from: string;
  to: string;
  status?: AppointmentStatus[];
  page?: number;
  pageSize?: number;
  sortBy?: 'startsAt' | 'status';
  sortDir?: 'asc' | 'desc';
}): Promise<PaginatedResponse<DoctorScheduleAppointmentDTO>>;

export async function getMyStats(date: string): Promise<DoctorStatsDTO>;
export async function getMyTrends(week: string): Promise<DoctorTrendPointDTO[]>;
export async function getMyHourlyLoad(params: { from: string; to: string }): Promise<DoctorHourlyLoadDTO[]>;
export async function getMyStatusDistribution(params: { from: string; to: string }): Promise<DoctorStatusDistributionDTO[]>;
```

```typescript
export function useDoctorTodaySchedule(filters: DoctorScheduleFilters) {
  return useQuery({
    queryKey: ['appointments', 'doctor-today', filters],
    queryFn: () => getDoctorSchedule(filters),
    staleTime: 30_000,
    refetchInterval: filters.isToday ? 60_000 : false,
  });
}

export function useDoctorWeekAppointments(filters: DoctorScheduleFilters) {
  return useQuery({
    queryKey: ['appointments', 'doctor-week', filters],
    queryFn: () => getDoctorSchedule(filters),
    staleTime: 60_000,
  });
}

export function useMyStats(date: string) {
  return useQuery({
    queryKey: ['analytics', 'my-stats', { date }],
    queryFn: () => getMyStats(date),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
```

All mutation hooks for status and notes should be shared with `DoctorQueuePage` and invalidate:

- `['appointments', 'doctor-queue']`
- `['appointments', 'doctor-today']`
- `['appointments', 'doctor-week']`
- `['analytics', 'my-stats']`
- `['analytics', 'my-trends']`
- `['analytics', 'my-hourly-load']`
- `['analytics', 'my-status-distribution']`

---

## 10. Socket.IO Integration

Subscribe to the authenticated doctor's queue room when the selected date is today.

```typescript
queueSocket.emit('queue.subscribe', { scope: 'doctor', doctorId, date: selectedDate });
queueSocket.on('queue.updated', handleQueueUpdated);
```

On `queue.updated` for this doctor and date:

- Invalidate today's schedule query.
- Invalidate doctor queue query.
- Invalidate doctor stats and charts.
- Show `Updated now` in the header.

For non-today dates, do not subscribe to live queue updates; use normal query refetch only.

---

## 11. Error Handling

| Scenario | UI |
|---|---|
| Stats query fails | Show compact warning in KPI row; keep schedule visible |
| Chart query fails | Show per-chart error card with Retry |
| Schedule query fails | Error card with Retry button |
| Status mutation fails | Toast server message and refetch schedule |
| Notes mutation fails | Preserve draft, show inline error |
| Unauthorized role | Protected route redirects to `/403` |
| Socket disconnects | Show `Reconnecting...` badge for today's date only |

---

## 12. Loading States

- First load: KPI skeletons, chart skeletons, and table skeleton rows.
- Date change: keep previous data while new date loads when possible.
- Tab switch: table skeleton only if cache is empty.
- Chart refetch: show subtle loading overlay, not full page loading.
- Row mutation: disable only the affected row's actions.

---

## 13. Routing

```tsx
{
  path: '/doctor/today',
  element: (
    <ProtectedRoute roles={['DOCTOR']}>
      <DoctorLayout>
        <DoctorTodayPage />
      </DoctorLayout>
    </ProtectedRoute>
  ),
}
```

---

## 14. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "doctorToday": {
    "title": "Today's Schedule",
    "subtitle": "Review your day, gaps, and appointment progress.",
    "selectedDate": "Selected date",
    "refresh": "Refresh",
    "myQueue": "My Queue",
    "patientNumber": "Patient #{{number}}",
    "kpis": {
      "todayTotal": "Today's Total",
      "completed": "Completed",
      "remaining": "Remaining",
      "inSession": "In Session",
      "noShows": "No-Shows"
    },
    "charts": {
      "weekAtGlance": "My Week at a Glance",
      "statusDistribution": "My Status Distribution",
      "hourlyLoad": "My Hourly Load"
    },
    "tabs": {
      "today": "Today",
      "thisWeek": "This Week"
    },
    "table": {
      "time": "Time",
      "date": "Date",
      "patient": "Patient #",
      "status": "Status",
      "duration": "Duration",
      "notes": "Notes",
      "actions": "Actions",
      "gap": "Open gap: {{duration}} minutes"
    },
    "empty": "No appointments for this date.",
    "updatedNow": "Updated now"
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "doctorToday": {
    "title": "جدول اليوم",
    "subtitle": "راجع يومك والفجوات وتقدم المواعيد.",
    "selectedDate": "التاريخ المحدد",
    "refresh": "تحديث",
    "myQueue": "قائمتي",
    "patientNumber": "المريض رقم {{number}}",
    "kpis": {
      "todayTotal": "إجمالي اليوم",
      "completed": "مكتملة",
      "remaining": "متبقية",
      "inSession": "قيد الجلسة",
      "noShows": "عدم حضور"
    },
    "charts": {
      "weekAtGlance": "أسبوعي بنظرة عامة",
      "statusDistribution": "توزيع حالاتي",
      "hourlyLoad": "الحمل حسب الساعة"
    },
    "tabs": {
      "today": "اليوم",
      "thisWeek": "هذا الأسبوع"
    },
    "table": {
      "time": "الوقت",
      "date": "التاريخ",
      "patient": "رقم المريض",
      "status": "الحالة",
      "duration": "المدة",
      "notes": "الملاحظات",
      "actions": "الإجراءات",
      "gap": "فجوة متاحة: {{duration}} دقيقة"
    },
    "empty": "لا توجد مواعيد لهذا التاريخ.",
    "updatedNow": "تم التحديث الآن"
  }
}
```

---

## 15. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/appointments` | Doctor schedule table for selected date/week with server-side doctor scoping |
| PATCH | `/appointments/:id/status` | Confirm/start/complete/no-show from schedule rows |
| PATCH | `/appointments/:id` | Save appointment notes when backend accepts notes on appointment update |
| GET | `/analytics/my-stats` | Doctor KPI cards |
| GET | `/analytics/my-trends` | Week-at-a-glance chart |
| GET | `/analytics/my-status-distribution` | Monthly status donut chart |
| GET | `/analytics/my-hourly-load` | Monthly hourly load chart |
| Socket.IO | `/queue` | Live updates for today's schedule |

Backend must enforce doctor ownership for appointment and analytics endpoints.

---

## 16. Accessibility

- Chart interactions must have equivalent filters or table links.
- Data table headers must include proper sorting button labels.
- Status is expressed as visible text, not color only.
- In-progress highlight cannot rely on color alone; include an `In Session` badge.
- Live update indicator uses `aria-live="polite"`.
- Notes editor must be keyboard accessible and preserve focus after save/cancel.

---

## 17. Acceptance Criteria

- [ ] Doctor can load `/doctor/today`; non-doctor roles redirect to `/403`.
- [ ] KPI cards render from `GET /analytics/my-stats` for selected date.
- [ ] Week, status distribution, and hourly load charts render from doctor analytics endpoints.
- [ ] Today's schedule loads from `GET /appointments` scoped to the authenticated doctor.
- [ ] This Week tab loads the selected week's appointments and preserves filters in URL params.
- [ ] Patient identity is displayed as patient number/position, not full name/email/phone.
- [ ] Current `IN_PROGRESS` row is visually and textually highlighted.
- [ ] Valid status transition buttons and notes editor reuse doctor queue mutation behavior.
- [ ] Socket.IO updates refresh today's schedule and doctor stats without full-page reload.
- [ ] Mobile layout remains usable with stacked cards and accessible actions.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
