# Spec: Follow-Up Scheduling UI

**Routes**: `/doctor/queue`, `/staff/queue`  
**Feature**: Follow-up scheduling from completed appointments  
**Auth**: DOCTOR, RECEPTIONIST, ADMIN  
**Files**:
- `frontend/src/features/follow-ups/...`
- `frontend/src/features/queue/pages/DoctorQueuePage.tsx`
- `frontend/src/features/queue/pages/StaffQueuePage.tsx`

---

## 1. Purpose

Allows staff to schedule a future follow-up directly from a completed source appointment without leaving the queue view. The UI must reserve the target slot immediately through the backend follow-up API and never rely on temporary client-side holds.

---

## 2. Entry Points

The follow-up action is available only from completed appointments in the queue views.

| Page | Entry point | Visibility |
|---|---|---|
| `/doctor/queue` | `Schedule follow-up` button in completed appointment cards | Only for `COMPLETED` rows |
| `/staff/queue` | `Schedule follow-up` button in completed queue items | Only for `COMPLETED` rows |

The action opens a shared `FollowUpScheduleDialog`.

---

## 3. User Experience

1. User clicks `Schedule follow-up` on a completed source appointment.
2. Dialog opens with source patient and doctor displayed read-only.
3. User selects a future date and then a slot.
4. User enters a required reason and optional notes.
5. User submits the form.
6. UI sends `POST /api/follow-ups` with an `Idempotency-Key` header.
7. On success, dialog closes, queue data refreshes, and a success toast appears.

If the chosen slot is taken, the dialog stays open, clears the selected slot, refreshes available slots, and shows a localized conflict message.

---

## 4. Layout

The dialog is a centered modal on desktop and a full-width sheet-style dialog on mobile.

- Header: title, short description, close button.
- Source summary: patient name, doctor name, source appointment time.
- Slot picker: date control and grouped available slots.
- Form fields: reason and optional notes.
- Footer: cancel and submit actions.

Use shadcn `Dialog`, `Card`, `Button`, `Input`, `Textarea`, `Badge`, `Skeleton`, `Alert`, and `Calendar` primitives.

---

## 5. Visibility Rules

| Appointment status | Show action? | Reason |
|---|---:|---|
| `PENDING` | No | Not treated |
| `CONFIRMED` | No | Not completed |
| `IN_PROGRESS` | No | Active session only |
| `COMPLETED` | Yes | Valid source state |
| `NO_SHOW` | No | No completed treatment |
| `CANCELED` | No | Invalid source |

The UI must never expose the action for non-completed appointments, even if the backend data includes them.

---

## 6. Data Contract

Source appointments must provide stable IDs and display fields.

```typescript
interface FollowUpSourceAppointment {
  id: string;
  patientId: string;
  doctorId: string;
  startsAt: string;
  endsAt: string;
  status: 'COMPLETED';
  patientName: string;
  doctorName: string;
}
```

Backend follow-up response shape:

```typescript
export type FollowUpStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELED' | 'MISSED';

export interface FollowUpResponse {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  appointmentId: string;
  sourceAppointmentId: string | null;
  followUpAt: string;
  followUpEndsAt: string;
  reason: string;
  notes: string | null;
  status: FollowUpStatus;
  scheduledById: string;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}
```

Create request:

```typescript
export interface CreateFollowUpRequest {
  patientId: string;
  doctorId: string;
  startsAt: string;
  reason: string;
  notes?: string;
  sourceAppointmentId?: string;
}
```

---

## 7. Form Rules

Use React Hook Form + Zod.

```typescript
export const followUpScheduleSchema = z.object({
  patientId: z.string().min(1, 'followUps.errors.patientRequired'),
  doctorId: z.string().min(1, 'followUps.errors.doctorRequired'),
  startsAt: z.string().min(1, 'followUps.errors.slotRequired'),
  reason: z.string().trim().min(1, 'followUps.errors.reasonRequired').max(500, 'followUps.errors.reasonTooLong'),
  notes: z.string().trim().max(2000, 'followUps.errors.notesTooLong').optional(),
  sourceAppointmentId: z.string().optional(),
});
```

Frontend validation must require:

- selected patient
- selected doctor
- selected future slot
- non-empty reason

Notes are optional and trimmed.

---

## 8. Slot Selection

Slots are loaded from `GET /api/appointments/slots` for the source appointment doctor and selected date range.

Rules:

- show only future slots in the clinic timezone
- group slots into morning, afternoon, and evening
- keep the currently selected slot highlighted
- show an empty state when no slots exist
- never recompute the slot timestamp in local browser time

If the selected date changes, clear the selected slot and reload availability.

---

## 9. API Integration

The raw API function must unwrap the success envelope and must not show toasts or mutate UI state.

```typescript
export async function createFollowUp(payload: CreateFollowUpRequest, idempotencyKey: string): Promise<FollowUpResponse> {
  const response = await api.post<{ statusCode: number; data: FollowUpResponse }>(
    '/follow-ups',
    payload,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );

  return response.data.data;
}
```

Backend rules to honor:

- `POST /api/follow-ups` requires bearer auth
- roles allowed: `ADMIN`, `RECEPTIONIST`, `DOCTOR`
- `Idempotency-Key` must be UUIDv4
- `startsAt` must be a future ISO 8601 UTC string
- `sourceAppointmentId` must match the same patient and doctor when provided

Expected responses:

| Status | Meaning |
|---|---|
| `201` | Follow-up created |
| `400` | Invalid payload, missing idempotency key, past time, empty reason |
| `403` | Role or ownership violation |
| `404` | Patient, doctor, or source appointment not found |
| `409` | Slot occupied or duplicate active reservation |

---

## 10. React Query Rules

On success, invalidate:

- `doctorQueueKeys.all`
- `queueKeys.all`
- `bookingKeys.all`
- `staffAppointmentsKeys.all`
- `adminDashboardKeys.root`
- `followUpKeys.all`

On `409`:

- invalidate the selected doctor's slot query for the selected date
- keep the dialog open
- preserve reason and notes

---

## 11. Component Breakdown

### `FollowUpScheduleDialog`

Dialog shell, source summary, form, submit state, and error handling.

### `FollowUpSlotPicker`

Renders available slots grouped by clinic-local time periods.

### `FollowUpSourceSummary`

Shows read-only patient, doctor, and source appointment details.

### `Schedule follow-up` action

Opens the shared dialog from queue cards/items.

---

## 12. Error Handling

| Scenario | UI |
|---|---|
| Slots query fails | Inline error state with retry |
| Submit `400` | Show backend message in dialog |
| Submit `403` | Toast permission message and keep dialog open |
| Submit `404` | Toast not-found message and close or refresh queue |
| Submit `409` | Clear selected slot, refresh slots, keep dialog open |
| Network error | Preserve form data and show retryable error |

---

## 13. Loading States

- Initial open: show dialog skeletons while slots load.
- Date change: keep previous slots visible while refetching if possible.
- Submit pending: disable inputs and show spinner on submit button.
- After success: close dialog after toast and queue refresh.

---

## 14. Routing / Integration

The feature is embedded in queue pages, not a standalone route.

```tsx
<ScheduleFollowUpButton appointment={appointment} onOpen={openFollowUpDialog} />
<FollowUpScheduleDialog />
```

The queue pages pass the selected completed appointment into the shared dialog.

---

## 15. i18n Keys

Add `followUps` keys to `i18n/en.json` and `i18n/ar.json`.

```json
{
  "followUps": {
    "action": "Schedule follow-up",
    "title": "Schedule follow-up",
    "description": "Reserve a future appointment for this patient.",
    "patient": "Patient",
    "doctor": "Doctor",
    "sourceAppointment": "Source appointment",
    "date": "Date",
    "slot": "Available slot",
    "reason": "Reason",
    "notes": "Notes",
    "submit": "Schedule follow-up",
    "success": "Follow-up scheduled.",
    "conflict": "This slot is no longer available. Please choose another time.",
    "emptySlots": "No available follow-up slots for this date.",
    "errors": {
      "patientRequired": "Patient is required.",
      "doctorRequired": "Doctor is required.",
      "slotRequired": "Choose a follow-up slot.",
      "reasonRequired": "Reason is required.",
      "reasonTooLong": "Reason must be 500 characters or fewer.",
      "notesTooLong": "Notes must be 2,000 characters or fewer."
    }
  }
}
```

---

## 16. Accessibility

- Dialog traps focus and restores focus to the triggering button.
- Slot buttons are keyboard reachable and use `aria-pressed` for the selected state.
- Validation errors are announced with `role="alert"`.
- Success and conflict messages use `aria-live="polite"`.
- Read-only source details are presented as text, not disabled inputs.

---

## 17. Acceptance Criteria

- [ ] Only `COMPLETED` appointments show `Schedule follow-up`.
- [ ] Dialog opens with patient and doctor locked from the source appointment.
- [ ] Slots load from `GET /api/appointments/slots` and exclude past times.
- [ ] Submitting sends `POST /api/follow-ups` with `Idempotency-Key`.
- [ ] Success invalidates queue and follow-up related caches.
- [ ] `409` refreshes slot availability and keeps the dialog recoverable.
- [ ] Form validation blocks missing slot or missing reason.
- [ ] Arabic strings and RTL layout work correctly.
- [ ] No TypeScript errors; `pnpm build` succeeds.
