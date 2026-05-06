# Spec: Walk-In Booking Page

**Route**: `/staff/walkin`  
**Component**: `WalkInBookingPage`  
**Auth**: RECEPTIONIST and ADMIN  
**File**: `frontend/src/features/booking/pages/WalkInBookingPage.tsx`

---

## 1. Purpose

Allows receptionist staff to create an appointment on behalf of a patient. The flow supports existing patient lookup, optional new-patient intake when backend supports it, doctor/date/slot selection, staff override notes, and idempotent booking submission.

---

## 2. Layout

Uses `ReceptionistLayout`. The page is a guided staff booking flow with patient context always visible.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [ReceptionistLayout sidebar/header]                                  │
│                                                                      │
│ Walk-in Booking                                                      │
│ Book an appointment on behalf of a patient.                          │
│                                                                      │
│ [1 Patient] -> [2 Doctor] -> [3 Date & Time] -> [4 Confirm]          │
│                                                                      │
│ ┌──────────────────────────────┐ ┌────────────────────────────────┐ │
│ │ Patient                      │ │ Booking Summary                │ │
│ │ [Search patient________]     │ │ Patient: Sara Ali              │ │
│ │ [Selected patient card]      │ │ Doctor: Dr. Ahmad              │ │
│ │                              │ │ Time: Today 14:30              │ │
│ └──────────────────────────────┘ │ [Create Appointment]            │ │
│ ┌──────────────────────────────┐ └────────────────────────────────┘ │
│ │ Doctor + Slot Picker         │                                    │
│ │ [Doctor] [Date] [Slots...]   │                                    │
│ └──────────────────────────────┘                                    │
└──────────────────────────────────────────────────────────────────────┘
```

- Desktop: patient panel and sticky summary side-by-side; slot picker below or adjacent depending width.
- Mobile: stepper cards stack; summary appears after slot selection.
- Use existing booking components where possible: `DoctorSelector`, `SlotPicker`, `BookingSummary`, `ConfirmationModal`.

---

## 3. User Flow

1. If `patientId` query param exists, load and select that patient.
2. Otherwise, receptionist searches for an existing patient by name, phone, or email.
3. Receptionist selects a patient.
4. Receptionist selects doctor and date.
5. Fetch available slots with `GET /appointments/slots`.
6. Receptionist selects a slot returned by the backend.
7. Receptionist enters optional staff note/reason.
8. Submit `POST /appointments` with `patientId`, `doctorId`, `startsAt`, and `Idempotency-Key`.
9. On success, show toast and redirect to `/staff/appointments?tab=today&highlight=<appointmentId>`.

Do not recompute selected slot timestamps in browser local time. Submit the exact `startsAt` ISO returned by the slots endpoint.

---

## 4. Backend Contract Note

`BACKEND_PLAN.md` states `POST /appointments` supports patient or receptionist booking, but the example patient booking payload only includes `doctorId` and `startsAt`. Staff booking requires the backend DTO to accept `patientId` for receptionist/admin callers.

If new-patient intake is required in this page, backend must also expose a receptionist-safe patient creation endpoint. Until then, only existing patient selection should be implemented.

---

## 5. Form State and Validation

```typescript
interface WalkInBookingState {
  patientId: string | null;
  doctorId: string | null;
  selectedDate: string;       // YYYY-MM-DD in clinic timezone
  selectedSlotStart: string | null;
  staffNote: string;
}

interface StaffCreateAppointmentDTO {
  patientId: string;
  doctorId: string;
  startsAt: string;
  staffNote?: string;
}
```

Validation schema:

```typescript
const walkInBookingSchema = z.object({
  patientId: z.string().min(1, 'walkIn.errors.patientRequired'),
  doctorId: z.string().min(1, 'walkIn.errors.doctorRequired'),
  startsAt: z.string().min(1, 'walkIn.errors.slotRequired'),
  staffNote: z.string().max(500, 'walkIn.errors.noteTooLong').optional(),
});
```

---

## 6. Data Models

```typescript
interface WalkInPatientDTO {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
}

interface DoctorDirectoryItemDTO {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
  isActive: boolean;
}

interface AvailableSlotDTO {
  startsAt: string;
  endsAt: string;
  doctorId: string;
}

interface StaffCreatedAppointmentDTO {
  id: string;
  patientId: string;
  doctorId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  bookedByRole: 'RECEPTIONIST' | 'ADMIN';
}
```

---

## 7. Components

### `PatientLookup`

Searches and selects an existing patient.

| Element | Behavior |
|---|---|
| Search input | Debounced 300ms, minimum 2 chars |
| Result item | Shows name, phone, DOB when available |
| Selected card | Shows selected patient with `Change` action |
| Empty state | Links to `/staff/patients` or shows new-patient note if creation unsupported |

### `StaffBookingStepper`

Displays current step and completed steps. It is informational; do not block keyboard navigation by hiding later fields when earlier fields are incomplete. Disable dependent controls instead.

### `StaffBookingSummary`

Shows selected patient, doctor, slot, timezone, and staff note. Submit button is disabled until required fields are valid.

### `StaffBookingConfirmDialog`

Confirms patient/doctor/time before creating appointment. The dialog must show that the action is being performed by staff on behalf of the patient.

---

## 8. Hooks and API Layer

```typescript
// features/booking/api/appointments-api.ts
export async function createStaffAppointment(payload: StaffCreateAppointmentDTO, idempotencyKey: string): Promise<StaffCreatedAppointmentDTO>;

// features/staff/api/patients-api.ts
export async function searchPatients(params: { q: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<WalkInPatientDTO>>;
export async function getStaffPatient(patientId: string): Promise<WalkInPatientDTO>;
```

```typescript
export function useCreateStaffAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, idempotencyKey }: { payload: StaffCreateAppointmentDTO; idempotencyKey: string }) =>
      createStaffAppointment(payload, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'staff'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'staff-queue'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'today-summary'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'today-by-doctor'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
    },
  });
}
```

Generate the `Idempotency-Key` once when the confirm dialog opens and keep it stable while mutation is pending.

---

## 9. Query Params

| Param | Purpose |
|---|---|
| `patientId` | Preselect patient from `/staff/patients` or follow-ups table |
| `doctorId` | Preselect doctor |
| `date` | Preselect date as `YYYY-MM-DD` if not in the past |

Invalid query param values should be ignored with a non-blocking toast or inline warning.

---

## 10. Error Handling

| Scenario | UI |
|---|---|
| Patient lookup `403` | Show backend permission warning |
| Patient not found from query param | Clear selection and show toast |
| Doctors query fails | Error alert with Retry |
| Slots query fails | Error alert in slot picker with Retry |
| Booking conflict `409` | Toast `That slot was just taken. Please choose another time.` and refetch slots |
| Missing backend `patientId` support | Show server validation message; keep form state |
| Network error | Keep confirm dialog open and show inline error |

---

## 11. Loading States

- Patient lookup: skeleton result rows.
- Preselected patient load: selected patient card skeleton.
- Doctor directory: skeleton doctor cards/select.
- Slots: skeleton slot buttons.
- Create mutation: disable confirm dialog buttons and show spinner.

---

## 12. Routing

```tsx
{
  path: '/staff/walkin',
  element: (
    <ProtectedRoute roles={['RECEPTIONIST', 'ADMIN']}>
      <ReceptionistLayout>
        <WalkInBookingPage />
      </ReceptionistLayout>
    </ProtectedRoute>
  ),
}
```

---

## 13. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "walkIn": {
    "title": "Walk-in Booking",
    "subtitle": "Book an appointment on behalf of a patient.",
    "steps": {
      "patient": "Patient",
      "doctor": "Doctor",
      "dateTime": "Date & Time",
      "confirm": "Confirm"
    },
    "patientSearch": "Search patient",
    "changePatient": "Change patient",
    "selectPatient": "Select patient",
    "staffNote": "Staff note",
    "staffNotePlaceholder": "Optional note for this booking",
    "createAppointment": "Create Appointment",
    "confirmTitle": "Create appointment?",
    "confirmDescription": "This appointment will be booked by staff on behalf of the selected patient.",
    "success": "Appointment created.",
    "slotTaken": "That slot was just taken. Please choose another time.",
    "patientPermissionRequired": "Patient lookup needs backend permission before this page can load data.",
    "errors": {
      "patientRequired": "Please select a patient",
      "doctorRequired": "Please select a doctor",
      "slotRequired": "Please select an appointment time",
      "noteTooLong": "Note must be 500 characters or fewer"
    }
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "walkIn": {
    "title": "حجز زيارة مباشرة",
    "subtitle": "احجز موعداً نيابة عن المريض.",
    "steps": {
      "patient": "المريض",
      "doctor": "الطبيب",
      "dateTime": "التاريخ والوقت",
      "confirm": "تأكيد"
    },
    "patientSearch": "بحث عن مريض",
    "changePatient": "تغيير المريض",
    "selectPatient": "اختيار مريض",
    "staffNote": "ملاحظة الموظف",
    "staffNotePlaceholder": "ملاحظة اختيارية لهذا الحجز",
    "createAppointment": "إنشاء موعد",
    "confirmTitle": "إنشاء الموعد؟",
    "confirmDescription": "سيتم حجز هذا الموعد بواسطة الموظف نيابة عن المريض المحدد.",
    "success": "تم إنشاء الموعد.",
    "slotTaken": "تم أخذ هذا الوقت للتو. يرجى اختيار وقت آخر.",
    "patientPermissionRequired": "يحتاج بحث المرضى إلى صلاحية من الخلفية قبل تحميل البيانات.",
    "errors": {
      "patientRequired": "يرجى اختيار مريض",
      "doctorRequired": "يرجى اختيار طبيب",
      "slotRequired": "يرجى اختيار وقت الموعد",
      "noteTooLong": "يجب أن تكون الملاحظة 500 حرف أو أقل"
    }
  }
}
```

---

## 14. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/users?role=PATIENT` or `/patients` | Patient lookup |
| GET | `/users/:id` or `/patients/:id` | Load preselected patient |
| GET | `/doctors` | Doctor selector |
| GET | `/appointments/slots` | Slot selection |
| POST | `/appointments` | Create appointment on behalf of patient with `Idempotency-Key` |

---

## 15. Accessibility

- Stepper is descriptive and does not trap focus.
- Patient search results are keyboard selectable.
- Selected patient card exposes patient identity in text.
- Slot buttons include full date/time in accessible names.
- Confirm dialog clearly states the patient and appointment time.
- Mutation errors use `role="alert"`; success toast uses `role="status"`.

---

## 16. Acceptance Criteria

- [ ] Receptionist/admin can load `/staff/walkin`; other roles redirect to `/403`.
- [ ] `patientId` query param preselects an existing patient when backend permission exists.
- [ ] Staff can search and select an existing patient.
- [ ] Staff can select doctor/date/slot using backend-provided slots.
- [ ] Submit sends `patientId`, `doctorId`, and exact slot `startsAt` to `POST /appointments` with `Idempotency-Key`.
- [ ] Duplicate submit returns/uses the same appointment without creating another booking.
- [ ] Slot conflict keeps form state and refetches slots.
- [ ] Success redirects to `/staff/appointments` with the created appointment highlighted.
- [ ] Mobile layout remains usable without horizontal scrolling.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds once backend staff booking payload is supported.
