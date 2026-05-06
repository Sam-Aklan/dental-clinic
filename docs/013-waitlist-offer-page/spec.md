# Spec: Waitlist Offer Page

**Route**: `/offers/:offerId`  
**Component**: `WaitlistOfferPage`  
**Auth**: PATIENT only  
**File**: `frontend/src/features/waitlist/pages/WaitlistOfferPage.tsx`

---

## 1. Purpose

Allows a patient to accept or decline a pending waitlist offer sent by email. Accepting the offer atomically creates or moves the appointment as defined by the backend and removes the waitlist entry. Declining leaves the patient flow cleanly and returns them to their waitlist or appointments page.

---

## 2. Entry Context

Patients normally arrive from an email link. The route requires an authenticated patient session.

| User state | Behavior |
|---|---|
| Not logged in | `ProtectedRoute` redirects to `/login?redirect=/offers/:offerId` |
| Logged in as non-patient | Redirect to `/403` |
| Logged in as offer owner | Load and display offer |
| Logged in as different patient | Backend returns `403`; show forbidden-style error |

---

## 3. Layout

Uses `PatientLayout` when authenticated. The page is a single centered offer card.

```
┌─────────────────────────────────────────────────────────────────┐
│  [PatientLayout sidebar/header]                                  │
│                                                                   │
│                 ┌────────────────────────────────┐                │
│                 │ Earlier Appointment Available  │                │
│                 │                                │                │
│                 │ Dr. Ahmad Al-Rashid            │                │
│                 │ Tue, May 5, 2026               │                │
│                 │ 10:30 AM - 11:00 AM            │                │
│                 │                                │                │
│                 │ Offer expires in 08:42         │                │
│                 │                                │                │
│                 │ [Decline] [Accept Offer]       │                │
│                 └────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

- Center card max width: `560px`.
- The countdown is visually prominent but not the only way to understand state.
- Use shadcn `Card`, `Button`, `Alert`, `Dialog`, and `Progress` primitives.

---

## 4. Data Model

```typescript
interface WaitlistOfferDTO {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expiresAt: string;
  offeredSlot: {
    startsAt: string;
    endsAt: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
  currentAppointment?: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: AppointmentStatus;
  } | null;
}
```

If `currentAppointment` exists, display a clear comparison between the current appointment and the offered earlier slot.

---

## 5. Page States

| State | UI |
|---|---|
| Loading | Centered skeleton offer card |
| Pending offer | Details, countdown, accept and decline actions |
| Accepted | Success state with link to `/appointments` |
| Declined | Neutral state with link to `/waitlist` |
| Expired | Expired state with link to `/waitlist` |
| Not found `404` | Error state `Offer not found or no longer available` |
| Forbidden `403` | Error state `This offer does not belong to your account` |

---

## 6. Countdown Behavior

The countdown is derived from `expiresAt` and current time.

```typescript
function getOfferTimeRemaining(expiresAt: string) {
  const ms = dayjs(expiresAt).diff(dayjs());
  return Math.max(ms, 0);
}
```

Rules:

| Condition | Behavior |
|---|---|
| Remaining time > 0 | Update countdown every second |
| Remaining time reaches 0 | Disable actions and refetch offer |
| Page hidden | Browser may throttle timer; recompute from `expiresAt` on visibility change |
| Server says expired | Trust server status over local timer |

---

## 7. Accept Flow

1. Patient clicks `Accept Offer`.
2. Open confirmation dialog with doctor, offered slot, and current appointment comparison if present.
3. Submit `POST /waitlist/offers/:offerId/accept`.
4. On success, invalidate appointment and waitlist queries.
5. Show success state and CTA to `/appointments`.

Accept endpoint is idempotent. If a duplicate click returns the accepted state, treat it as success.

---

## 8. Decline Flow

1. Patient clicks `Decline`.
2. Open confirmation dialog with short explanation.
3. Submit `POST /waitlist/offers/:offerId/decline`.
4. On success, invalidate waitlist queries.
5. Show declined state and CTA to `/waitlist`.

Decline endpoint is idempotent. If the offer is already declined, treat it as success.

---

## 9. Components

### `OfferDetailsCard`

Displays doctor, offered date/time, optional current appointment, status, and countdown.

### `OfferCountdown`

Renders a text countdown and optional progress indicator based on `expiresAt`.

### `OfferActionDialog`

Reusable confirmation dialog for accept and decline actions.

| Mode | Primary button | Copy |
|---|---|---|
| Accept | `Accept Offer` | Explains appointment will be updated/created |
| Decline | `Decline Offer` | Explains offer will be released |

---

## 10. Hooks and API Layer

```typescript
// features/waitlist/api/waitlist-api.ts
export async function getWaitlistOffer(offerId: string): Promise<WaitlistOfferDTO>;
export async function acceptWaitlistOffer(offerId: string): Promise<WaitlistOfferDTO>;
export async function declineWaitlistOffer(offerId: string): Promise<WaitlistOfferDTO>;
```

```typescript
export function useWaitlistOffer(offerId: string | undefined) {
  return useQuery({
    queryKey: ['waitlist', 'offers', offerId],
    queryFn: () => getWaitlistOffer(offerId!),
    enabled: !!offerId,
    refetchInterval: data => data?.status === 'PENDING' ? 30_000 : false,
  });
}
```

Mutations invalidate:

```typescript
queryClient.invalidateQueries({ queryKey: ['waitlist'] });
queryClient.invalidateQueries({ queryKey: ['appointments'] });
queryClient.invalidateQueries({ queryKey: ['slots'] });
```

---

## 11. Error Handling

| Scenario | UI |
|---|---|
| Accept expired offer | Toast `This offer has expired.` and refetch offer |
| Accept slot conflict | Toast `This slot is no longer available.` and show expired/unavailable state |
| Decline expired offer | Treat as expired state after refetch |
| Network error | Keep dialog open and show inline error |
| Missing route param | Navigate to `/waitlist` |

---

## 12. Routing

```tsx
{
  path: '/offers/:offerId',
  element: (
    <ProtectedRoute roles={['PATIENT']}>
      <PatientLayout>
        <WaitlistOfferPage />
      </PatientLayout>
    </ProtectedRoute>
  ),
}
```

`ProtectedRoute` must preserve the redirect URL so email links work after login.

---

## 13. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "offers": {
    "title": "Earlier Appointment Available",
    "doctor": "Doctor",
    "offeredTime": "Offered time",
    "currentAppointment": "Current appointment",
    "expiresIn": "Offer expires in {{time}}",
    "expired": "This offer has expired.",
    "accepted": "Offer accepted. Your appointment has been updated.",
    "declined": "Offer declined.",
    "accept": "Accept Offer",
    "decline": "Decline",
    "acceptTitle": "Accept this offer?",
    "acceptDescription": "Your appointment will be updated to the offered time if it is still available.",
    "declineTitle": "Decline this offer?",
    "declineDescription": "The slot may be offered to another patient.",
    "viewAppointments": "View Appointments",
    "backToWaitlist": "Back to Waitlist",
    "notFound": "Offer not found or no longer available.",
    "forbidden": "This offer does not belong to your account.",
    "slotUnavailable": "This slot is no longer available."
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "offers": {
    "title": "موعد أبكر متاح",
    "doctor": "الطبيب",
    "offeredTime": "الوقت المعروض",
    "currentAppointment": "الموعد الحالي",
    "expiresIn": "ينتهي العرض خلال {{time}}",
    "expired": "انتهت صلاحية هذا العرض.",
    "accepted": "تم قبول العرض. تم تحديث موعدك.",
    "declined": "تم رفض العرض.",
    "accept": "قبول العرض",
    "decline": "رفض",
    "acceptTitle": "قبول هذا العرض؟",
    "acceptDescription": "سيتم تحديث موعدك إلى الوقت المعروض إذا كان لا يزال متاحاً.",
    "declineTitle": "رفض هذا العرض؟",
    "declineDescription": "قد يتم عرض الموعد على مريض آخر.",
    "viewAppointments": "عرض المواعيد",
    "backToWaitlist": "العودة إلى قائمة الانتظار",
    "notFound": "لم يتم العثور على العرض أو لم يعد متاحاً.",
    "forbidden": "هذا العرض لا يخص حسابك.",
    "slotUnavailable": "هذا الموعد لم يعد متاحاً."
  }
}
```

---

## 14. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/waitlist/offers/:offerId` | Load offer details |
| POST | `/waitlist/offers/:offerId/accept` | Accept offer |
| POST | `/waitlist/offers/:offerId/decline` | Decline offer |

---

## 15. Accessibility

- Countdown text is announced politely, not every second. Use `aria-live="polite"` only for major state changes like expired.
- Accept and decline dialogs have clear titles and descriptions.
- Status states use text and icons/colors; never color alone.
- Action buttons remain keyboard accessible and have visible focus styles.
- Loading skeleton does not trap focus.

---

## 16. Acceptance Criteria

- [ ] Email link route is protected and preserves redirect through login.
- [ ] Pending offer loads from `GET /waitlist/offers/:offerId` and shows doctor/time details.
- [ ] Countdown disables actions when it reaches zero and refetches the offer.
- [ ] Accept action confirms, submits, invalidates appointments/waitlist, and shows success state.
- [ ] Decline action confirms, submits, invalidates waitlist, and shows declined state.
- [ ] Expired, accepted, declined, forbidden, and not-found states render clearly.
- [ ] Duplicate/idempotent accept or decline responses are treated as successful terminal states.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
