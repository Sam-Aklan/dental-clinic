# Spec: My Waitlist Page

**Route**: `/waitlist`  
**Component**: `MyWaitlistPage`  
**Auth**: PATIENT only  
**File**: `frontend/src/features/waitlist/pages/MyWaitlistPage.tsx`

---

## 1. Purpose

Allows a patient to view active waitlist entries, join a doctor's waitlist, edit their availability window, and leave the waitlist. Waitlist entries help the clinic offer earlier appointments when slots open.

---

## 2. Layout

Uses `PatientLayout`. The page contains an active entries list and a join/edit form.

```
┌─────────────────────────────────────────────────────────────────┐
│  [PatientLayout sidebar/header]                                  │
│                                                                   │
│  My Waitlist                                      [Join Waitlist] │
│  Get notified when an earlier slot becomes available.             │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Dr. Ahmad Al-Rashid                         Position #3     │  │
│  │ Available: 09:00 - 13:00                                    │  │
│  │ Joined: Apr 30, 2026                    [Edit] [Leave]      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Join a Waitlist                                             │  │
│  │ Doctor [Select doctor ▼]                                    │  │
│  │ Available from [09:00] until [13:00]                         │  │
│  │                                     [Join Waitlist]          │  │
│  └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

- Desktop: entries list and join form can sit in a two-column layout.
- Mobile: entries first, join form below.
- If `doctorId` query param is present, preselect that doctor in the join form.

---

## 3. User Flow

1. Load active waitlist entries with `GET /waitlist`.
2. Load public doctors with `GET /doctors` for the join form.
3. Patient selects a doctor and optional availability window.
4. Submit `POST /waitlist`.
5. On success, invalidate `['waitlist', 'mine']` and reset join form.
6. Patient can edit availability via `PATCH /waitlist/:id`.
7. Patient can leave via `DELETE /waitlist/:id` after confirmation.

---

## 4. Data Models

```typescript
interface WaitlistEntryDTO {
  id: string;
  doctorId: string;
  patientId: string;
  position: number;
  availableFrom: string | null;   // HH:mm
  availableUntil: string | null;  // HH:mm
  createdAt: string;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
}

interface JoinWaitlistDTO {
  doctorId: string;
  availableFrom?: string | null;
  availableUntil?: string | null;
}

interface UpdateWaitlistWindowDTO {
  availableFrom?: string | null;
  availableUntil?: string | null;
}
```

---

## 5. Availability Window Validation

The window is optional. If either time is provided, both must be provided.

```typescript
const availabilityWindowSchema = z.object({
  doctorId: z.string().min(1, 'waitlist.errors.doctorRequired'),
  availableFrom: z.string().optional().nullable(),
  availableUntil: z.string().optional().nullable(),
}).superRefine((value, ctx) => {
  const hasFrom = !!value.availableFrom;
  const hasUntil = !!value.availableUntil;

  if (hasFrom !== hasUntil) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['availableUntil'], message: 'waitlist.errors.windowIncomplete' });
  }

  if (hasFrom && hasUntil && value.availableFrom! >= value.availableUntil!) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['availableUntil'], message: 'waitlist.errors.windowInvalid' });
  }
});
```

Use `HH:mm` 24-hour values in form state and API payloads. Display localized 12-hour or 24-hour strings based on locale.

---

## 6. Components

### `WaitlistEntryCard`

Displays a single waitlist entry.

| Element | Behavior |
|---|---|
| Doctor name | `Dr. First Last` |
| Position | `Position #N`, shown only if backend returns it |
| Availability | Shows window or `Any available time` |
| Joined date | Relative or formatted date |
| Actions | `Edit availability`, `Leave waitlist` |

### `AvailabilityWindowForm`

Reusable for join and edit flows.

| Field | Type | Required | Notes |
|---|---|---|---|
| `doctorId` | select | Yes for join | Disabled/hidden in edit mode |
| `availableFrom` | time | No | Required if `availableUntil` is set |
| `availableUntil` | time | No | Must be after `availableFrom` |

### `LeaveWaitlistDialog`

Confirmation dialog to prevent accidental removal.

---

## 7. Duplicate Entry Handling

The backend allows one waitlist entry per patient/doctor pair. The frontend should prevent duplicate joins by disabling doctors already present in the active entries list.

If the backend still returns a duplicate/conflict error:

| Error | UI |
|---|---|
| `409` duplicate entry | Inline form error `You are already on this doctor's waitlist.` |

---

## 8. Hooks and API Layer

```typescript
// features/waitlist/api/waitlist-api.ts
export async function getMyWaitlist(): Promise<WaitlistEntryDTO[]>;
export async function joinWaitlist(payload: JoinWaitlistDTO): Promise<WaitlistEntryDTO>;
export async function updateWaitlistWindow(id: string, payload: UpdateWaitlistWindowDTO): Promise<WaitlistEntryDTO>;
export async function leaveWaitlist(id: string): Promise<void>;
```

```typescript
export function useWaitlist() {
  return useQuery({
    queryKey: ['waitlist', 'mine'],
    queryFn: getMyWaitlist,
  });
}

export function useJoinWaitlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: joinWaitlist,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waitlist', 'mine'] }),
  });
}
```

---

## 9. Loading and Error States

| State | UI |
|---|---|
| Entries loading | Skeleton waitlist cards |
| Doctors loading | Disabled doctor select with skeleton text |
| Entries empty | Empty state explaining waitlist value with join form visible |
| Entries query error | Error alert with Retry button |
| Join/update pending | Disable affected form and show spinner |
| Leave pending | Disable dialog actions and show spinner |

---

## 10. Routing

```tsx
{
  path: '/waitlist',
  element: (
    <ProtectedRoute roles={['PATIENT']}>
      <PatientLayout>
        <MyWaitlistPage />
      </PatientLayout>
    </ProtectedRoute>
  ),
}
```

Supported query params:

| Param | Purpose |
|---|---|
| `doctorId` | Preselect doctor when arriving from `/book` empty slot state |

---

## 11. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "waitlist": {
    "title": "My Waitlist",
    "subtitle": "Get notified when an earlier slot becomes available.",
    "join": "Join Waitlist",
    "joinTitle": "Join a Waitlist",
    "doctor": "Doctor",
    "availableFrom": "Available from",
    "availableUntil": "Available until",
    "anyTime": "Any available time",
    "position": "Position #{{position}}",
    "joined": "Joined {{date}}",
    "editAvailability": "Edit availability",
    "leave": "Leave waitlist",
    "leaveTitle": "Leave waitlist?",
    "leaveDescription": "You will stop receiving offers for this doctor.",
    "joinSuccess": "You joined the waitlist.",
    "updateSuccess": "Availability updated.",
    "leaveSuccess": "You left the waitlist.",
    "alreadyJoined": "You are already on this doctor's waitlist.",
    "empty": "You are not on any waitlists yet.",
    "errors": {
      "doctorRequired": "Please select a doctor",
      "windowIncomplete": "Select both start and end times, or leave both empty",
      "windowInvalid": "End time must be after start time"
    }
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "waitlist": {
    "title": "قائمة الانتظار الخاصة بي",
    "subtitle": "احصل على إشعار عند توفر موعد أبكر.",
    "join": "الانضمام إلى قائمة الانتظار",
    "joinTitle": "الانضمام إلى قائمة انتظار",
    "doctor": "الطبيب",
    "availableFrom": "متاح من",
    "availableUntil": "متاح حتى",
    "anyTime": "أي وقت متاح",
    "position": "المركز #{{position}}",
    "joined": "تم الانضمام في {{date}}",
    "editAvailability": "تعديل الأوقات المتاحة",
    "leave": "مغادرة قائمة الانتظار",
    "leaveTitle": "مغادرة قائمة الانتظار؟",
    "leaveDescription": "ستتوقف عن تلقي العروض لهذا الطبيب.",
    "joinSuccess": "تم انضمامك إلى قائمة الانتظار.",
    "updateSuccess": "تم تحديث الأوقات المتاحة.",
    "leaveSuccess": "تمت مغادرة قائمة الانتظار.",
    "alreadyJoined": "أنت موجود بالفعل في قائمة انتظار هذا الطبيب.",
    "empty": "لست في أي قائمة انتظار حالياً.",
    "errors": {
      "doctorRequired": "يرجى اختيار طبيب",
      "windowIncomplete": "اختر وقت البداية والنهاية معاً أو اتركهما فارغين",
      "windowInvalid": "يجب أن يكون وقت النهاية بعد وقت البداية"
    }
  }
}
```

---

## 12. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/waitlist` | Load current patient's entries |
| POST | `/waitlist` | Join doctor's waitlist |
| PATCH | `/waitlist/:id` | Edit availability window |
| DELETE | `/waitlist/:id` | Leave waitlist |
| GET | `/doctors` | Populate join form doctor select |

---

## 13. Accessibility

- Entry cards expose position and doctor as text, not color alone.
- Time inputs have visible labels and validation messages.
- Leave confirmation dialog has accessible title and description.
- Disabled duplicate doctor options include explanatory text.
- Toasts use `role="status"`; errors use `role="alert"`.

---

## 14. Acceptance Criteria

- [ ] Patient can view active waitlist entries from `GET /waitlist`.
- [ ] Patient can join a doctor's waitlist with no availability window.
- [ ] Patient can join with a valid `HH:mm` availability window.
- [ ] Duplicate doctor entries are disabled in the UI and backend `409` is handled.
- [ ] Patient can edit availability via `PATCH /waitlist/:id`.
- [ ] Patient can leave via `DELETE /waitlist/:id` after confirmation.
- [ ] `doctorId` query param preselects the join form doctor.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
