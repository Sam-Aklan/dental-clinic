# Spec: Staff Queue Page

**Route**: `/staff/queue`  
**Component**: `StaffQueuePage`  
**Auth**: RECEPTIONIST and ADMIN  
**File**: `frontend/src/features/queue/pages/StaffQueuePage.tsx`

---

## 1. Purpose

Gives receptionist staff a live, multi-doctor view of today's clinic flow. The page is optimized for front-desk decisions: who is waiting, which doctor is in session, what needs confirmation, and which appointments require immediate status action.

---

## 2. Layout

Uses `ReceptionistLayout`. The top of the page is an operational dashboard with KPI cards and live charts; the lower area is a queue board grouped by doctor with filters.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [ReceptionistLayout sidebar/header]                                  │
│                                                                      │
│ Staff Queue                                      Live · Updated 10:32 │
│ Monitor today's patient flow across all doctors.                     │
│                                                                      │
│ [Total] [In Session] [Waiting] [Completed] [Canceled] [Pending]      │
│                                                                      │
│ ┌───────────────────────────────┐ ┌───────────────────────────────┐ │
│ │ Today by Doctor               │ │ Today's Status Overview        │ │
│ │ [grouped bar chart]           │ │ [donut chart]                  │ │
│ └───────────────────────────────┘ └───────────────────────────────┘ │
│                                                                      │
│ [Doctor filter] [Status filter] [Search patient] [Refresh]           │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ Dr. Ahmad Al-Rashid                                            │   │
│ │ #1 10:00  Patient Name  CONFIRMED       [Start] [No-show]      │   │
│ │ #2 10:30  Patient Name  IN_PROGRESS     [Complete]             │   │
│ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

- Desktop: two-column chart row; queue groups fill available width.
- Tablet/mobile: KPI cards scroll horizontally, charts stack, queue cards become single-column.
- Use shadcn `Card`, `Button`, `Badge`, `Select`, `Input`, `Skeleton`, `Alert`, `Dialog`, and `Tooltip` primitives.

---

## 3. Operational Rules

The queue is scoped to clinic today in the configured clinic timezone.

| Rule | Behavior |
|---|---|
| Waiting definition | `CONFIRMED` appointment with `startsAt <= now + 30 minutes` |
| Display order | Group by doctor name, then sort rows by `startsAt` ascending |
| Privacy | Receptionist view may show patient name and phone; public lobby must not reuse this component with names |
| Live freshness | Refetch KPI data every 30 seconds and react to Socket.IO `queue.updated` events |
| Status updates | Update row optimistically only after server accepts transition; otherwise roll back/refetch |
| No-show | Available for `PENDING` or `CONFIRMED` appointments that are at or after start time |

---

## 4. KPI Cards

Data source: `GET /analytics/today-summary`.

| Card | Field | Notes |
|---|---|---|
| Today's Total | `total` | All appointments today across doctors |
| In Session | `inProgress` | Current `IN_PROGRESS` rows |
| Waiting | `waiting` | Confirmed rows due now/soon |
| Completed Today | `completed` | Completed count today |
| Cancellations Today | `canceledToday` | Canceled today |
| Pending Confirmation | `pendingConfirmation` | `PENDING` rows needing staff review |

KPI cards use shared `KpiCard`. Delta/sparkline is optional for this page; if omitted, show a small `Live` badge instead of a delta.

---

## 5. Charts

### `TodayByDoctorChart`

Data source: `GET /analytics/today-by-doctor`.

| Series | Color source |
|---|---|
| `confirmed` | Same palette as `StatusBadge.CONFIRMED` |
| `inProgress` | Same palette as `StatusBadge.IN_PROGRESS` |
| `completed` | Same palette as `StatusBadge.COMPLETED` |
| `canceled` | Same palette as `StatusBadge.CANCELED` |

Clicking a doctor bar sets `doctorId` filter in URL query params and filters the queue board.

### `TodayStatusOverviewChart`

Use a donut chart derived from today's appointment list or from analytics status distribution when available. Clicking a status slice sets the `status` URL filter.

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

interface StaffQueueAppointmentDTO {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  bookedByRole: 'PATIENT' | 'RECEPTIONIST' | 'ADMIN';
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
}

interface TodaySummaryDTO {
  total: number;
  inProgress: number;
  waiting: number;
  completed: number;
  canceledToday: number;
  pendingConfirmation: number;
}

interface TodayByDoctorDTO {
  doctorId: string;
  doctorName: string;
  confirmed: number;
  inProgress: number;
  completed: number;
  canceled: number;
}
```

---

## 7. Filters and URL State

Supported query params:

| Param | Purpose |
|---|---|
| `doctorId` | Comma-separated doctor IDs |
| `status` | Comma-separated statuses |
| `q` | Patient name/phone search |

Filter changes update URL query params with `replace` while typing and `push` when selecting dropdown values. Preserve filters on refresh/back navigation.

---

## 8. Components

### `QueueKpiBanner`

Renders six `KpiCard` components from `TodaySummaryDTO`.

### `StaffQueueFilters`

Contains doctor multi-select, status multi-select, patient search, and manual refresh.

### `DoctorQueueGroup`

Groups queue rows by doctor and shows a doctor header with counts by status.

### `QueueItem`

Displays a single appointment row/card.

| Element | Behavior |
|---|---|
| Time | Localized clinic-time `HH:mm` range |
| Patient | Full name plus phone when present |
| Status | Shared `StatusBadge` |
| Position | Sequential number within doctor group |
| Actions | `Confirm`, `Start`, `Complete`, `Mark No-Show`, `Cancel` when valid |

### `StatusTransitionButtons`

Uses a centralized transition map so invalid actions never render.

```typescript
const staffTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELED'],
  CONFIRMED: ['IN_PROGRESS', 'NO_SHOW', 'CANCELED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELED: [],
  NO_SHOW: [],
};
```

---

## 9. Hooks and API Layer

```typescript
// features/queue/api/queue-api.ts
export async function getStaffQueue(params: {
  date: string;
  doctorId?: string[];
  status?: AppointmentStatus[];
  patientName?: string;
}): Promise<StaffQueueAppointmentDTO[]>;

export async function getTodaySummary(): Promise<TodaySummaryDTO>;
export async function getTodayByDoctor(): Promise<TodayByDoctorDTO[]>;
export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<StaffQueueAppointmentDTO>;
export async function cancelStaffAppointment(id: string, reason?: string): Promise<void>;
```

```typescript
export function useStaffQueue(filters: StaffQueueFilters) {
  return useQuery({
    queryKey: ['appointments', 'staff-queue', filters],
    queryFn: () => getStaffQueue(filters),
    refetchInterval: 60_000,
  });
}

export function useTodaySummary() {
  return useQuery({
    queryKey: ['analytics', 'today-summary'],
    queryFn: getTodaySummary,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
```

---

## 10. Socket.IO Integration

Subscribe to the clinic-wide staff queue room when the page mounts.

```typescript
queueSocket.emit('queue.subscribe', { scope: 'staff', date: today });
queueSocket.on('queue.updated', handleQueueUpdated);
```

On `queue.updated`:

- Invalidate `['appointments', 'staff-queue']`.
- Invalidate `['analytics', 'today-summary']`.
- Invalidate `['analytics', 'today-by-doctor']`.
- Show a subtle `Updated now` indicator; do not show a toast for every live update.

---

## 11. Error Handling

| Scenario | UI |
|---|---|
| Summary query fails | Keep queue visible; show compact warning in KPI row |
| Queue query fails | Error card with Retry button |
| Status transition `400` | Toast server message and refetch row |
| Status transition `403` | Toast `You do not have permission to update this appointment.` |
| Socket disconnects | Show `Reconnecting...` badge; continue polling |
| Cancel requires reason | Open cancel dialog with reason textarea |

---

## 12. Loading States

- First load: KPI skeletons, chart skeletons, and 3 queue group skeletons.
- Filter change: keep previous queue data while refetching when possible.
- Status mutation: disable only the affected row's action buttons.
- Socket reconnect: badge in page header; no full-page loading state.

---

## 13. Routing

```tsx
{
  path: '/staff/queue',
  element: (
    <ProtectedRoute roles={['RECEPTIONIST', 'ADMIN']}>
      <ReceptionistLayout>
        <StaffQueuePage />
      </ReceptionistLayout>
    </ProtectedRoute>
  ),
}
```

---

## 14. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "staffQueue": {
    "title": "Staff Queue",
    "subtitle": "Monitor today's patient flow across all doctors.",
    "live": "Live",
    "updatedAt": "Updated {{time}}",
    "reconnecting": "Reconnecting...",
    "kpis": {
      "todayTotal": "Today's Total",
      "inSession": "In Session",
      "waiting": "Waiting",
      "completedToday": "Completed Today",
      "cancellationsToday": "Cancellations Today",
      "pendingConfirmation": "Pending Confirmation"
    },
    "charts": {
      "todayByDoctor": "Today by Doctor",
      "statusOverview": "Today's Status Overview"
    },
    "filters": {
      "doctor": "Doctor",
      "status": "Status",
      "searchPatient": "Search patient"
    },
    "actions": {
      "confirm": "Confirm",
      "start": "Start",
      "complete": "Complete",
      "markNoShow": "Mark No-Show",
      "cancel": "Cancel"
    },
    "empty": "No appointments match these filters.",
    "updateSuccess": "Appointment updated.",
    "noPermission": "You do not have permission to update this appointment."
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "staffQueue": {
    "title": "قائمة الاستقبال",
    "subtitle": "راقب حركة المرضى اليوم لجميع الأطباء.",
    "live": "مباشر",
    "updatedAt": "تم التحديث {{time}}",
    "reconnecting": "جار إعادة الاتصال...",
    "kpis": {
      "todayTotal": "إجمالي اليوم",
      "inSession": "قيد الجلسة",
      "waiting": "في الانتظار",
      "completedToday": "مكتملة اليوم",
      "cancellationsToday": "إلغاءات اليوم",
      "pendingConfirmation": "بانتظار التأكيد"
    },
    "charts": {
      "todayByDoctor": "اليوم حسب الطبيب",
      "statusOverview": "نظرة عامة على حالات اليوم"
    },
    "filters": {
      "doctor": "الطبيب",
      "status": "الحالة",
      "searchPatient": "بحث عن مريض"
    },
    "actions": {
      "confirm": "تأكيد",
      "start": "بدء",
      "complete": "إكمال",
      "markNoShow": "تسجيل عدم حضور",
      "cancel": "إلغاء"
    },
    "empty": "لا توجد مواعيد تطابق هذه المرشحات.",
    "updateSuccess": "تم تحديث الموعد.",
    "noPermission": "ليس لديك صلاحية لتحديث هذا الموعد."
  }
}
```

---

## 15. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/analytics/today-summary` | KPI cards |
| GET | `/analytics/today-by-doctor` | Grouped doctor chart |
| GET | `/appointments` | Today's queue list with filters |
| PATCH | `/appointments/:id/status` | Confirm/start/complete/no-show |
| DELETE | `/appointments/:id` | Staff cancellation override |
| GET | `/doctors` | Doctor filter options |
| Socket.IO | `/queue` | Live queue updates |

---

## 16. Accessibility

- KPI values include text labels, not color-only meaning.
- Chart clicks must have equivalent filter controls.
- Queue actions are keyboard reachable and have loading labels.
- Status changes use confirmation dialogs for destructive actions only: cancel and no-show.
- Live update indicator uses `aria-live="polite"`.

---

## 17. Acceptance Criteria

- [ ] Receptionist/admin can load `/staff/queue`; other roles redirect to `/403`.
- [ ] KPI cards render from `GET /analytics/today-summary` and refresh every 30 seconds.
- [ ] Today by Doctor chart renders from `GET /analytics/today-by-doctor`.
- [ ] Queue rows load from `GET /appointments` with today's date and filters.
- [ ] Doctor/status/search filters persist in URL query params.
- [ ] Valid status transition buttons render for each row and update via `PATCH /appointments/:id/status`.
- [ ] Staff cancellation uses `DELETE /appointments/:id` and refreshes queue/analytics data.
- [ ] Socket.IO updates invalidate queue and analytics queries without full-page reload.
- [ ] Mobile layout remains usable with stacked queue cards.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
