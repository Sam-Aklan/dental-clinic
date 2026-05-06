# Spec: Appointments Admin Page

**Route**: `/staff/appointments`  
**Component**: `AppointmentsAdminPage`  
**Auth**: RECEPTIONIST and ADMIN  
**File**: `frontend/src/features/booking/pages/AppointmentsAdminPage.tsx`

---

## 1. Purpose

Allows receptionist staff to search, filter, reschedule, cancel, export, and mark appointments across the clinic. Unlike patient appointment management, staff cancellation can override the 24-hour rule and staff can reschedule on behalf of patients.

---

## 2. Layout

Uses `ReceptionistLayout`. The page centers on a data table with tabs for today's appointments, upcoming appointments, and active waitlist entries.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [ReceptionistLayout sidebar/header]                                  │
│                                                                      │
│ Appointments                              [Walk-in Booking] [Export] │
│ Search, reschedule, and manage clinic appointments.                  │
│                                                                      │
│ [Today] [Upcoming] [Waitlist]                                        │
│ [Date range] [Doctor] [Status] [Patient search] [Reset]              │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ Time | Doctor | Patient | Status | Booked by | Actions         │   │
│ │ 10:00 Dr. Ahmad  Sara Ali CONFIRMED PATIENT [Cancel][Resched]  │   │
│ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

- Desktop: full-width table with sticky header and action menu column.
- Mobile: table switches to stacked cards using the same data model.
- Use shared `DataTable`, `DateRangePicker`, `ExportCsvButton`, `StatusBadge`, and shadcn `Dialog` primitives.

---

## 3. Tabs

| Tab | Query defaults | Purpose |
|---|---|---|
| Today | `date=today` | Front-desk daily control |
| Upcoming | `from=today`, `to=today+7days` | Forward planning and patient calls |
| Waitlist | active entries from `GET /waitlist` | Remove entries and inspect demand |

The `Today` and `Upcoming` tabs use `GET /appointments`. The `Waitlist` tab uses `GET /waitlist` and does not show appointment status filters.

---

## 4. Filters and URL State

| Param | Applies to | Purpose |
|---|---|---|
| `tab` | all | `today`, `upcoming`, or `waitlist` |
| `from` | upcoming | Start date ISO date |
| `to` | upcoming | End date ISO date |
| `doctorId` | all | Comma-separated doctor IDs |
| `status` | appointment tabs | Comma-separated appointment statuses |
| `patientName` | appointment tabs | Text search |
| `page` | all | Current table page |
| `sortBy` | appointment tabs | `startsAt`, `doctor`, `status`, `createdAt` |
| `sortDir` | appointment tabs | `asc` or `desc` |

Filter and pagination state must survive page refresh by syncing to query params.

---

## 5. Data Models

```typescript
type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW';

interface StaffAppointmentDTO {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  createdAt: string;
  bookedByRole: 'PATIENT' | 'RECEPTIONIST' | 'ADMIN';
  cancellationReason?: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    email: string | null;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
}

interface RescheduleAppointmentDTO {
  doctorId: string;
  startsAt: string;
  reason?: string;
}

interface StaffCancelAppointmentDTO {
  reason: string;
}
```

---

## 6. Table Columns

### Appointment Tabs

| Column | Sortable | Filterable | Notes |
|---|---|---|---|
| Time | Yes | Date/date range | Clinic timezone, localized |
| Doctor | Yes | Multi-select | `Dr. First Last` |
| Patient name | No | Text search | Link to `/staff/patients/:patientId` if detail route is added later |
| Phone | No | Text search optional | Click-to-call link on supported devices |
| Status | Yes | Multi-select | Shared `StatusBadge` |
| Booked by | No | No | `PATIENT`, `RECEPTIONIST`, or `ADMIN` |
| Created | Yes | No | `createdAt` |
| Actions | No | No | Cancel, Reschedule, Mark No-Show |

### Waitlist Tab

| Column | Notes |
|---|---|
| Position | Position in doctor's waitlist |
| Patient name | Searchable if API supports `patientName` |
| Doctor | Doctor name |
| Available window | `HH:mm - HH:mm` or `Any available time` |
| Since | Relative created time |
| Actions | Remove entry |

---

## 7. Actions

### Cancel Appointment

Use a confirmation dialog with required reason.

| Rule | Behavior |
|---|---|
| Staff override | Do not apply patient 24-hour frontend rule |
| Submit | `DELETE /appointments/:id` with reason when backend accepts body/query |
| Success | Toast success; invalidate appointments, queue, analytics, waitlist |
| Side effect | Backend may emit slot-opened event for waitlist offers |

### Reschedule Appointment

Use a dialog with doctor select, date picker, slot picker, and reason input.

Flow:

1. Default doctor to current appointment doctor.
2. Fetch available slots for selected doctor/date via `GET /appointments/slots`.
3. Submit `PATCH /appointments/:id` with selected `doctorId` and slot `startsAt`.
4. On success, close dialog and highlight updated row.

### Mark No-Show

Use `PATCH /appointments/:id/status` with `NO_SHOW`. Confirm before submitting.

---

## 8. Hooks and API Layer

```typescript
// features/booking/api/appointments-api.ts
export async function getStaffAppointments(params: {
  date?: string;
  from?: string;
  to?: string;
  doctorId?: string[];
  status?: AppointmentStatus[];
  patientName?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}): Promise<PaginatedResponse<StaffAppointmentDTO>>;

export async function rescheduleAppointment(id: string, payload: RescheduleAppointmentDTO): Promise<StaffAppointmentDTO>;
export async function updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<StaffAppointmentDTO>;
export async function cancelAppointmentAsStaff(id: string, payload: StaffCancelAppointmentDTO): Promise<void>;
export async function exportAppointmentsCsv(params: StaffAppointmentFilters): Promise<Blob>;
```

```typescript
export function useStaffAppointments(filters: StaffAppointmentFilters) {
  return useQuery({
    queryKey: ['appointments', 'staff', filters],
    queryFn: () => getStaffAppointments(filters),
    placeholderData: keepPreviousData,
  });
}
```

---

## 9. Loading and Error States

| State | UI |
|---|---|
| Initial load | Table skeleton rows |
| Filter change | Keep previous data and show subtle loading indicator |
| Empty result | Empty table state with `Reset filters` |
| Export pending | Disable export button and show spinner |
| Reschedule slot conflict `409` | Toast `That slot was just taken. Please choose another time.` and refetch slots |
| Cancel `403` | Toast no-permission message |
| Appointment not found `404` | Close dialog, toast message, refetch table |

---

## 10. Routing

```tsx
{
  path: '/staff/appointments',
  element: (
    <ProtectedRoute roles={['RECEPTIONIST', 'ADMIN']}>
      <ReceptionistLayout>
        <AppointmentsAdminPage />
      </ReceptionistLayout>
    </ProtectedRoute>
  ),
}
```

---

## 11. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "staffAppointments": {
    "title": "Appointments",
    "subtitle": "Search, reschedule, and manage clinic appointments.",
    "walkInBooking": "Walk-in Booking",
    "export": "Export",
    "tabs": {
      "today": "Today",
      "upcoming": "Upcoming",
      "waitlist": "Waitlist"
    },
    "filters": {
      "dateRange": "Date range",
      "doctor": "Doctor",
      "status": "Status",
      "patientSearch": "Patient search",
      "reset": "Reset"
    },
    "columns": {
      "time": "Time",
      "doctor": "Doctor",
      "patient": "Patient",
      "phone": "Phone",
      "status": "Status",
      "bookedBy": "Booked by",
      "created": "Created",
      "actions": "Actions"
    },
    "actions": {
      "cancel": "Cancel",
      "reschedule": "Reschedule",
      "markNoShow": "Mark No-Show",
      "removeWaitlist": "Remove entry"
    },
    "cancelTitle": "Cancel appointment?",
    "cancelReason": "Cancellation reason",
    "rescheduleTitle": "Reschedule appointment",
    "rescheduleSuccess": "Appointment rescheduled.",
    "cancelSuccess": "Appointment canceled.",
    "noShowSuccess": "Appointment marked as no-show.",
    "slotTaken": "That slot was just taken. Please choose another time.",
    "empty": "No appointments match these filters."
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "staffAppointments": {
    "title": "المواعيد",
    "subtitle": "ابحث وأعد الجدولة وأدر مواعيد العيادة.",
    "walkInBooking": "حجز زيارة مباشرة",
    "export": "تصدير",
    "tabs": {
      "today": "اليوم",
      "upcoming": "القادمة",
      "waitlist": "قائمة الانتظار"
    },
    "filters": {
      "dateRange": "نطاق التاريخ",
      "doctor": "الطبيب",
      "status": "الحالة",
      "patientSearch": "بحث عن مريض",
      "reset": "إعادة ضبط"
    },
    "columns": {
      "time": "الوقت",
      "doctor": "الطبيب",
      "patient": "المريض",
      "phone": "الهاتف",
      "status": "الحالة",
      "bookedBy": "تم الحجز بواسطة",
      "created": "تم الإنشاء",
      "actions": "الإجراءات"
    },
    "actions": {
      "cancel": "إلغاء",
      "reschedule": "إعادة جدولة",
      "markNoShow": "تسجيل عدم حضور",
      "removeWaitlist": "إزالة الإدخال"
    },
    "cancelTitle": "إلغاء الموعد؟",
    "cancelReason": "سبب الإلغاء",
    "rescheduleTitle": "إعادة جدولة الموعد",
    "rescheduleSuccess": "تمت إعادة جدولة الموعد.",
    "cancelSuccess": "تم إلغاء الموعد.",
    "noShowSuccess": "تم تسجيل الموعد كعدم حضور.",
    "slotTaken": "تم أخذ هذا الوقت للتو. يرجى اختيار وقت آخر.",
    "empty": "لا توجد مواعيد تطابق هذه المرشحات."
  }
}
```

---

## 12. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/appointments` | Today/upcoming appointment tables |
| GET | `/appointments/slots` | Available slots for reschedule |
| PATCH | `/appointments/:id` | Reschedule appointment |
| PATCH | `/appointments/:id/status` | Mark no-show |
| DELETE | `/appointments/:id` | Staff cancellation override |
| GET | `/appointments/export?format=csv` | Export filtered appointments |
| GET | `/waitlist` | Active waitlist entries tab |
| DELETE | `/waitlist/:id` | Remove waitlist entry |
| GET | `/doctors` | Doctor filters and reschedule doctor select |

---

## 13. Accessibility

- Data table has semantic table markup on desktop and labeled cards on mobile.
- Action menus have accessible names including patient and appointment time.
- Dialogs trap focus and return focus to triggering button on close.
- Destructive actions require confirmation and are not color-only.
- Export button announces progress with `aria-busy`.

---

## 14. Acceptance Criteria

- [ ] Receptionist/admin can load `/staff/appointments`; other roles redirect to `/403`.
- [ ] Today tab loads today's appointments from `GET /appointments`.
- [ ] Upcoming tab defaults to today through +7 days and supports date range changes.
- [ ] Filters, sorting, and pagination persist in URL query params.
- [ ] Staff can cancel an appointment with a reason regardless of patient 24-hour rule.
- [ ] Staff can reschedule by selecting an available backend-provided slot.
- [ ] Staff can mark eligible appointments as no-show.
- [ ] Waitlist tab lists active entries and supports removal.
- [ ] CSV export sends current filters to `/appointments/export?format=csv`.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
