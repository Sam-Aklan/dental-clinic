# Spec: Booking Page

**Route**: `/book`  
**Component**: `BookingPage`  
**Auth**: PATIENT only  
**File**: `frontend/src/features/booking/pages/BookingPage.tsx`

---

## 1. Purpose

Allows an authenticated patient to book a new appointment by choosing a doctor, choosing a date from the clinic calendar, selecting an available slot, and confirming the booking. The page is the primary post-registration destination for patient users.

---

## 2. Layout

Uses `PatientLayout`. The page is a guided booking flow with a compact step summary on desktop and stacked cards on mobile.

```
┌─────────────────────────────────────────────────────────────────┐
│  [PatientLayout sidebar/header]                                  │
│                                                                   │
│  Book an Appointment                                              │
│  Choose a doctor and available time that works for you.           │
│                                                                   │
│  [1 Doctor] -> [2 Date] -> [3 Time] -> [4 Confirm]                │
│                                                                   │
│  ┌──────────────────────────────┐  ┌──────────────────────────┐  │
│  │ Select Doctor                 │  │ Appointment Summary      │  │
│  │ [Search doctors________]      │  │ Doctor: Dr. Ahmad        │  │
│  │ [Doctor Card]                 │  │ Date: May 5, 2026        │  │
│  │ [Doctor Card]                 │  │ Time: 10:30 AM           │  │
│  └──────────────────────────────┘  │ [Confirm Booking]        │  │
│                                    └──────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Calendar + Available Slots                                  │  │
│  │ [< May 2026 >]                                               │  │
│  │ [10:00] [10:30] [11:00] [14:30]                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

- Desktop: two-column top area with doctor selector and sticky summary card.
- Mobile: single-column flow; summary card appears after slot selection.
- Use shadcn `Card`, `Button`, `Select`, `Calendar`, `Skeleton`, `Alert`, and `Dialog` primitives.

---

## 3. Booking Flow

1. Load public doctor directory with `GET /doctors`.
2. Patient selects a doctor.
3. Patient selects a date; default date is today in clinic timezone.
4. Fetch slots for the selected doctor and visible date range with `GET /appointments/slots`.
5. Patient selects one available slot.
6. Patient clicks `Confirm Booking`; open confirmation dialog.
7. Submit `POST /appointments` with an `Idempotency-Key` header.
8. On success, show success toast and redirect to `/appointments?created=<appointmentId>`.

---

## 4. Form State

The page is not a traditional form until confirmation. UI state is held in the page component and passed to child components.

```typescript
interface BookingSelectionState {
  doctorId: string | null;
  selectedDate: string;      // YYYY-MM-DD in clinic timezone
  selectedSlotStart: string | null; // ISO string from slots endpoint
}
```

The confirm mutation payload is:

```typescript
interface CreateAppointmentDTO {
  doctorId: string;
  startsAt: string;          // ISO string from selected slot
}
```

Do not recompute the selected slot timestamp from local browser time. Always submit the slot ISO returned by the backend.

---

## 5. Data Models

```typescript
interface DoctorDirectoryItemDTO {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string | null;
  bio: string | null;
  isActive: boolean;
}

interface AvailableSlotDTO {
  startsAt: string;          // ISO UTC timestamp
  endsAt: string;            // ISO UTC timestamp
  doctorId: string;
}

interface AppointmentDTO {
  id: string;
  doctorId: string;
  patientId: string;
  startsAt: string;
  endsAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
  createdAt: string;
}
```

---

## 6. Components

### `DoctorSelector`

Displays active doctors as selectable cards.

| Element | Behavior |
|---|---|
| Search input | Client-side filters by doctor name and specialization |
| Doctor card | Shows full name, specialization, short bio |
| Selected card | Blue border/accent and `aria-selected="true"` |
| Empty state | `No doctors available` |

### `SlotPicker`

Contains date selection and slot buttons.

| Element | Behavior |
|---|---|
| Calendar | Disables past dates and clinic holidays if holiday data is available |
| Slot group | Slots grouped by morning/afternoon/evening using clinic timezone |
| Slot button | Shows localized time range, selectable by keyboard |
| Empty state | Shows `No available slots for this date` and link/button to `/waitlist?doctorId=<id>` |

### `BookingSummary`

Shows selected doctor, date, slot, timezone note, and `Confirm Booking` button. The button is disabled until doctor and slot are selected.

### `ConfirmationModal`

Confirms details before booking. It must show doctor, date, time, cancellation note, and a submit button.

---

## 7. Hooks and API Layer

```typescript
// features/booking/api/appointments-api.ts
export async function getDoctors(): Promise<DoctorDirectoryItemDTO[]>;
export async function getAvailableSlots(params: {
  doctorId: string;
  from: string;
  to: string;
}): Promise<AvailableSlotDTO[]>;
export async function bookAppointment(payload: CreateAppointmentDTO): Promise<AppointmentDTO>;
```

```typescript
export function useDoctors() {
  return useQuery({
    queryKey: ['doctors'],
    queryFn: getDoctors,
    staleTime: 5 * 60_000,
  });
}

export function useAvailableSlots(doctorId: string | null, selectedDate: string) {
  const { from, to } = getDayBounds(selectedDate);
  return useQuery({
    queryKey: ['slots', doctorId, { from, to }],
    queryFn: () => getAvailableSlots({ doctorId: doctorId!, from, to }),
    enabled: !!doctorId && !!selectedDate,
  });
}
```

`bookAppointment` must include `Idempotency-Key`. Generate it once when the confirmation dialog opens and keep it stable while the mutation is pending.

---

## 8. Error Handling

| Scenario | UI |
|---|---|
| Doctors query fails | Error alert in doctor card with Retry button |
| Slots query fails | Error alert in slot card with Retry button |
| Slot conflict `409` | Toast `That slot was just taken. Please choose another time.` and invalidate slots |
| Validation `400` | Show server message in confirmation dialog |
| Auth `401` | Axios interceptor handles refresh or redirects to `/login` |
| Network error | Toast generic error and keep selections intact |

---

## 9. Loading States

- Doctor directory loading: skeleton doctor cards.
- Slots loading: skeleton slot grid.
- Confirm mutation pending: disable dialog buttons and show spinner in submit button.
- After success: do not clear state manually; redirect to `/appointments` after toast.

---

## 10. Routing

```tsx
{
  path: '/book',
  element: (
    <ProtectedRoute roles={['PATIENT']}>
      <PatientLayout>
        <BookingPage />
      </PatientLayout>
    </ProtectedRoute>
  ),
}
```

The page accepts optional query params:

| Param | Purpose |
|---|---|
| `doctorId` | Preselect doctor, used from waitlist empty-state links |
| `date` | Preselect date as `YYYY-MM-DD` if not in the past |

---

## 11. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "booking": {
    "title": "Book an Appointment",
    "subtitle": "Choose a doctor and available time that works for you.",
    "steps": {
      "doctor": "Doctor",
      "date": "Date",
      "time": "Time",
      "confirm": "Confirm"
    },
    "selectDoctor": "Select Doctor",
    "searchDoctors": "Search doctors",
    "selectDate": "Select Date",
    "availableSlots": "Available Slots",
    "noDoctors": "No doctors available",
    "noSlots": "No available slots for this date",
    "joinWaitlist": "Join waitlist for this doctor",
    "summary": "Appointment Summary",
    "confirmBooking": "Confirm Booking",
    "success": "Appointment booked successfully.",
    "slotTaken": "That slot was just taken. Please choose another time.",
    "timezoneNote": "Times are shown in the clinic timezone."
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "booking": {
    "title": "حجز موعد",
    "subtitle": "اختر الطبيب والوقت المناسبين لك.",
    "steps": {
      "doctor": "الطبيب",
      "date": "التاريخ",
      "time": "الوقت",
      "confirm": "التأكيد"
    },
    "selectDoctor": "اختر الطبيب",
    "searchDoctors": "ابحث عن طبيب",
    "selectDate": "اختر التاريخ",
    "availableSlots": "المواعيد المتاحة",
    "noDoctors": "لا يوجد أطباء متاحون",
    "noSlots": "لا توجد مواعيد متاحة لهذا التاريخ",
    "joinWaitlist": "انضم إلى قائمة الانتظار لهذا الطبيب",
    "summary": "ملخص الموعد",
    "confirmBooking": "تأكيد الحجز",
    "success": "تم حجز الموعد بنجاح.",
    "slotTaken": "تم حجز هذا الموعد للتو. يرجى اختيار وقت آخر.",
    "timezoneNote": "تظهر الأوقات حسب المنطقة الزمنية للعيادة."
  }
}
```

---

## 12. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/doctors` | Load public doctor directory |
| GET | `/appointments/slots?doctorId=&from=&to=` | Load available slots |
| POST | `/appointments` | Create appointment |

---

## 13. Accessibility

- Stepper has `aria-label="Booking steps"`.
- Doctor cards are buttons or radio options with visible focus states.
- Slot grid uses buttons with `aria-pressed` for selected slot.
- Confirmation dialog traps focus and returns focus to `Confirm Booking` after close.
- Error alerts use `role="alert"`; success toast uses `role="status"`.
- Calendar and slot controls are usable by keyboard.

---

## 14. Acceptance Criteria

- [ ] Patient can load `/book`; non-patient roles are redirected to `/403`.
- [ ] Doctors are fetched from `GET /doctors` and displayed as selectable cards.
- [ ] Selecting a doctor and date fetches slots from `GET /appointments/slots`.
- [ ] Past dates and past same-day slots cannot be selected.
- [ ] Empty slot state offers a link to join the waitlist for the selected doctor.
- [ ] Confirming a valid slot sends `POST /appointments` with `Idempotency-Key`.
- [ ] On success, appointment queries are invalidated and user is redirected to `/appointments`.
- [ ] `409` conflict refreshes slots and asks the patient to choose another slot.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
