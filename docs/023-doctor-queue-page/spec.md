# Spec: Doctor Queue Page

**Route**: `/doctor/queue`  
**Component**: `DoctorQueuePage`  
**Auth**: DOCTOR  
**File**: `frontend/src/features/queue/pages/DoctorQueuePage.tsx`

---

## 1. Purpose

Gives an authenticated doctor a live operational queue for their own appointments today. The page is optimized for chair-side workflow: confirm the next patient, start a session, complete treatment, mark no-shows, and add short appointment notes without exposing unnecessary patient identity details.

---

## 2. Layout

Uses `DoctorLayout`. The page is a focused queue board with a live connection indicator, compact filters, current-session emphasis, and queue sections for the rest of the day.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [DoctorLayout sidebar/header]                                        │
│                                                                      │
│ My Queue                                      Live · Updated 10:32    │
│ Manage today's patient flow and appointment notes.                   │
│                                                                      │
│ [In Session] [Waiting] [Upcoming] [Completed] [No-Shows]             │
│                                                                      │
│ [Status filter] [Show completed toggle] [Refresh]                    │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ In Session                                                     │   │
│ │ #4 10:30-11:00  IN_PROGRESS  Notes... [Complete] [Edit Notes]  │   │
│ └────────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ Waiting                                                        │   │
│ │ #5 11:00-11:30  CONFIRMED    [Start] [No-show] [Edit Notes]    │   │
│ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

- Desktop: KPI cards in a 5-column row, then queue sections in one wide column.
- Tablet/mobile: KPI cards scroll horizontally; queue rows become stacked cards with full-width actions.
- Use shadcn `Card`, `Button`, `Badge`, `Select`, `Switch`, `Skeleton`, `Alert`, `Dialog`, `Textarea`, and `Tooltip` primitives.
- Use shared `StatusBadge`, `KpiCard`, and queue action components where possible.

---

## 3. Operational Rules

The queue is scoped to the authenticated doctor's own appointments for the clinic day in the configured clinic timezone.

| Rule | Behavior |
|---|---|
| Scope | Doctor can only see and mutate appointments assigned to their own doctor profile |
| Privacy | Primary UI shows `Patient #` or queue position, not full patient name |
| Queue order | Sort by `startsAt` ascending; put `IN_PROGRESS` at top in its own section |
| Waiting definition | `CONFIRMED` appointment with `startsAt <= now + 30 minutes` |
| Start session | Only one `IN_PROGRESS` appointment should exist for the doctor at a time |
| Complete session | Available only for `IN_PROGRESS` appointments |
| No-show | Available for `CONFIRMED` appointments at or after scheduled start time |
| Notes | Notes are appointment-level operational notes, not a full medical record |
| Live freshness | Refetch every 60 seconds and react to Socket.IO `queue.updated` events |

If the backend rejects a transition because another appointment is already in progress, show the server message and refetch the queue.

---

## 4. KPI Cards

Data source: derived from `GET /appointments` for today's doctor queue or from `GET /analytics/my-stats?date=today` if available.

| Card | Calculation | Notes |
|---|---|---|
| In Session | Count where `status = IN_PROGRESS` | Usually `0` or `1`; use active palette |
| Waiting | `CONFIRMED` and due now/soon | Same definition as queue rule |
| Upcoming | `CONFIRMED` and starts later than now + 30 minutes | Future workload |
| Completed | `COMPLETED` today | Progress indicator |
| No-Shows | `NO_SHOW` today | Warning palette |

KPI cards use shared `KpiCard`. Delta/sparkline is not required on this operational page; show `Today` or `Live` as supporting text.

---

## 5. Queue Sections

| Section | Included statuses | Sort | Default visibility |
|---|---|---|---|
| In Session | `IN_PROGRESS` | `startsAt` ascending | Always visible |
| Waiting | `CONFIRMED` due now/soon | `startsAt` ascending | Always visible |
| Upcoming | `PENDING`, `CONFIRMED` later today | `startsAt` ascending | Always visible |
| Finished | `COMPLETED`, `NO_SHOW`, `CANCELED` | `startsAt` descending | Hidden unless toggle enabled |

Empty sections should show a compact empty state instead of disappearing entirely, so the doctor can tell the queue is loaded.

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

interface DoctorQueueAppointmentDTO {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  queuePosition: number;
  patientSequence: number;
  notes: string | null;
  updatedAt: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface DoctorQueueSummaryDTO {
  inSession: number;
  waiting: number;
  upcoming: number;
  completed: number;
  noShows: number;
}

interface UpdateAppointmentNotesDTO {
  notes: string;
}
```

If the backend returns patient identity fields in a shared appointment DTO, the page must not render patient name, email, or phone in the queue list.

---

## 7. Filters and URL State

Supported query params:

| Param | Purpose | Default |
|---|---|---|
| `status` | Comma-separated appointment statuses | none |
| `showFinished` | Whether finished section is visible | `false` |

Filter state must survive refresh and browser back navigation. Use `replace` for switch changes and `push` for explicit dropdown selection.

---

## 8. Components

### `DoctorQueueHeader`

Renders title, subtitle, live connection badge, last updated time, and manual refresh button.

### `DoctorQueueSummary`

Renders the five queue KPI cards from `DoctorQueueSummaryDTO`.

### `DoctorQueueFilters`

Contains status multi-select and `showFinished` toggle.

### `DoctorQueueSection`

Groups appointment cards by operational section and displays count, section help text, and empty state.

### `DoctorQueueItem`

Displays a single appointment row/card.

| Element | Behavior |
|---|---|
| Time | Localized clinic-time `HH:mm-HH:mm` |
| Patient | `Patient #{{patientSequence}}` only |
| Position | Queue position for today's doctor schedule |
| Status | Shared `StatusBadge` |
| Notes | Truncated to 2 lines with `Edit Notes` action |
| Actions | Valid transition buttons plus notes action |

### `DoctorStatusTransitionButtons`

Uses a centralized transition map.

```typescript
const doctorTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  PENDING: ['CONFIRMED'],
  CONFIRMED: ['IN_PROGRESS', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELED: [],
  NO_SHOW: [],
};
```

### `AppointmentNotesDialog`

Textarea dialog for adding or editing notes. Notes are limited to 1,000 characters on the frontend unless backend exposes a stricter limit.

---

## 9. Hooks and API Layer

```typescript
// features/queue/api/queue-api.ts
export async function getDoctorQueue(params: {
  date: string;
  status?: AppointmentStatus[];
}): Promise<DoctorQueueAppointmentDTO[]>;

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<DoctorQueueAppointmentDTO>;

export async function updateAppointmentNotes(
  id: string,
  payload: UpdateAppointmentNotesDTO,
): Promise<DoctorQueueAppointmentDTO>;
```

```typescript
export function useDoctorQueue(filters: DoctorQueueFilters) {
  return useQuery({
    queryKey: ['appointments', 'doctor-queue', filters],
    queryFn: () => getDoctorQueue(filters),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'doctor-queue'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'my-stats'] });
    },
  });
}

export function useUpdateAppointmentNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      updateAppointmentNotes(id, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'doctor-queue'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'doctor-today'] });
    },
  });
}
```

---

## 10. Socket.IO Integration

Subscribe to the authenticated doctor's queue room on mount.

```typescript
queueSocket.emit('queue.subscribe', { scope: 'doctor', doctorId, date: today });
queueSocket.on('queue.updated', handleQueueUpdated);
```

On `queue.updated` for this doctor:

- Invalidate `['appointments', 'doctor-queue']`.
- Invalidate `['appointments', 'doctor-today']`.
- Invalidate `['analytics', 'my-stats']`.
- Show a subtle `Updated now` indicator, not a toast for every live update.

On disconnect, show a `Reconnecting...` badge and keep polling.

---

## 11. Error Handling

| Scenario | UI |
|---|---|
| Queue query fails | Error card with Retry button |
| Status transition `400` | Toast server message and refetch queue |
| Status transition `403` | Toast `You can only update your own queue.` |
| Notes save fails | Keep dialog open, show inline error, preserve draft |
| Socket disconnects | Header badge shows `Reconnecting...`; polling continues |
| No appointments today | Empty state with link to `/doctor/today` |

---

## 12. Loading States

- First load: KPI skeletons and section skeleton cards.
- Filter change: keep previous queue data while refetching.
- Status mutation: disable only the affected row's action buttons.
- Notes mutation: disable dialog submit and show spinner in submit button.
- Socket reconnect: no full-page loading state.

---

## 13. Routing

```tsx
{
  path: '/doctor/queue',
  element: (
    <ProtectedRoute roles={['DOCTOR']}>
      <DoctorLayout>
        <DoctorQueuePage />
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
  "doctorQueue": {
    "title": "My Queue",
    "subtitle": "Manage today's patient flow and appointment notes.",
    "live": "Live",
    "updatedAt": "Updated {{time}}",
    "reconnecting": "Reconnecting...",
    "patientNumber": "Patient #{{number}}",
    "kpis": {
      "inSession": "In Session",
      "waiting": "Waiting",
      "upcoming": "Upcoming",
      "completed": "Completed",
      "noShows": "No-Shows"
    },
    "sections": {
      "inSession": "In Session",
      "waiting": "Waiting",
      "upcoming": "Upcoming",
      "finished": "Finished"
    },
    "filters": {
      "status": "Status",
      "showFinished": "Show completed and no-shows"
    },
    "actions": {
      "confirm": "Confirm",
      "start": "Start Session",
      "complete": "Complete",
      "markNoShow": "Mark No-Show",
      "editNotes": "Edit Notes",
      "saveNotes": "Save Notes"
    },
    "notes": {
      "title": "Appointment notes",
      "placeholder": "Add short notes for this appointment",
      "saved": "Notes saved."
    },
    "empty": "No appointments in this section.",
    "updateSuccess": "Appointment updated.",
    "ownQueueOnly": "You can only update your own queue."
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "doctorQueue": {
    "title": "قائمتي",
    "subtitle": "إدارة حركة مرضى اليوم وملاحظات المواعيد.",
    "live": "مباشر",
    "updatedAt": "تم التحديث {{time}}",
    "reconnecting": "جار إعادة الاتصال...",
    "patientNumber": "المريض رقم {{number}}",
    "kpis": {
      "inSession": "قيد الجلسة",
      "waiting": "في الانتظار",
      "upcoming": "قادمة",
      "completed": "مكتملة",
      "noShows": "عدم حضور"
    },
    "sections": {
      "inSession": "قيد الجلسة",
      "waiting": "في الانتظار",
      "upcoming": "قادمة",
      "finished": "منتهية"
    },
    "filters": {
      "status": "الحالة",
      "showFinished": "إظهار المكتملة وعدم الحضور"
    },
    "actions": {
      "confirm": "تأكيد",
      "start": "بدء الجلسة",
      "complete": "إكمال",
      "markNoShow": "تسجيل عدم حضور",
      "editNotes": "تعديل الملاحظات",
      "saveNotes": "حفظ الملاحظات"
    },
    "notes": {
      "title": "ملاحظات الموعد",
      "placeholder": "أضف ملاحظات قصيرة لهذا الموعد",
      "saved": "تم حفظ الملاحظات."
    },
    "empty": "لا توجد مواعيد في هذا القسم.",
    "updateSuccess": "تم تحديث الموعد.",
    "ownQueueOnly": "يمكنك تحديث قائمتك فقط."
  }
}
```

---

## 15. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/appointments` | Today's doctor queue list with server-side doctor scoping |
| PATCH | `/appointments/:id/status` | Confirm/start/complete/no-show |
| PATCH | `/appointments/:id` | Save appointment notes when backend accepts notes on appointment update |
| GET | `/analytics/my-stats` | Optional KPI source for today's doctor stats |
| Socket.IO | `/queue` | Live queue updates |

Backend must enforce doctor ownership even if the frontend sends no explicit `doctorId`.

---

## 16. Accessibility

- Queue actions must be keyboard reachable and have clear loading labels.
- Live update indicator uses `aria-live="polite"`.
- Status is expressed with text labels, not color only.
- Notes dialog focuses the textarea on open and returns focus to the triggering button on close.
- Destructive or irreversible actions, including no-show, require confirmation.

---

## 17. Acceptance Criteria

- [ ] Doctor can load `/doctor/queue`; non-doctor roles redirect to `/403`.
- [ ] Queue rows load from `GET /appointments` scoped to today's authenticated doctor.
- [ ] Patient identity is displayed as patient number/position, not full name/email/phone.
- [ ] Queue sections render in-session, waiting, upcoming, and optionally finished appointments.
- [ ] Valid status transition buttons render and update via `PATCH /appointments/:id/status`.
- [ ] No-show action requires confirmation and only appears for eligible confirmed appointments.
- [ ] Notes can be added/edited without losing the queue filter state.
- [ ] Socket.IO updates invalidate doctor queue and related doctor stats without full-page reload.
- [ ] Mobile layout remains usable with stacked queue cards and full-width actions.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
