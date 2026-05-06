# Spec: WaitlistOfferEngineModule (`backend/src/waitlist-offer-engine/`)

**Type**: Backend NestJS Module (BullMQ Processor — no HTTP endpoints)  
**Plan reference**: [BACKEND_PLAN.md — §7 WaitlistOfferEngineModule](../../BACKEND_PLAN.md#7-waitlistofferenginmodule)  
**Frontend specs consumed**: [012-my-waitlist-page](../012-my-waitlist-page/spec.md), [013-waitlist-offer-page](../013-waitlist-offer-page/spec.md)

> **Frontend implementation status**: Frontend specs 012 (My Waitlist Page) and 013 (Waitlist Offer Page) are fully written (✅) but **not yet implemented**. Phase 3 of this spec defines the integration contract those pages depend on from this engine.

---

## Overview

WaitlistOfferEngineModule is a pure background processor — it has no HTTP controller or public endpoints. It reacts to two BullMQ event types:

1. **`slot-opened`** — emitted by `AppointmentsModule` on cancellation and by `DoctorsModule` when a schedule slot is added. The engine walks the waitlist for the affected doctor, finds the highest-priority eligible patient, and creates a `WaitlistOffer`.

2. **`offer-expiry`** — a delayed BullMQ job self-scheduled when an offer is created. On firing, it marks the offer `EXPIRED` and re-enqueues a `slot-opened` job so the next eligible patient is considered.

The engine owns **offer creation** only. Offer acceptance and declination are handled by `WaitlistModule` (see [backend-006 spec](../backend-006-waitlist-module/spec.md)), which then emits further `slot-opened` jobs back into this engine's queue.

---

## Phase 1 — Job Payloads & Validation

### 1.1 File Map

```
backend/src/waitlist-offer-engine/
├── waitlist-offer-engine.module.ts
├── waitlist-offer-engine.service.ts     ← core eligibility logic
└── waitlist-offer.processor.ts          ← BullMQ processor (job handlers)
```

---

### 1.2 BullMQ Queue Names

| Queue constant | Value | Purpose |
|---|---|---|
| `WAITLIST_OFFER_QUEUE` | `'waitlist-offer'` | Job queue owned by this module |

Both job types share this one queue, differentiated by `jobName`.

---

### 1.3 `SlotOpenedJobPayload`

Emitted by `AppointmentsModule` (on cancellation) and by `DoctorsModule` (on schedule slot addition). Processed by `waitlist-offer.processor.ts`.

```typescript
interface SlotOpenedJobPayload {
  doctorId: string;   // UUID of the DoctorProfile
  startsAt: string;   // ISO 8601 UTC — the opened slot's start time
}
```

**Validation rules (applied inside the processor before any DB work)**:

| Field | Rule | Error logged |
|---|---|---|
| `doctorId` | Must be a valid UUID; corresponding `DoctorProfile` must exist | Log `invalid_doctor`, discard job |
| `startsAt` | Must be a valid ISO 8601 string; must be in the future | Log `slot_in_past`, discard job |

Discarded jobs are acknowledged (not failed) to prevent queue poisoning. A structured log entry is always written:
```json
{ "event": "slot_opened.discarded", "reason": "slot_in_past", "doctorId": "...", "startsAt": "..." }
```

---

### 1.4 `OfferExpiryJobPayload`

Self-scheduled by the engine immediately after creating a `WaitlistOffer`. Processed by the same processor.

```typescript
interface OfferExpiryJobPayload {
  offerId: string;     // UUID of the WaitlistOffer
  doctorId: string;    // UUID — needed to re-enqueue slot-opened without a DB read
  startsAt: string;    // ISO 8601 UTC — the slot being offered
}
```

**Scheduling**: `delay = offer.expiresAt.getTime() - Date.now()` (milliseconds).

**Validation rules**:

| Field | Rule | Error logged |
|---|---|---|
| `offerId` | Must be a valid UUID | Log `invalid_offer_id`, discard job |
| Offer status at fire time | If `ACCEPTED` or `DECLINED` by the time the job fires, the offer was handled — skip re-enqueue | Log `offer_already_resolved` |
| Offer status at fire time | If still `PENDING`, mark `EXPIRED` and re-enqueue `slot-opened` | Normal path |

---

### 1.5 Eligibility Algorithm

Called by `WaitlistOfferEngineService.findEligibleEntry(doctorId, startsAt)`.

```
Input: doctorId (UUID), slotStartsAt (UTC DateTime)
Output: WaitlistEntry | null
```

**Step 1 — Fetch candidates**

```sql
SELECT * FROM "WaitlistEntry"
WHERE "doctorId" = :doctorId
ORDER BY position ASC
```

Includes all entries regardless of window. Early exit with `null` if the result is empty.

**Step 2 — For each entry in position order**:

**Check A — Arrival buffer** (from `ClinicConfig.minArrivalMinutes`):
```
now + minArrivalMinutes  ≤  slotStartsAt
```
- If the slot starts too soon for the patient to arrive, skip this entry.
- `now` is the engine's clock at job-processing time (not job-enqueue time).

**Check B — Availability window** (optional per entry):
- If `entry.availableFrom` and `entry.availableUntil` are both set:
  - Convert `slotStartsAt` to the clinic's local time (from `ClinicConfig.timeZone`)
  - Extract `HH:mm` from the local time
  - Check `availableFrom ≤ slotLocalTime < availableUntil` (string comparison, lexicographic, safe because both are `HH:mm` zero-padded)
  - If the slot falls outside the window, skip this entry.
- If `availableFrom` / `availableUntil` are null, any time is acceptable — do not skip.

**Check C — No existing pending offer**:
- If the patient already has a `PENDING` `WaitlistOffer` for this doctor (any slot), skip — do not create a second concurrent offer. This prevents double-offer spam when multiple slots open rapidly.

**Step 3 — Return** the first entry that passes all three checks, or `null` if none do.

---

### 1.6 Offer Creation

Called by `WaitlistOfferEngineService.createOffer(entry, slotStartsAt, slotEndsAt)`.

```typescript
// Derived from ClinicConfig
const slotEndsAt = new Date(slotStartsAt.getTime() + clinicConfig.slotDurationMinutes * 60_000);
const expiresAt  = new Date(Date.now() + clinicConfig.offerWindowMinutes * 60_000);
```

**DB write (single transaction)**:
```sql
INSERT INTO "WaitlistOffer" (
  waitlistEntryId, patientId, doctorId,
  offeredStartsAt, offeredEndsAt,
  status, expiresAt
) VALUES (...)
```

**Post-commit side effects** (executed outside the transaction, after successful commit):
1. Queue `offer-expiry` BullMQ delayed job with `delay = expiresAt - now`.
2. Queue `waitlist-offer` email job via `NotificationsModule.queueWaitlistOfferEmail(patientId, offerId)`.

**Structured log on success**:
```json
{ "event": "offer_created", "offerId": "...", "patientId": "...", "doctorId": "...", "expiresAt": "..." }
```

---

### 1.7 No-Eligible-Patient Path

When `findEligibleEntry()` returns `null`:

```json
{ "event": "no_eligible_patient", "doctorId": "...", "startsAt": "...", "candidates": 3, "skippedByBuffer": 1, "skippedByWindow": 2 }
```

The slot remains open. No offer is created. The job is acknowledged (not re-queued).

---

### 1.8 ClinicConfig Fields Used

| Field | Type | Used for |
|---|---|---|
| `minArrivalMinutes` | `number` | Arrival buffer check |
| `offerWindowMinutes` | `number` | Offer `expiresAt` calculation |
| `slotDurationMinutes` | `number` | Derive `offeredEndsAt` from `startsAt` |
| `timeZone` | `string` (IANA) | Convert slot UTC time to local for window check |

The service reads these once per job via `ClinicConfigService.getConfig()` (cached or lightweight DB read — no HTTP call).

---

### 1.9 Prisma Models Used

```prisma
// Read
model WaitlistEntry {
  id             String           @id @default(uuid())
  patientId      String
  doctorId       String
  position       Int
  availableFrom  String?          // HH:mm
  availableUntil String?          // HH:mm
  offers         WaitlistOffer[]
  @@index([doctorId, position])
}

// Written
model WaitlistOffer {
  id               String              @id @default(uuid())
  waitlistEntryId  String
  patientId        String
  doctorId         String
  offeredStartsAt  DateTime
  offeredEndsAt    DateTime
  status           WaitlistOfferStatus @default(PENDING)
  expiresAt        DateTime
  @@index([patientId, status])
  @@index([doctorId, status])
}

enum WaitlistOfferStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}
```

---

## Phase 2 — Unit & E2E Tests

### 2.1 Unit Tests (`src/waitlist-offer-engine/waitlist-offer-engine.service.spec.ts`)

Test the `WaitlistOfferEngineService` in isolation with mocked `PrismaService`, `ClinicConfigService`, and `BullMQ` queues.

#### `findEligibleEntry()` — Core eligibility logic

| Scenario | Setup | Expected |
|---|---|---|
| No waitlist entries for doctor | Empty `WaitlistEntry` result | Returns `null` |
| Single entry, no window, buffer satisfied | `now + minArrival ≤ startsAt` | Returns entry |
| Single entry, no window, buffer NOT satisfied | `now + minArrival > startsAt` | Returns `null` |
| Entry has window, slot time falls inside window | Local slot time between `availableFrom` and `availableUntil` | Returns entry |
| Entry has window, slot time falls outside window | Local slot time outside window | Returns `null` (entry skipped) |
| Entry has window on midnight boundary (e.g., 22:00–23:59) | Slot at 23:30 local time | Returns entry |
| Entry has partial window (`availableFrom` set, `availableUntil` null) | Should not happen per spec 006, but guard: treat as "any time" | Returns entry |
| Entry already has a PENDING offer for same doctor | Another `WaitlistOffer` with `status=PENDING, doctorId` exists | Returns `null` (check C fails) |
| Two entries: first blocked by buffer, second eligible | Position 1 fails buffer, position 2 passes | Returns position-2 entry |
| Two entries: first blocked by window, second eligible | Position 1 fails window, position 2 passes | Returns position-2 entry |
| All entries ineligible | All fail buffer or window | Returns `null` |
| `timeZone = 'Asia/Riyadh'` (UTC+3) | Slot at `07:30 UTC` = `10:30 local`, window `10:00–12:00` | Returns entry |
| `timeZone = 'Asia/Riyadh'` (UTC+3) | Slot at `07:30 UTC` = `10:30 local`, window `11:00–13:00` | Returns `null` |

#### `createOffer()` — Offer creation

| Scenario | Expected |
|---|---|
| Valid entry and slot | `WaitlistOffer` created with `status=PENDING`, correct `expiresAt`, correct `offeredEndsAt` |
| `expiresAt` calculation | `expiresAt = approx now + offerWindowMinutes * 60s` (±1s tolerance in assertion) |
| `offeredEndsAt` calculation | `offeredEndsAt = startsAt + slotDurationMinutes * 60s` |
| Post-commit: expiry job scheduled | BullMQ `add()` called with `delay ≈ offerWindowMinutes * 60_000` |
| Post-commit: email job queued | `NotificationsService.queueWaitlistOfferEmail()` called with `patientId, offerId` |
| DB error during insert | Exception propagates; no BullMQ jobs queued (post-commit not reached) |

#### `processSlotOpened()` — Full flow

| Scenario | Expected |
|---|---|
| `doctorId` not a valid UUID | Job discarded, logs `invalid_doctor` |
| `startsAt` in the past | Job discarded, logs `slot_in_past` |
| Doctor does not exist in DB | Job discarded, logs `invalid_doctor` |
| Eligible patient found | `findEligibleEntry` returns entry → `createOffer` called |
| No eligible patient | `findEligibleEntry` returns `null` → logs `no_eligible_patient` with skip counts |

#### `processOfferExpiry()` — Expiry handling

| Scenario | Expected |
|---|---|
| Offer still `PENDING` at fire time | Offer updated to `EXPIRED`, `slot-opened` BullMQ job re-enqueued for same slot |
| Offer already `ACCEPTED` | No status change, no re-enqueue, logs `offer_already_resolved` |
| Offer already `DECLINED` | No status change, no re-enqueue, logs `offer_already_resolved` |
| Offer already `EXPIRED` (duplicate job) | No-op, idempotent |
| `offerId` UUID invalid or not found | Logs `invalid_offer_id`, job discarded |
| Re-enqueued `slot-opened` payload | `{ doctorId: payload.doctorId, startsAt: payload.startsAt }` |

---

### 2.2 Unit Tests (`src/waitlist-offer-engine/waitlist-offer.processor.spec.ts`)

| Scenario | Expected |
|---|---|
| `handleSlotOpened()` delegates to service | `WaitlistOfferEngineService.processSlotOpened()` called with job data |
| `handleOfferExpiry()` delegates to service | `WaitlistOfferEngineService.processOfferExpiry()` called with job data |
| Processor decorated with `@Processor(WAITLIST_OFFER_QUEUE)` | Verifiable via metadata (structural test) |
| Both handlers decorated with `@Process(jobName)` | Verifiable via metadata |

---

### 2.3 E2E Tests (`test/waitlist-offer-engine.e2e-spec.ts`)

Test environment: real PostgreSQL (test DB), BullMQ with `ioredis` connected to test Redis, full NestJS bootstrap with `AppModule`.

Seed helpers (extend `test/helpers/seed.ts`):
- `seedWaitlistEntry(patientId, doctorId, overrides?)` — creates `WaitlistEntry` with given `position`
- `seedClinicConfig(overrides?)` — upserts `ClinicConfig` with given values

#### Flow 1 — No Waitlist Entries

```
seed: doctor-A has no WaitlistEntries

emit: slot-opened job { doctorId: doctor-A, startsAt: tomorrow 10:00 UTC }

await job completion

assert:
  - WaitlistOffer table empty
  - Notifications queue empty
  - Log contains { event: "no_eligible_patient" }
```

#### Flow 2 — Happy Path: Eligible Patient, No Window

```
seed: clinicConfig { minArrivalMinutes: 0, offerWindowMinutes: 30, slotDurationMinutes: 30 }
seed: patientA on waitlist for doctor-A (position 1, no window)

emit: slot-opened { doctorId: doctor-A, startsAt: now + 2 hours (UTC) }

await job completion

assert:
  - WaitlistOffer created with:
      patientId = patientA
      status = PENDING
      offeredStartsAt = startsAt
      offeredEndsAt = startsAt + 30 min
      expiresAt ≈ now + 30 min (±5s)
  - BullMQ offer-expiry delayed job exists with delay ≈ 30 min
  - Notifications queue has one email job for patientA
```

#### Flow 3 — Window Filtering: Slot Outside Patient Window

```
seed: patientA on waitlist (position 1, availableFrom: "14:00", availableUntil: "17:00")
seed: clinicConfig { timeZone: "Asia/Riyadh", minArrivalMinutes: 0 }
(slot at 10:00 UTC = 13:00 Riyadh — outside window)

emit: slot-opened { doctorId: doctor-A, startsAt: <10:00 UTC tomorrow> }

await job completion

assert:
  - WaitlistOffer table empty
  - Log contains { event: "no_eligible_patient", skippedByWindow: 1 }
```

#### Flow 4 — Arrival Buffer: Slot Too Soon

```
seed: patientA on waitlist (position 1, no window)
seed: clinicConfig { minArrivalMinutes: 60 }
(slot starts in 30 minutes — buffer not satisfied)

emit: slot-opened { doctorId: doctor-A, startsAt: now + 30 minutes }

await job completion

assert:
  - WaitlistOffer table empty
  - Log contains { event: "no_eligible_patient", skippedByBuffer: 1 }
```

#### Flow 5 — Cascade: First Patient Blocked, Second Eligible

```
seed: patientA on waitlist (position 1, availableFrom: "14:00", availableUntil: "17:00")
seed: patientB on waitlist (position 2, no window)
seed: clinicConfig { timeZone: "UTC", minArrivalMinutes: 0 }
(slot at 10:00 UTC — outside patientA's window but no restriction for patientB)

emit: slot-opened { doctorId: doctor-A, startsAt: tomorrow 10:00 UTC }

await job completion

assert:
  - WaitlistOffer created for patientB (not patientA)
  - Offer has patientId = patientB.id
```

#### Flow 6 — Duplicate Offer Guard (Check C)

```
seed: patientA has WaitlistEntry for doctor-A AND a PENDING WaitlistOffer for doctor-A (different slot)

emit: slot-opened { doctorId: doctor-A, startsAt: tomorrow 11:00 UTC }

await job completion

assert:
  - No new WaitlistOffer created (patient already has PENDING offer)
  - Log contains { event: "no_eligible_patient" }
```

#### Flow 7 — Offer Expiry: Marks EXPIRED, Re-Enqueues

```
seed: WaitlistOffer (status=PENDING, expiresAt = now + 2s)
seed: WaitlistEntry for the same patient/doctor

emit: offer-expiry job { offerId, doctorId, startsAt }
(or wait 2s for the auto-scheduled delayed job to fire)

await job completion

assert:
  - WaitlistOffer.status = EXPIRED
  - New slot-opened job exists in BullMQ for { doctorId, startsAt }
```

#### Flow 8 — Offer Expiry: Already Accepted, No Re-Enqueue

```
seed: WaitlistOffer (status=ACCEPTED)

emit: offer-expiry job { offerId, doctorId, startsAt }

await job completion

assert:
  - WaitlistOffer.status still = ACCEPTED (unchanged)
  - No new slot-opened job enqueued
  - Log contains { event: "offer_already_resolved" }
```

#### Flow 9 — Stale Slot (In the Past)

```
emit: slot-opened { doctorId: doctor-A, startsAt: yesterday 10:00 UTC }

await job completion

assert:
  - WaitlistOffer table empty
  - Log contains { event: "slot_opened.discarded", reason: "slot_in_past" }
```

---

### 2.4 Test Setup & Teardown

```typescript
beforeAll(async () => {
  app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  prisma = app.get(PrismaService);
  bullQueue = app.get<Queue>(getQueueToken(WAITLIST_OFFER_QUEUE));
  await app.init();
});

afterEach(async () => {
  await prisma.waitlistOffer.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await bullQueue.drain();         // flush pending jobs
  await bullQueue.obliterate();    // clear completed/failed history
});

afterAll(async () => {
  await app.close();
});
```

**Awaiting job completion in tests** — use BullMQ's `QueueEvents` listener pattern:

```typescript
async function waitForJob(queue: Queue, jobId: string, timeout = 5000): Promise<void> {
  const queueEvents = new QueueEvents(queue.name, { connection: redisConnection });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Job timed out')), timeout);
    queueEvents.on('completed', ({ jobId: id }) => {
      if (id === jobId) { clearTimeout(timer); resolve(); }
    });
  });
  await queueEvents.close();
}
```

---

## Phase 3 — Frontend Integration

> **Frontend pages consuming this engine's output:**  
> - [012-my-waitlist-page](../012-my-waitlist-page/spec.md) (`/waitlist`) — shows live offers in the entry list  
> - [013-waitlist-offer-page](../013-waitlist-offer-page/spec.md) (`/offers/:offerId`) — the accept/decline UI  
>
> Both specs are written (✅) and implementation is pending. This phase defines the integration contract.

The engine has **no REST endpoints of its own**. Its output surfaces exclusively through:

1. A `WaitlistOffer` row visible via `GET /api/waitlist/offers/:offerId` (WaitlistModule)
2. An email delivered to the patient linking to `/offers/:offerId`
3. Indirect queue state changes visible via Socket.IO `/queue` namespace (QueueModule)

---

### 3.1 Frontend Pages & Engine-Generated Data

| Frontend Page | Spec | Engine's Role | Endpoint Used |
|---|---|---|---|
| My Waitlist (`/waitlist`) | [012](../012-my-waitlist-page/spec.md) | Engine creates offers — page shows "You have an offer" badge on entry | `GET /waitlist` includes offer status in entry |
| Waitlist Offer (`/offers/:offerId`) | [013](../013-waitlist-offer-page/spec.md) | Engine creates the offer this page displays | `GET /waitlist/offers/:offerId` |
| Email deep-link | — | Engine triggers the email; link routes patient here | `GET /offers/:offerId` (router entry) |

---

### 3.2 Email Deep-Link Flow

When the engine creates an offer, `NotificationsModule` sends an email containing:

```
https://<FRONTEND_URL>/offers/<offerId>
```

The patient clicks the link. The frontend must handle the unauthenticated landing case:

```
/offers/:offerId  →  ProtectedRoute (PATIENT role required)
  └─ If unauthenticated → redirect to /login?redirect=/offers/<offerId>
  └─ After login → LoginPage reads ?redirect param and navigates to /offers/<offerId>
```

This ensures patients arriving via email who are not logged in are returned to the correct offer page after authentication. **This redirect behavior must be implemented in `ProtectedRoute` (spec 008).**

---

### 3.3 Offer Countdown Alignment with Engine Expiry

The engine sets `expiresAt = now + clinicConfig.offerWindowMinutes`. The frontend countdown (`/offers/:offerId` page) must align with this:

- Render a countdown timer using `offer.expiresAt` from the API response (UTC ISO 8601)
- Do not rely on a fixed client-side timer initialised from page load — always derive remaining time from `expiresAt - Date.now()`
- If the countdown reaches zero before the server confirms expiry, disable Accept/Decline and trigger a manual refetch:

```typescript
// in useWaitlistOffer hook (spec 013 §4)
refetchInterval: (data) => data?.status === 'PENDING' ? 30_000 : false,

// on local countdown reaching zero:
onCountdownEnd: () => {
  queryClient.invalidateQueries({ queryKey: ['waitlist', 'offers', offerId] });
}
```

The server-returned `status = 'EXPIRED'` is authoritative over the local timer.

---

### 3.4 "Offer Available" Indicator on My Waitlist Page

When a patient has a `PENDING` offer, the `/waitlist` page should show a visual indicator on the affected entry (e.g., "Offer available — respond before HH:mm").

The `GET /api/waitlist` response does not include offer details inline. The frontend must:

1. Fetch waitlist entries → `GET /api/waitlist`
2. For each entry that has at least one offer, surface a badge by checking separately or receiving offer status in the entry

**Recommended approach**: The backend includes a computed `hasPendingOffer: boolean` field on each `WaitlistEntryDTO`:

```typescript
interface WaitlistEntryDTO {
  // ... existing fields ...
  pendingOfferId: string | null;   // null if no pending offer; UUID if one exists
}
```

This allows the frontend to render a direct link to `/offers/:offerId` without an extra fetch. The WaitlistModule spec (006) and implementation must include this field.

---

### 3.5 Offer Expiry and State Recovery

The engine marks offers `EXPIRED` via the delayed BullMQ job. If the patient is looking at the offer page when expiry fires:

1. The countdown reaches zero locally
2. The page triggers `queryClient.invalidateQueries`
3. The API returns `status: "EXPIRED"`
4. The page transitions to an "offer expired" state: buttons disabled, message displayed, link back to `/waitlist`

The page must not be a dead-end — always provide a navigation path back to `/waitlist` after expiry.

---

### 3.6 Re-Enqueue After Expiry or Decline

When the engine re-enqueues a `slot-opened` job (after expiry or decline), the **next eligible patient** receives a new offer. That patient's `/waitlist` page will show the offer badge when they next poll or navigate to the page. There is no real-time push to the patient's browser for new offers (Socket.IO `/queue` namespace is for appointment queue, not waitlist offers). The 30-second refetch interval on the offer hook and the waitlist hook provides eventual consistency.

If real-time delivery is required in a future iteration, a dedicated Socket.IO event (e.g., `offer.created`) can be added to `QueueModule`. This is out of scope for the current spec.

---

### 3.7 Query Cache Invalidation Map (Engine-Triggered Effects)

The engine itself does not invalidate frontend caches — it has no HTTP layer. The frontend invalidates in response to mutations made through `WaitlistModule` endpoints (covered in spec 006 §3.7). The engine's indirect effects (new offer created, offer expired) are picked up by the polling intervals already defined.

| Engine action | Frontend picks it up via |
|---|---|
| New offer created | `refetchInterval: 30_000` on `useWaitlistEntries` hook |
| Offer expired (delayed job fires) | `refetchInterval: 30_000` on `useWaitlistOffer` hook, or local countdown → invalidate |
| Slot re-opened after decline/expiry | No frontend action needed — slot availability is re-computed on `GET /slots` |

---

### 3.8 Development Checklist (Engine ↔ Frontend)

- [ ] Engine creates `WaitlistOffer` with correct `expiresAt` based on `ClinicConfig.offerWindowMinutes`
- [ ] Engine sets `offeredEndsAt = offeredStartsAt + slotDurationMinutes` correctly
- [ ] `GET /waitlist/offers/:offerId` returns `expiresAt` as UTC ISO 8601
- [ ] `WaitlistEntryDTO` includes `pendingOfferId: string | null` (see §3.4)
- [ ] Email contains the correct deep-link URL: `<FRONTEND_URL>/offers/<offerId>`
- [ ] `ProtectedRoute` passes `?redirect=/offers/:offerId` to login page for unauthenticated patients
- [ ] `/offers/:offerId` page derives countdown from `expiresAt` (not page load time)
- [ ] `/offers/:offerId` page handles `status: 'EXPIRED'` gracefully — disables buttons, shows message
- [ ] `/waitlist` page shows "Offer available" badge when `pendingOfferId` is non-null
- [ ] After offer expires, patient is not stranded — navigation back to `/waitlist` is visible
- [ ] BullMQ `offer-expiry` delayed jobs fire within ±5s of `expiresAt` in staging

---

## Acceptance Criteria

### Engine Behaviour

- [ ] `slot-opened` job with past `startsAt` is discarded and logged — no offer created
- [ ] `slot-opened` job for non-existent doctor is discarded and logged — no offer created
- [ ] Eligibility check respects `minArrivalMinutes`: slot within buffer is skipped
- [ ] Eligibility check respects availability window (HH:mm in clinic timezone): slot outside window is skipped
- [ ] Eligibility check skips patients already holding a PENDING offer for the same doctor
- [ ] Engine walks the waitlist in `position ASC` order — lowest position is offered first
- [ ] When all patients are ineligible, engine logs `no_eligible_patient` with skip counts
- [ ] Created `WaitlistOffer` has `expiresAt = now + offerWindowMinutes` (±5s tolerance)
- [ ] Created `WaitlistOffer` has `offeredEndsAt = offeredStartsAt + slotDurationMinutes`
- [ ] After offer creation: delayed `offer-expiry` BullMQ job is scheduled with correct delay
- [ ] After offer creation: email notification job is queued via `NotificationsModule`
- [ ] `offer-expiry` job on a `PENDING` offer: sets status to `EXPIRED`, re-enqueues `slot-opened`
- [ ] `offer-expiry` job on an already-resolved offer: no-op, no re-enqueue, logs `offer_already_resolved`

### Test Coverage

- [ ] All unit test scenarios in §2.1 and §2.2 pass: `pnpm test src/waitlist-offer-engine`
- [ ] All E2E flows in §2.3 pass: `pnpm test:e2e -- --testPathPattern=waitlist-offer-engine`
- [ ] Unit test coverage for eligibility algorithm ≥ 90% branch coverage

### Integration

- [ ] `AppointmentsModule` emits `slot-opened` jobs on cancellation (verified by E2E test in appointments spec)
- [ ] `WaitlistModule` emits `slot-opened` jobs after offer decline (verified by E2E test in waitlist spec)
- [ ] `GET /waitlist/offers/:offerId` returns all fields required by spec 013 (`expiresAt`, `offeredSlot`, `doctor`, `currentAppointment`)
- [ ] `WaitlistEntryDTO` includes `pendingOfferId` field (null or UUID)
- [ ] Email deep-link format: `<FRONTEND_URL>/offers/<offerId>` (no trailing slash, no query params)
