# Spec: Lobby Queue Page (Public Kiosk View)

**Route**: `/lobby/:doctorId`  
**Component**: `LobbyQueuePage`  
**Auth**: Public — kiosk token obtained from backend, no user login required  
**File**: `frontend/src/features/queue/pages/LobbyQueuePage.tsx`

---

## 1. Purpose

A read-only real-time queue display intended for a TV/monitor in the clinic lobby. Patients in the waiting room can see whose appointment is currently in progress and who is next. The page is public but uses a signed kiosk token (issued by the backend for a specific doctor) to authenticate the Socket.IO connection.

---

## 2. Layout

Full-screen display layout — designed for a landscape TV/monitor (no sidebar, no header nav). The page should fill the entire viewport with large readable text.

```
┌──────────────────────────────────────────────────────────────────┐
│  🦷 Dental Clinic        Dr. Ahmad Al-Rashid        [EN | AR]    │
│  ──────────────────────────────────────────────────────────────  │
│                                                                    │
│  NOW IN PROGRESS                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  👤  Patient #3  ·  Started 10:14 AM  ·  🟢 IN PROGRESS   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  NEXT UP                                                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  👤  Patient #4  ·  Scheduled 10:30 AM                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  WAITING (3)                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Patient #5  │  │  Patient #6  │  │  Patient #7  │           │
│  │  10:45 AM    │  │  11:00 AM    │  │  11:15 AM    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                    │
│  ──────────────────────────────────────────────────────────────  │
│  🕐 Last updated: 10:14:32 AM             Powered by Clinic App  │
└──────────────────────────────────────────────────────────────────┘
```

**Privacy**: Patient names are never shown. Patients are identified only by a sequential position number (e.g. `Patient #3`) derived from their position in today's queue, not their real name or ID.

---

## 3. Data Model

The page displays today's appointments for the given doctor, ordered by `startsAt`:

| Status | Display Section |
|---|---|
| `IN_PROGRESS` | "Now in Progress" (only one at a time) |
| `CONFIRMED` (earliest) | "Next Up" |
| `CONFIRMED` (remaining) | "Waiting" list |
| `PENDING` | Shown in Waiting list with a muted style |
| `COMPLETED` / `CANCELED` / `NO_SHOW` | Not shown |

---

## 4. Kiosk Token Flow

The page must authenticate the Socket.IO connection without requiring a user login.

1. On mount, call `GET /queue/kiosk-token/:doctorId` (public endpoint, no auth header).
   - Returns `{ data: { kioskToken: "<signed_jwt>" } }`.
2. Store the token in component state (not `localStorage` — it's session-scoped to this tab).
3. Connect to the Socket.IO `/queue` namespace with `auth: { token: kioskToken }`.
4. Subscribe to room `doctor:<doctorId>` via `queue.subscribe` event.
5. Listen for `queue.updated` events to refresh the displayed list.

On reconnect (Socket.IO auto-reconnect), re-send the subscribe event.

---

## 5. Real-Time Updates

```typescript
// features/queue/hooks/useLobbyQueue.ts
export function useLobbyQueue(doctorId: string, kioskToken: string) {
  const [queue, setQueue] = useState<LobbyQueueEntry[]>([]);

  useEffect(() => {
    const socket = io(`${API_URL}/queue`, {
      auth: { token: kioskToken },
      reconnection: true,
    });

    socket.on('connect', () => {
      socket.emit('queue.subscribe', { doctorId });
    });

    socket.on('queue.updated', (data: LobbyQueueEntry[]) => {
      setQueue(data);
    });

    return () => { socket.disconnect(); };
  }, [doctorId, kioskToken]);

  return queue;
}
```

**Initial load**: On subscribing, the server should emit the current queue state immediately (the backend gateway does this on `queue.subscribe`). If not, fall back to `GET /appointments?doctorId=<id>&date=today&status=CONFIRMED,IN_PROGRESS,PENDING`.

---

## 6. Privacy & Display Rules

- **No real patient names**: display `"Patient #N"` where N is the sequential position in today's full appointment list (including completed ones, so the number doesn't change mid-day).
- No patient IDs, no appointment IDs in the UI.
- `startsAt` time shown (scheduled start time) — not the patient's personal info.
- "Started at" for the in-progress appointment uses the time the appointment transitioned to `IN_PROGRESS` (if available) or `startsAt`.

---

## 7. Sections Detail

### 7.1 Header Bar

- Left: clinic logo + name (small).
- Center: `"Dr. <doctorName>"`.
- Right: `LanguageSwitcher` + current time (updated every second via `setInterval`).

### 7.2 "Now in Progress" Card

- Full-width card with a green left border or green background accent.
- Large text: `"Patient #N"`.
- Subtitle: `"Started <time>"` or `"Scheduled <time>"` (whichever is available).
- Status badge: `"IN PROGRESS"` (green).
- If no appointment is currently in progress: `"No patient in session"` placeholder.

### 7.3 "Next Up" Card

- Slightly smaller than the In-Progress card. Blue accent.
- `"Patient #N"` + `"Scheduled <time>"`.
- If no next appointment: `"No upcoming appointments"` placeholder.

### 7.4 "Waiting" Grid

- 3-column grid of compact cards (2-col on smaller screens).
- Each card: `"Patient #N"` + scheduled time.
- If queue is empty: `"No patients waiting"`.
- Max 8 cards visible; if more, show `"+ N more"` at the end.

### 7.5 Footer Bar

- Left: `"🕐 Last updated: <HH:MM:SS>"` — updates on each `queue.updated` event.
- Right: `"Powered by Dental Clinic"` (branding).

---

## 8. Loading & Error States

| State | UI |
|---|---|
| Fetching kiosk token | Full-screen spinner with `"Loading…"` |
| Kiosk token fetch failed (404 = unknown doctor) | Full-screen error: `"Doctor not found"` |
| Socket disconnected | Amber banner at top: `"Connection lost. Reconnecting…"` — queue data stays visible |
| Socket reconnected | Banner disappears |
| No appointments today | All sections show their empty-state placeholders |

---

## 9. Auto-Refresh Fallback

If the Socket.IO connection is unavailable for > 30 seconds:
- Start polling `GET /appointments?doctorId=<id>&date=today` every 15 seconds as a fallback.
- Stop polling once the socket reconnects.

---

## 10. Component Tree

```
LobbyQueuePage
├── [Loading state] FullScreenSpinner
├── [Error state] FullScreenError
└── [Ready state]
    ├── LobbyHeader
    │   ├── ClinicLogo
    │   ├── DoctorName
    │   └── RightControls (LanguageSwitcher + LiveClock)
    ├── ConnectionBanner (amber — only when disconnected)
    ├── InProgressCard
    ├── NextUpCard
    ├── WaitingGrid
    │   └── WaitingCard (× up to 8)
    └── LobbyFooter (last updated + branding)
```

---

## 11. File Layout

```
frontend/src/features/queue/
├── pages/
│   └── LobbyQueuePage.tsx
├── components/
│   ├── LobbyHeader.tsx
│   ├── InProgressCard.tsx
│   ├── NextUpCard.tsx
│   ├── WaitingGrid.tsx
│   ├── WaitingCard.tsx
│   ├── ConnectionBanner.tsx
│   └── LobbyFooter.tsx
├── hooks/
│   ├── useLobbyQueue.ts         # Socket.IO subscription
│   └── useKioskToken.ts         # GET /queue/kiosk-token/:doctorId
└── api/
    └── queue-api.ts             # getKioskToken(doctorId), getQueueSnapshot(doctorId)
```

---

## 12. Routing

```tsx
{ path: '/lobby/:doctorId', element: <LobbyQueuePage /> }
```

No layout wrapper — `LobbyQueuePage` is fullscreen and owns its own header/footer.

---

## 13. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "lobby": {
    "loading": "Loading queue…",
    "doctorNotFound": "Doctor not found",
    "connectionLost": "Connection lost. Reconnecting…",
    "nowInProgress": "Now in Progress",
    "noPatientInSession": "No patient in session",
    "nextUp": "Next Up",
    "noUpcoming": "No upcoming appointments",
    "waiting": "Waiting",
    "noWaiting": "No patients waiting",
    "morePatients": "+ {{count}} more",
    "patient": "Patient #{{number}}",
    "scheduled": "Scheduled {{time}}",
    "started": "Started {{time}}",
    "lastUpdated": "Last updated: {{time}}",
    "poweredBy": "Powered by Dental Clinic"
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "lobby": {
    "loading": "جارٍ تحميل الطابور…",
    "doctorNotFound": "الطبيب غير موجود",
    "connectionLost": "انقطع الاتصال. جارٍ إعادة الاتصال…",
    "nowInProgress": "جلسة حالية",
    "noPatientInSession": "لا يوجد مريض في الجلسة حالياً",
    "nextUp": "التالي",
    "noUpcoming": "لا توجد مواعيد قادمة",
    "waiting": "في الانتظار",
    "noWaiting": "لا يوجد مرضى في الانتظار",
    "morePatients": "+ {{count}} آخرون",
    "patient": "مريض #{{number}}",
    "scheduled": "موعد {{time}}",
    "started": "بدأت {{time}}",
    "lastUpdated": "آخر تحديث: {{time}}",
    "poweredBy": "مدعوم من عيادة الأسنان"
  }
}
```

---

## 14. Styling Notes

- Font sizes larger than the rest of the app — this is a TV display:
  - Section headings: `text-3xl font-bold`
  - Patient label in In-Progress card: `text-5xl font-black`
  - Patient label in Next-Up card: `text-3xl font-bold`
  - Waiting cards: `text-xl`
- In-Progress card: `border-l-8 border-green-500 bg-green-50` (LTR); `border-r-8` in RTL.
- Next-Up card: `border-l-8 border-blue-500 bg-blue-50`.
- Waiting cards: `border border-border bg-card`.
- Disconnected banner: `bg-amber-100 text-amber-800 border-b border-amber-300`.
- Full-screen layout: `min-h-screen flex flex-col`.
- Never show a scrollbar — all content must fit in a single viewport page; use `overflow-hidden`.

---

## 15. Accessibility

- Large text is inherently accessible for a display screen.
- `aria-live="polite"` on the queue sections so screen readers (if any) announce updates.
- Connection banner has `role="alert"`.
- Language switcher label says `"Select language"`.

---

## 16. Acceptance Criteria

- [ ] Page loads without authentication; kiosk token is fetched and used for Socket.IO.
- [ ] `IN_PROGRESS` appointment shown in "Now in Progress" section with green accent.
- [ ] Earliest `CONFIRMED` appointment shown in "Next Up" with blue accent.
- [ ] Remaining `CONFIRMED`/`PENDING` appointments shown in "Waiting" grid.
- [ ] Patient names never appear; only `"Patient #N"` sequential numbers.
- [ ] When a status changes (via doctor queue page), lobby updates within 1 second.
- [ ] Disconnected state shows amber banner; banner disappears on reconnect.
- [ ] Queue data remains visible while disconnected.
- [ ] Unknown `doctorId` shows full-screen error.
- [ ] Clock in header updates every second.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] Page fills the full viewport with no scrollbar.
- [ ] No TypeScript errors; `pnpm build` succeeds.
