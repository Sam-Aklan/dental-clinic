# Spec: My Appointments Page

**Route**: `/appointments`  
**Component**: `MyAppointmentsPage`  
**Auth**: PATIENT only  
**File**: `frontend/src/features/booking/pages/MyAppointmentsPage.tsx`

---

## 1. Purpose

Allows a patient to view upcoming and past appointments, inspect appointment details, and cancel eligible upcoming appointments. Patient-side cancellation must respect the backend-enforced 24-hour rule and should explain the rule before the user attempts cancellation.

---

## 2. Layout

Uses `PatientLayout`. The page is a tabbed list with a filter/search row and appointment cards.

```
┌─────────────────────────────────────────────────────────────────┐
│  [PatientLayout sidebar/header]                                  │
│                                                                   │
│  My Appointments                                      [Book New]  │
│                                                                   │
│  [Upcoming] [Past] [Canceled]                                     │
│  [Doctor filter ▼] [Status filter ▼]                              │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Dr. Ahmad Al-Rashid                                         │  │
│  │ Tue, May 5, 2026 · 10:30 AM - 11:00 AM       CONFIRMED      │  │
│  │ Booked Apr 30, 2026                         [Cancel]        │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Dr. Sara Hussein                                            │  │
│  │ Mon, Apr 21, 2026 · 1:00 PM - 1:30 PM       COMPLETED       │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

- Desktop: list width max `900px` with cards stacked vertically.
- Mobile: cards collapse action buttons below appointment details.
- `Book New` links to `/book`.

---

## 3. Tabs and Filters

| Tab | Query filters | Sort |
|---|---|---|
| Upcoming | `from=now`, statuses `PENDING,CONFIRMED,IN_PROGRESS` | `startsAt` ascending |
| Past | `to=now`, statuses `COMPLETED,NO_SHOW` | `startsAt` descending |
| Canceled | status `CANCELED` | `startsAt` descending |

Filters:

| Filter | Behavior |
|---|---|
| Doctor | Client-side dropdown populated from appointment results, or server-side `doctorId` if API supports it |
| Status | Multi-select status filter within current tab |
| Page | Pagination defaults to 10 rows per page |

The selected tab and filters should be reflected in URL query params so refresh/back navigation preserves state.

---

## 4. Data Models

```typescript
interface PatientAppointmentDTO {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  createdAt: string;
  cancellationReason?: string | null;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
}

type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW';
```

---

## 5. Cancellation Rules

The backend enforces cancellation eligibility. The frontend should also calculate a display-only eligibility flag to avoid offering impossible actions.

```typescript
function canPatientCancel(appointment: PatientAppointmentDTO) {
  return ['PENDING', 'CONFIRMED'].includes(appointment.status)
    && dayjs(appointment.startsAt).diff(dayjs(), 'hour', true) >= 24;
}
```

UI rules:

| Condition | UI |
|---|---|
| Eligible appointment | Show `Cancel` button |
| Less than 24h before start | Show disabled `Cancel` with tooltip/note |
| `IN_PROGRESS`, `COMPLETED`, `NO_SHOW`, `CANCELED` | No cancel action |

Cancellation dialog copy must state that canceling may open the slot to waitlisted patients.

---

## 6. Components

### `AppointmentCard`

Displays appointment summary.

| Element | Behavior |
|---|---|
| Doctor name | `Dr. First Last` |
| Specialization | Muted subtitle when present |
| Date/time | Formatted with `formatAppointmentTime` in clinic timezone |
| Status | Uses shared `StatusBadge` |
| Actions | Cancel only when eligible; details optional |

### `CancelAppointmentDialog`

Requires explicit confirmation.

| Element | Behavior |
|---|---|
| Appointment summary | Repeats doctor/date/time |
| Warning text | Explains 24h rule and irreversible cancellation |
| Confirm button | Calls `DELETE /appointments/:id` |
| Close button | Dismisses without changing data |

---

## 7. Hooks and API Layer

```typescript
// features/booking/api/appointments-api.ts
export async function getMyAppointments(params: {
  from?: string;
  to?: string;
  status?: AppointmentStatus[];
  doctorId?: string;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<PatientAppointmentDTO>>;

export async function cancelAppointment(appointmentId: string): Promise<void>;
```

```typescript
export function useAppointments(filters: AppointmentFilters) {
  return useQuery({
    queryKey: ['appointments', 'mine', filters],
    queryFn: () => getMyAppointments(filters),
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
    },
  });
}
```

---

## 8. Error Handling

| Scenario | UI |
|---|---|
| Appointments query fails | Error card with Retry button |
| Cancel `403` | Toast `You can only cancel your own appointments.` |
| Cancel `409` or `400` due to 24h rule | Toast `Appointments can only be canceled at least 24 hours before the start time.` and refresh list |
| Cancel network error | Keep dialog open and show inline error |
| Empty tab | Empty state with context-specific copy and `Book New` CTA for upcoming/past tabs |

---

## 9. Loading States

- Initial load: 3 appointment card skeletons.
- Filter change: keep previous data while refetching when possible.
- Cancel mutation: disable dialog buttons and show spinner.
- Recently created appointment: if `created` query param exists, highlight matching card for 5 seconds.

---

## 10. Routing

```tsx
{
  path: '/appointments',
  element: (
    <ProtectedRoute roles={['PATIENT']}>
      <PatientLayout>
        <MyAppointmentsPage />
      </PatientLayout>
    </ProtectedRoute>
  ),
}
```

Supported query params:

| Param | Purpose |
|---|---|
| `tab` | `upcoming`, `past`, or `canceled` |
| `doctorId` | Filter by doctor |
| `status` | Comma-separated appointment statuses |
| `page` | Current page |
| `created` | Appointment ID to highlight after booking |

---

## 11. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "appointments": {
    "title": "My Appointments",
    "bookNew": "Book New",
    "tabs": {
      "upcoming": "Upcoming",
      "past": "Past",
      "canceled": "Canceled"
    },
    "filters": {
      "doctor": "Doctor",
      "status": "Status"
    },
    "cancel": "Cancel",
    "cancelDialogTitle": "Cancel appointment?",
    "cancelDialogDescription": "This action cannot be undone. The slot may be offered to patients on the waitlist.",
    "cancelConfirm": "Cancel Appointment",
    "cancelSuccess": "Appointment canceled successfully.",
    "cancelTooLate": "Appointments can only be canceled at least 24 hours before the start time.",
    "emptyUpcoming": "You have no upcoming appointments.",
    "emptyPast": "You have no past appointments.",
    "emptyCanceled": "You have no canceled appointments."
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "appointments": {
    "title": "مواعيدي",
    "bookNew": "حجز موعد جديد",
    "tabs": {
      "upcoming": "القادمة",
      "past": "السابقة",
      "canceled": "الملغاة"
    },
    "filters": {
      "doctor": "الطبيب",
      "status": "الحالة"
    },
    "cancel": "إلغاء",
    "cancelDialogTitle": "إلغاء الموعد؟",
    "cancelDialogDescription": "لا يمكن التراجع عن هذا الإجراء. قد يتم عرض الموعد على المرضى في قائمة الانتظار.",
    "cancelConfirm": "إلغاء الموعد",
    "cancelSuccess": "تم إلغاء الموعد بنجاح.",
    "cancelTooLate": "يمكن إلغاء المواعيد قبل 24 ساعة على الأقل من وقت البدء.",
    "emptyUpcoming": "ليس لديك مواعيد قادمة.",
    "emptyPast": "ليس لديك مواعيد سابقة.",
    "emptyCanceled": "ليس لديك مواعيد ملغاة."
  }
}
```

---

## 12. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/appointments` | Load current patient's appointments |
| DELETE | `/appointments/:id` | Cancel current patient's appointment |

---

## 13. Accessibility

- Tabs use shadcn `Tabs` or equivalent ARIA tab pattern.
- Appointment cards expose status text, not color alone.
- Disabled cancel button includes explanatory text visible on mobile and tooltip on desktop.
- Dialog has accessible title and description.
- Pagination controls have `aria-label` values.

---

## 14. Acceptance Criteria

- [ ] Patient can view upcoming, past, and canceled appointment tabs.
- [ ] Appointment list is loaded from `GET /appointments` with patient-scoped data.
- [ ] Appointment dates/times render in clinic timezone and current locale.
- [ ] Eligible upcoming appointments show a working cancel action.
- [ ] Appointments less than 24h away do not allow patient cancellation in the UI.
- [ ] Cancel confirmation sends `DELETE /appointments/:id` and refreshes the list.
- [ ] After booking redirect, the newly created appointment is highlighted if present.
- [ ] Empty states include useful CTAs.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
