# Spec: WaitlistModule (`backend/src/waitlist/`)

**Type**: Backend NestJS Module  
**Plan reference**: [BACKEND_PLAN.md — §6 WaitlistModule](../../BACKEND_PLAN.md#6-waitlistmodule)  
**Frontend specs consumed**: [012-my-waitlist-page](../012-my-waitlist-page/spec.md), [013-waitlist-offer-page](../013-waitlist-offer-page/spec.md)

> **Frontend implementation status**: Both frontend specs above are written (✅) but **not yet implemented** (specs 012 and 013 exist; page implementations pending). Phase 3 of this spec is a forward-looking integration contract to be satisfied when frontend implementation begins.

---

## Overview

WaitlistModule manages patient waitlist entries and offer responses. A patient joins a waitlist for a specific doctor with an optional availability window (HH:mm–HH:mm). When a slot opens (via cancellation or schedule addition), the WaitlistOfferEngineModule creates a `WaitlistOffer` for the highest-priority eligible patient. This module owns the CRUD for `WaitlistEntry` and the accept/decline endpoints for `WaitlistOffer`. The atomic accept flow (cancel old appointment + create new + remove entry) is implemented inside this module, guarded by a Prisma transaction.

---

## Phase 1 — DTOs & Validation

### 1.1 File Map

```
backend/src/waitlist/
├── waitlist.module.ts
├── waitlist.controller.ts
├── waitlist.service.ts
└── dto/
    ├── join-waitlist.dto.ts
    ├── update-window.dto.ts
    └── waitlist-query.dto.ts
```

---

### 1.2 `JoinWaitlistDto`

```typescript
// POST /api/waitlist
class JoinWaitlistDto {
  @IsUUID()
  doctorId: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'availableFrom must be HH:mm' })
  availableFrom?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'availableUntil must be HH:mm' })
  availableUntil?: string | null;
}
```

**Validation rules**:
- `doctorId` must reference an existing doctor → `404 Not Found` `"doctor_not_found"` if the DoctorProfile row does not exist
- `availableFrom` and `availableUntil` are both optional, but **if one is provided, both must be provided** → `400 Bad Request` `"window_incomplete"` if only one is set
- If both are provided, `availableFrom` must be strictly less than `availableUntil` (HH:mm string comparison) → `400 Bad Request` `"window_invalid"`
- Only one `WaitlistEntry` per `(patientId, doctorId)` pair → `409 Conflict` `"already_on_waitlist"` if a duplicate exists
- Only `PATIENT` role may call this endpoint; PATIENT's `id` is always used as `patientId` (cannot be overridden from request body)

**Position assignment**: `position` is assigned as `MAX(position for doctorId) + 1`. New entrants go to the back of the queue.

**Response** (`201`):
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "doctorId": "uuid",
    "patientId": "uuid",
    "position": 3,
    "availableFrom": "09:00",
    "availableUntil": "13:00",
    "createdAt": "2026-05-05T08:00:00.000Z",
    "doctor": {
      "id": "uuid",
      "firstName": "Ahmad",
      "lastName": "Al-Rashid",
      "specialization": "General Dentistry"
    }
  }
}
```

---

### 1.3 `UpdateWindowDto`

```typescript
// PATCH /api/waitlist/:id
class UpdateWindowDto {
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  availableFrom?: string | null;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  availableUntil?: string | null;
}
```

**Validation rules**:
- Caller must own the waitlist entry → `403 Forbidden` `"forbidden"` if `patientId ≠ req.user.id`
- Entry must exist → `404 Not Found` `"waitlist_entry_not_found"`
- Window pair validation: same rules as `JoinWaitlistDto` (both-or-neither, from < until)
- Passing `null` for both `availableFrom` and `availableUntil` clears the window (any time is acceptable)

**Response** (`200`): full `WaitlistEntryDTO` with updated window.

---

### 1.4 `WaitlistQueryDto`

```typescript
// GET /api/waitlist
class WaitlistQueryDto {
  @IsOptional()
  @IsUUID()
  doctorId?: string;         // staff filter by doctor

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
```

**Access rules**:
- `PATIENT`: always scoped to own entries; `doctorId` filter allowed
- `RECEPTIONIST` / `ADMIN`: see all entries across all patients; `doctorId` filter allowed

---

### 1.5 Offer Accept/Decline (no separate DTO)

```
POST /api/waitlist/offers/:offerId/accept
POST /api/waitlist/offers/:offerId/decline
```

No request body. The `offerId` is a UUID path param.

**Common validations**:
- Offer must exist → `404 Not Found` `"offer_not_found"`
- Offer must belong to `req.user.id` → `403 Forbidden` `"forbidden"`
- Only `PATIENT` role may call these endpoints

**Accept-specific validations**:
- Offer status must be `PENDING` → if `ACCEPTED`, return `200` idempotently with current offer; if `EXPIRED` or `DECLINED` → `409 Conflict` `"offer_not_available"`
- Offered slot must still be free (re-validate with slot generator or direct DB check) → `409 Conflict` `"slot_unavailable"` if already taken
- All three side-effects execute **atomically** in a single Prisma transaction:
  1. If patient has an existing `PENDING` or `CONFIRMED` appointment with the same doctor, set it to `CANCELED`; emit `slot-opened` for that old slot (outside the transaction, after commit)
  2. Create a new `Appointment` for the offered slot with status `CONFIRMED`
  3. Remove the `WaitlistEntry`
  4. Set `WaitlistOffer.status = ACCEPTED`

**Decline-specific validations**:
- Offer status must be `PENDING` → if `DECLINED`, return `200` idempotently; if `ACCEPTED` or `EXPIRED` → `409 Conflict` `"offer_not_available"`
- Set `WaitlistOffer.status = DECLINED`
- Emit a `slot-opened` BullMQ job for the declined slot so the engine can offer it to the next patient

**Accept Response** (`200`):
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "status": "ACCEPTED",
    "appointment": {
      "id": "uuid",
      "startsAt": "2026-05-06T09:00:00.000Z",
      "endsAt":   "2026-05-06T09:30:00.000Z",
      "status": "CONFIRMED"
    }
  }
}
```

**Decline Response** (`200`):
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "status": "DECLINED"
  }
}
```

---

### 1.6 `GET /api/waitlist/offers/:offerId`

Returns the full offer details for the authenticated patient.

**Validations**:
- Offer exists → `404` `"offer_not_found"`
- `offer.patientId === req.user.id` → `403` `"forbidden"`

**Response** (`200`):
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "status": "PENDING",
    "expiresAt": "2026-05-05T10:30:00.000Z",
    "offeredSlot": {
      "startsAt": "2026-05-06T09:00:00.000Z",
      "endsAt":   "2026-05-06T09:30:00.000Z"
    },
    "doctor": {
      "id": "uuid",
      "firstName": "Ahmad",
      "lastName": "Al-Rashid",
      "specialization": "General Dentistry"
    },
    "currentAppointment": {
      "id": "uuid",
      "startsAt": "2026-05-08T11:00:00.000Z",
      "endsAt":   "2026-05-08T11:30:00.000Z",
      "status": "CONFIRMED"
    }
  }
}
```

`currentAppointment` is the patient's most recent non-canceled, non-completed appointment with the same doctor. It may be `null`.

---

### 1.7 `DELETE /api/waitlist/:id`

Removes a waitlist entry.

**Validations**:
- Entry must exist → `404` `"waitlist_entry_not_found"`
- `PATIENT` can only delete own entries (`patientId === req.user.id`) → `403` `"forbidden"`
- `RECEPTIONIST` / `ADMIN` can delete any entry

**Side effect**: No `slot-opened` event is emitted on manual leave (no slot was freed — the patient simply no longer wants early notification).

**Response** (`204 No Content`)

---

### 1.8 Prisma Models Used

```prisma
model WaitlistEntry {
  id             String           @id @default(uuid())
  patientId      String
  doctorId       String
  position       Int
  availableFrom  String?          // HH:mm
  availableUntil String?          // HH:mm
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  patient        PatientProfile   @relation(fields: [patientId], references: [userId])
  doctor         DoctorProfile    @relation(fields: [doctorId], references: [userId])
  offers         WaitlistOffer[]

  @@unique([patientId, doctorId])
  @@index([doctorId, position])
}

model WaitlistOffer {
  id               String            @id @default(uuid())
  waitlistEntryId  String
  patientId        String
  doctorId         String
  offeredStartsAt  DateTime
  offeredEndsAt    DateTime
  status           WaitlistOfferStatus @default(PENDING)
  expiresAt        DateTime
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt

  entry            WaitlistEntry     @relation(fields: [waitlistEntryId], references: [id], onDelete: Cascade)
  patient          PatientProfile    @relation(fields: [patientId], references: [userId])
  doctor           DoctorProfile     @relation(fields: [doctorId], references: [userId])

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

The `@@unique([patientId, doctorId])` constraint on `WaitlistEntry` enforces one entry per patient/doctor pair at the DB level, giving a robust conflict guard beyond the application-layer check.

---

## Phase 2 — Unit & E2E Tests

### 2.1 Unit Tests (`src/waitlist/waitlist.service.spec.ts`)

#### `joinWaitlist()`

| Scenario | Expected |
|---|---|
| Valid payload, no window | Entry created, `position = 1` for first joiner |
| Valid payload with window | Entry created with correct `availableFrom`/`availableUntil` |
| Second patient joins same doctor | Position = 2 (MAX + 1) |
| Duplicate `(patientId, doctorId)` | Throws `ConflictException` (409) `"already_on_waitlist"` |
| `availableFrom` set but `availableUntil` null | Throws `BadRequestException` (400) `"window_incomplete"` |
| `availableFrom` >= `availableUntil` | Throws `BadRequestException` (400) `"window_invalid"` |
| `doctorId` does not exist | Throws `NotFoundException` (404) `"doctor_not_found"` |
| RECEPTIONIST calls endpoint | Throws `ForbiddenException` (403) — only PATIENT allowed |

#### `updateWindow()`

| Scenario | Expected |
|---|---|
| Patient clears window (null, null) | Entry updated, both fields null |
| Patient updates both times validly | Entry updated with new times |
| Patient sends only `availableFrom` | Throws `BadRequestException` `"window_incomplete"` |
| Different patient edits another's entry | Throws `ForbiddenException` (403) |
| Entry does not exist | Throws `NotFoundException` (404) `"waitlist_entry_not_found"` |

#### `leaveWaitlist()` (`DELETE`)

| Scenario | Expected |
|---|---|
| Patient deletes own entry | Entry removed, 204 |
| Patient deletes another patient's entry | Throws `ForbiddenException` (403) |
| Admin deletes any entry | Entry removed, 204 |
| Entry not found | Throws `NotFoundException` (404) `"waitlist_entry_not_found"` |
| No `slot-opened` event emitted | BullMQ queue NOT called |

#### `getWaitlist()`

| Scenario | Expected |
|---|---|
| PATIENT calls | Returns only own entries with doctor nested |
| RECEPTIONIST calls | Returns all entries |
| RECEPTIONIST filters by `doctorId` | Correct subset returned |
| Pagination: `page=2, pageSize=5` | Correct offset applied |

#### `acceptOffer()`

| Scenario | Expected |
|---|---|
| PENDING offer, slot still free, no current appointment | Creates new CONFIRMED appointment, removes entry, sets offer ACCEPTED |
| PENDING offer, slot still free, patient has existing appointment with same doctor | Old appointment CANCELED, new CONFIRMED created, entry removed — all atomic |
| Offer already ACCEPTED (idempotent) | Returns 200 with current offer data, no side effects |
| Offer EXPIRED | Throws `ConflictException` (409) `"offer_not_available"` |
| Offer DECLINED | Throws `ConflictException` (409) `"offer_not_available"` |
| Offered slot now taken by another booking | Throws `ConflictException` (409) `"slot_unavailable"` |
| Offer belongs to different patient | Throws `ForbiddenException` (403) |
| Offer not found | Throws `NotFoundException` (404) |
| Transaction failure mid-way | Full rollback; no partial state |

#### `declineOffer()`

| Scenario | Expected |
|---|---|
| PENDING offer | Status set to DECLINED, `slot-opened` BullMQ job emitted |
| Offer already DECLINED (idempotent) | Returns 200, no side effects |
| Offer ACCEPTED or EXPIRED | Throws `ConflictException` (409) `"offer_not_available"` |
| Offer belongs to different patient | Throws `ForbiddenException` (403) |
| `slot-opened` event payload | `{ doctorId, startsAt: offer.offeredStartsAt }` |

---

### 2.2 E2E Tests (`test/waitlist.e2e-spec.ts`)

Test environment: real PostgreSQL (test DB), BullMQ in-memory queues, full NestJS bootstrap.

#### Flow 1 — Join Waitlist

```
POST /api/waitlist (as PATIENT)
  body: { doctorId: <id> }
  → 201, entry with position = 1, no window

POST /api/waitlist (same doctor, different patient)
  → 201, entry with position = 2

POST /api/waitlist (same patient, same doctor)
  → 409, message = "already_on_waitlist"
```

#### Flow 2 — Window Validation

```
POST /api/waitlist
  body: { doctorId, availableFrom: "09:00" }   // missing availableUntil
  → 400, message = "window_incomplete"

POST /api/waitlist
  body: { doctorId, availableFrom: "14:00", availableUntil: "09:00" }
  → 400, message = "window_invalid"

POST /api/waitlist
  body: { doctorId, availableFrom: "09:00", availableUntil: "13:00" }
  → 201, entry with window set
```

#### Flow 3 — Update & Leave

```
(seed: patient has one waitlist entry)

PATCH /api/waitlist/:id (as owning patient)
  body: { availableFrom: null, availableUntil: null }
  → 200, window cleared

PATCH /api/waitlist/:id (as different patient)
  → 403

DELETE /api/waitlist/:id (as owning patient)
  → 204, DB row removed
  → BullMQ queue NOT called
```

#### Flow 4 — Staff List with Filters

```
(seed: 3 entries for doctor-A, 2 for doctor-B, across 2 patients)

GET /api/waitlist (as PATIENT-1)
  → 200, items = entries for PATIENT-1 only

GET /api/waitlist (as RECEPTIONIST)
  → 200, items = all 5 entries

GET /api/waitlist?doctorId=<doctor-A-id> (as RECEPTIONIST)
  → 200, items = 3 entries for doctor-A only
```

#### Flow 5 — Offer Accept (full atomic flow)

```
(seed: PATIENT has CONFIRMED appointment at slot-A with doctor-X; WaitlistEntry for doctor-X)
(seed: WaitlistOffer in PENDING status for slot-B, expiresAt = now + 10 minutes)

GET /api/waitlist/offers/:offerId (as PATIENT)
  → 200, status = PENDING, currentAppointment present, countdown active

POST /api/waitlist/offers/:offerId/accept (as PATIENT)
  → 200, data.status = ACCEPTED, data.appointment.startsAt = slot-B

DB assertions:
  - Appointment at slot-A has status = CANCELED
  - New Appointment at slot-B has status = CONFIRMED
  - WaitlistEntry for patient/doctor-X is removed
  - WaitlistOffer.status = ACCEPTED
  - BullMQ job emitted for slot-A (slot freed by canceled appointment)

POST /api/waitlist/offers/:offerId/accept (duplicate, idempotent)
  → 200, same response (not re-created)
```

#### Flow 6 — Offer Accept with Slot Conflict

```
(seed: WaitlistOffer PENDING for slot-C; slot-C booked by another patient between offer creation and accept)

POST /api/waitlist/offers/:offerId/accept (as PATIENT)
  → 409, message = "slot_unavailable"
  → No appointment created, no entry removed (transaction rolled back)
```

#### Flow 7 — Offer Decline

```
(seed: WaitlistOffer PENDING for slot-D)

POST /api/waitlist/offers/:offerId/decline (as PATIENT)
  → 200, data.status = DECLINED
  → BullMQ receives slot-opened job for slot-D

POST /api/waitlist/offers/:offerId/decline (duplicate, idempotent)
  → 200, same response

POST /api/waitlist/offers/:offerId/accept (after decline)
  → 409, message = "offer_not_available"
```

#### Flow 8 — Expired Offer

```
(seed: WaitlistOffer with expiresAt = past timestamp, status = EXPIRED)

POST /api/waitlist/offers/:offerId/accept
  → 409, message = "offer_not_available"

POST /api/waitlist/offers/:offerId/decline
  → 409, message = "offer_not_available"
```

---

### 2.3 Test Setup & Teardown

```typescript
beforeAll(async () => {
  app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  prisma = app.get(PrismaService);
  await app.init();
});

afterEach(async () => {
  await prisma.waitlistOffer.deleteMany();
  await prisma.waitlistEntry.deleteMany();
  await prisma.appointment.deleteMany();
});

afterAll(async () => {
  await app.close();
});
```

Seed helpers (extend `test/helpers/seed.ts`):
- `seedWaitlistEntry(patientId, doctorId, overrides?)` — creates `WaitlistEntry`
- `seedWaitlistOffer(entryId, overrides?)` — creates `WaitlistOffer` with a PENDING status and `expiresAt = now + 15 minutes`

---

## Phase 3 — Frontend Integration

> **Status**: Frontend specs 012 (My Waitlist Page) and 013 (Waitlist Offer Page) are fully written (✅) but **implementation has not started**. This phase defines the contract those pages must satisfy when implementation begins.

### 3.1 Frontend Pages & Their Waitlist Endpoints

| Frontend Page | Spec | Endpoints Used |
|---|---|---|
| My Waitlist (`/waitlist`) | [012](../012-my-waitlist-page/spec.md) | `GET /waitlist`, `POST /waitlist`, `PATCH /waitlist/:id`, `DELETE /waitlist/:id`, `GET /doctors` |
| Waitlist Offer (`/offers/:offerId`) | [013](../013-waitlist-offer-page/spec.md) | `GET /waitlist/offers/:offerId`, `POST /waitlist/offers/:offerId/accept`, `POST /waitlist/offers/:offerId/decline` |
| Admin Waitlist Table | [015](../015-appointments-admin-page/spec.md) | `GET /waitlist` (all patients, filterable) |

---

### 3.2 Shared Response Shapes

#### `WaitlistEntryDTO`

```typescript
interface WaitlistEntryDTO {
  id: string;
  doctorId: string;
  patientId: string;
  position: number;
  availableFrom: string | null;    // HH:mm
  availableUntil: string | null;   // HH:mm
  createdAt: string;               // ISO 8601
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
}
```

#### `WaitlistOfferDTO`

```typescript
interface WaitlistOfferDTO {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  expiresAt: string;               // UTC ISO 8601
  offeredSlot: {
    startsAt: string;              // UTC ISO 8601
    endsAt: string;                // UTC ISO 8601
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
  currentAppointment: {
    id: string;
    startsAt: string;
    endsAt: string;
    status: AppointmentStatus;
  } | null;
}
```

List endpoints return the standard paginated envelope:
```json
{
  "statusCode": 200,
  "data": {
    "items": [ WaitlistEntryDTO ],
    "total": 5,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 3.3 Availability Window Format

The backend stores and returns window values as `HH:mm` strings (24-hour). The frontend must:

- Store form state in `HH:mm` format (HTML `<input type="time">` native value)
- Display in locale-appropriate format (12h for `en`, 24h for `ar`)
- Never send partial windows — validate both-or-neither at form submission level before the API call

```typescript
// Zod schema (matches spec 012 §5)
const windowSchema = z.object({
  availableFrom: z.string().nullable().optional(),
  availableUntil: z.string().nullable().optional(),
}).superRefine((val, ctx) => {
  const hasFrom = !!val.availableFrom;
  const hasUntil = !!val.availableUntil;
  if (hasFrom !== hasUntil) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['availableUntil'], message: 'waitlist.errors.windowIncomplete' });
  }
  if (hasFrom && hasUntil && val.availableFrom! >= val.availableUntil!) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['availableUntil'], message: 'waitlist.errors.windowInvalid' });
  }
});
```

---

### 3.4 Duplicate Entry Handling

The backend enforces uniqueness with a DB `@@unique` constraint. The frontend should:

1. Disable doctors in the join-form select that the patient is already waiting for (derived from the loaded entries list)
2. Handle `409` with `"already_on_waitlist"` gracefully:

```typescript
if (error.response?.status === 409 && error.response.data.message === 'already_on_waitlist') {
  setError('doctorId', { message: t('waitlist.alreadyJoined') });
}
```

---

### 3.5 Offer Countdown and Polling

The Waitlist Offer Page (`/offers/:offerId`) uses a client-side countdown derived from `expiresAt`. The React Query hook re-fetches every 30 seconds to reconcile server state:

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

When the local countdown reaches zero:
1. Disable the Accept and Decline buttons immediately
2. Trigger a manual refetch (`queryClient.invalidateQueries`)
3. Trust the server-returned status (`EXPIRED`) over the local timer

---

### 3.6 Accept Flow — Conflict Handling

```typescript
// WaitlistOfferPage — accept mutation error handler
if (error.response?.status === 409) {
  const msg = error.response.data.message;
  if (msg === 'slot_unavailable') {
    toast.error(t('offers.slotUnavailable'));
    queryClient.invalidateQueries({ queryKey: ['waitlist', 'offers', offerId] });
  } else if (msg === 'offer_not_available') {
    toast.error(t('offers.expired'));
    queryClient.invalidateQueries({ queryKey: ['waitlist', 'offers', offerId] });
  }
}
```

The offer details card must re-render to reflect the now-expired/unavailable state after the cache is invalidated.

---

### 3.7 Query Cache Invalidation Map

| Action | Invalidated Query Keys |
|---|---|
| `POST /waitlist` (join) | `['waitlist', 'mine']` |
| `PATCH /waitlist/:id` (update window) | `['waitlist', 'mine']` |
| `DELETE /waitlist/:id` (leave) | `['waitlist', 'mine']` |
| `POST /offers/:id/accept` | `['waitlist']`, `['appointments']`, `['slots']` |
| `POST /offers/:id/decline` | `['waitlist']`, `['appointments']` |

---

### 3.8 Staff Waitlist Table (Admin / Receptionist)

Admin and Receptionist dashboards display a waitlist data table backed by:

```
GET /api/waitlist?doctorId=<uuid>&page=1&pageSize=20
```

The table shows: patient name, doctor name, position, availability window, join date. Staff may delete entries via `DELETE /api/waitlist/:id` (no 24h restriction applies).

---

### 3.9 Routing and Auth Guards

```typescript
// /waitlist — patient only
{
  path: '/waitlist',
  element: (
    <ProtectedRoute roles={['PATIENT']}>
      <PatientLayout><MyWaitlistPage /></PatientLayout>
    </ProtectedRoute>
  ),
}

// /offers/:offerId — patient only; preserve redirect for email links
{
  path: '/offers/:offerId',
  element: (
    <ProtectedRoute roles={['PATIENT']}>
      <PatientLayout><WaitlistOfferPage /></PatientLayout>
    </ProtectedRoute>
  ),
}
```

`ProtectedRoute` must pass `?redirect=/offers/:offerId` to the login URL so that patients arriving via email link are returned to the correct offer page after authentication.

---

### 3.10 Development Checklist (Backend ↔ Frontend)

- [ ] `POST /api/waitlist` enforces one-per-(patient, doctor); returns `409 "already_on_waitlist"` on duplicate
- [ ] `GET /api/waitlist` — PATIENT sees own entries only; RECEPTIONIST/ADMIN see all; `doctorId` filter works
- [ ] `PATCH /api/waitlist/:id` — window cleared when both fields are null; ownership enforced
- [ ] `DELETE /api/waitlist/:id` — PATIENT can delete own; staff can delete any; no BullMQ event emitted
- [ ] `GET /api/waitlist/offers/:offerId` — includes `currentAppointment` when patient has existing booking with doctor
- [ ] `POST /api/waitlist/offers/:offerId/accept` — atomic: old appointment canceled, new created, entry removed, offer ACCEPTED
- [ ] Accept returns `409 "slot_unavailable"` if slot was taken between offer creation and accept
- [ ] Accept is idempotent: duplicate request returns `200` with same data
- [ ] `POST /api/waitlist/offers/:offerId/decline` — offer set to DECLINED, `slot-opened` BullMQ job emitted
- [ ] Decline is idempotent: duplicate request returns `200` with same data
- [ ] `WaitlistEntryDTO` always includes nested `doctor` object
- [ ] `WaitlistOfferDTO` always includes `offeredSlot`, `doctor`, and `currentAppointment` (nullable)
- [ ] Swagger docs at `/api/docs` include all 7 endpoints with request/response schemas and error codes

---

## Acceptance Criteria

- [ ] `POST /waitlist` creates entry with correct position; `availableFrom`/`availableUntil` stored as HH:mm strings
- [ ] Duplicate `(patientId, doctorId)` returns `409 "already_on_waitlist"` (both app-layer and DB constraint)
- [ ] Partial window (one field set, other null) returns `400 "window_incomplete"`
- [ ] Invalid window (`from >= until`) returns `400 "window_invalid"`
- [ ] `GET /waitlist` — PATIENT sees own entries only; no other patient's data leaks
- [ ] `PATCH /waitlist/:id` — only entry owner (or staff) can edit; null window clears both fields
- [ ] `DELETE /waitlist/:id` — only owner or staff can delete; no BullMQ event emitted
- [ ] `GET /waitlist/offers/:offerId` returns `currentAppointment` when applicable, null when not
- [ ] Accept offer: atomic transaction; partial failure rolls back; no stale state left in DB
- [ ] Accept with taken slot returns `409 "slot_unavailable"`; no appointment created
- [ ] Accepted offer is idempotent; EXPIRED/DECLINED offer returns `409 "offer_not_available"`
- [ ] Decline emits `slot-opened` BullMQ job with `{ doctorId, startsAt: offeredStartsAt }`
- [ ] Declined offer is idempotent; ACCEPTED/EXPIRED offer returns `409 "offer_not_available"`
- [ ] All unit tests pass: `pnpm test src/waitlist`
- [ ] All E2E flows pass: `pnpm test:e2e -- --testPathPattern=waitlist`
- [ ] Swagger docs include all 7 endpoints with request/response schemas
