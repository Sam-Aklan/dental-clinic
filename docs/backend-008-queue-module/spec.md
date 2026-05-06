# Spec: QueueModule (`backend/src/queue/`)

**Type**: Backend NestJS Module (Socket.IO Gateway + HTTP kiosk-token endpoint)  
**Plan reference**: [BACKEND_PLAN.md — §8 QueueModule](../../BACKEND_PLAN.md#8-queuemodule)  
**Frontend specs consumed**:
- [006-lobby-queue-page](../006-lobby-queue-page/spec.md) — public kiosk display, kiosk token auth
- [014-staff-queue-page](../014-staff-queue-page/spec.md) — receptionist/admin live queue board
- [023-doctor-queue-page](../023-doctor-queue-page/spec.md) — doctor's own live queue
- [024-doctor-today-page](../024-doctor-today-page/spec.md) — doctor dashboard with queue section

> **Frontend implementation status**: All four frontend specs are written. Implementation status is unknown — Phase 3 defines the integration contract those pages must satisfy against this module.

---

## Overview

QueueModule owns the real-time layer of the clinic's appointment flow. It exposes a Socket.IO gateway on the `/queue` namespace that pushes live queue state to three categories of clients:

1. **Lobby displays** — unauthenticated TV screens in the waiting room, identified by a signed kiosk token scoped to a single doctor.
2. **Receptionist/admin staff** — authenticated users watching the full multi-doctor board.
3. **Doctors** — authenticated users watching only their own queue.

The module emits three server-to-client events (`queue.snapshot`, `queue.updated`, `queue.removed`) and handles two client-to-server events (`queue.subscribe`, `queue.unsubscribe`). It also exposes one REST endpoint for issuing kiosk tokens.

All emitted payloads are **privacy-safe by design**: they carry no patient PII (name, phone, email). The frontend maps `appointmentId` references to patient details using its own REST-fetched appointment cache. This allows kiosk connections and staff connections to receive the same events with no role-based filtering at the gateway layer.

---

## Phase 1 — Event Payloads, DTOs & Validation

### 1.1 File Map

```
backend/src/queue/
├── queue.module.ts
├── queue.gateway.ts              ← Socket.IO gateway (@WebSocketGateway)
├── queue.service.ts              ← snapshot generation + room emit helpers
├── kiosk-token.service.ts        ← sign + verify kiosk JWTs
├── queue.controller.ts           ← REST: POST /api/queue/kiosk-token
└── dto/
    ├── issue-kiosk-token.dto.ts
    ├── subscribe.dto.ts
    └── queue-item.dto.ts
```

---

### 1.2 Socket.IO Namespace Configuration

```typescript
@WebSocketGateway({
  namespace: '/queue',
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect { ... }
```

**Transport**: WebSocket (with polling fallback).  
**Namespace**: `/queue`  
**Full URL**: `ws://localhost:3000/queue`

---

### 1.3 Connection Authentication

Every client must authenticate on the handshake. Two auth strategies are supported, checked in order:

#### Strategy A — JWT (staff and doctors)

The client sends the access JWT in the Socket.IO handshake `auth` object:

```javascript
// Client-side (frontend)
const socket = io('/queue', {
  auth: { token: accessToken },   // 'Bearer ' prefix optional; backend strips it
});
```

The gateway extracts the token, verifies it with `JWT_ACCESS_SECRET`, and populates `socket.data.user` with:

```typescript
socket.data.user = {
  userId: string;
  role: 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'PATIENT';
  doctorProfileId: string | null;  // set only when role = DOCTOR
};
```

`PATIENT` role connections are rejected (`socket.disconnect(true)`) — patients do not use the queue namespace.

#### Strategy B — Kiosk Token (lobby displays)

The client sends the signed kiosk token in the handshake `auth` object OR as a query param:

```javascript
// Option 1: auth object
const socket = io('/queue', { auth: { kioskToken: '<signed-token>' } });

// Option 2: query param (for lobby displays that set the token in the URL)
const socket = io('/queue?kioskToken=<signed-token>');
```

The gateway verifies the kiosk token with `KioskTokenService.verify()` and populates:

```typescript
socket.data.kiosk = {
  doctorId: string;   // the doctor this kiosk is locked to
  isKiosk: true;
};
```

#### Authentication failure

If neither strategy succeeds, the gateway emits an `exception` event and disconnects:

```json
{ "status": "error", "message": "Unauthorized" }
```

---

### 1.4 Room Naming Convention

Clients subscribe to rooms named `doctor:<doctorId>` (UUID).

```
doctor:550e8400-e29b-41d4-a716-446655440000
```

A kiosk connection is **automatically joined** to its locked doctor's room on connect — no `queue.subscribe` event needed. JWT connections must explicitly send `queue.subscribe` to join rooms.

---

### 1.5 Kiosk Token

#### `IssueKioskTokenDto`

```typescript
// POST /api/queue/kiosk-token
class IssueKioskTokenDto {
  @IsUUID(4)
  doctorId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresInDays?: number;    // default: 30
}
```

**Guard**: `JwtAuthGuard` + `RolesGuard(['ADMIN', 'RECEPTIONIST'])`

**Response** (`201`):
```json
{
  "statusCode": 201,
  "data": {
    "token": "<signed-kiosk-jwt>",
    "doctorId": "550e8400-e29b-41d4-a716-446655440000",
    "expiresAt": "2026-06-04T12:00:00.000Z",
    "lobbyUrl": "http://localhost:5173/lobby/550e8400-e29b-41d4-a716-446655440000?kt=<signed-kiosk-jwt>"
  }
}
```

**Validation rules**:
- `doctorId` must reference an existing `DoctorProfile` → `404` if not found
- Token signed with `KIOSK_TOKEN_SECRET` env var (separate secret from JWT_ACCESS_SECRET)
- Payload: `{ sub: doctorId, type: 'kiosk', iat, exp }`

#### `KioskTokenService`

```typescript
class KioskTokenService {
  sign(doctorId: string, expiresInDays: number): string;
  verify(token: string): { doctorId: string } | null;  // null = invalid or expired
}
```

- Uses `@nestjs/jwt` with a dedicated `kiosk` secret
- `verify()` never throws — returns `null` on failure (no exception propagation from gateway `handleConnection`)

---

### 1.6 `SubscribeDto` (Client Event Payload)

Validates the payload of `queue.subscribe` and `queue.unsubscribe` client events.

```typescript
class SubscribeDto {
  @IsUUID(4)
  doctorId: string;
}
```

Applied inside the gateway handlers using `plainToInstance` + `validateSync`. On validation failure, emit `exception` back to the sender and return without joining the room.

---

### 1.7 `QueueItemDto` (Emitted in all server events)

The privacy-safe representation of one appointment in the queue:

```typescript
class QueueItemDto {
  appointmentId: string;   // UUID
  position: number;        // 1-based; ordered by startsAt ASC among active statuses
  status: AppointmentStatus;
  startsAt: string;        // ISO 8601 UTC
  endsAt: string;          // ISO 8601 UTC (= startsAt + slotDurationMinutes)
  notes: string | null;    // appointment-level notes; null if unset
}
```

**Active statuses** (included in the snapshot): `PENDING`, `CONFIRMED`, `IN_PROGRESS`  
**Excluded statuses**: `COMPLETED`, `CANCELED`, `NO_SHOW`

`position` is recalculated on each snapshot by ranking active appointments by `startsAt` ASC, starting at 1. Position does not skip numbers when earlier appointments complete or cancel — it is always a contiguous rank of the *current* active items.

---

### 1.8 Server → Client Events

#### `queue.snapshot`

Emitted to a specific socket immediately after it subscribes to a room (or on kiosk connect). Carries the full current state of active appointments for one doctor today.

```typescript
interface QueueSnapshotEvent {
  doctorId: string;
  date: string;           // ISO date in clinic timezone, e.g. "2026-05-05"
  items: QueueItemDto[];  // ordered by position ASC (= startsAt ASC)
}
```

#### `queue.updated`

Emitted to an entire `doctor:<doctorId>` room whenever an appointment's status changes. Fired by `QueueService.emitUpdated()` which is called by `AppointmentsModule` (and `WaitlistModule`) after any status transition.

```typescript
interface QueueUpdatedEvent {
  appointmentId: string;
  doctorId: string;
  status: AppointmentStatus;
  position: number | null;   // null when status moves to COMPLETED/CANCELED/NO_SHOW
  updatedAt: string;         // ISO 8601 UTC
}
```

**Emit rule**: `position` is recalculated from the current DB state at emit time, not from optimistic client state.

#### `queue.removed`

Emitted to an entire `doctor:<doctorId>` room when an appointment is **deleted** (hard-delete, not status change). In practice this only occurs if `DELETE /api/appointments/:id` is called. Status changes (cancel, complete) use `queue.updated` instead.

```typescript
interface QueueRemovedEvent {
  appointmentId: string;
  doctorId: string;
}
```

---

### 1.9 Client → Server Events

#### `queue.subscribe`

Sent by JWT clients to join a doctor's room.

**Payload**: `SubscribeDto` — `{ doctorId: string }`  
**Access control**:
- `ADMIN` and `RECEPTIONIST`: may subscribe to any doctor
- `DOCTOR`: may only subscribe to their own `doctorProfileId`; subscribing to another doctor's room emits `exception` and is rejected

**On success**: client is joined to `doctor:<doctorId>` room and immediately receives `queue.snapshot`.

#### `queue.unsubscribe`

Sent by JWT clients to leave a doctor's room.

**Payload**: `SubscribeDto` — `{ doctorId: string }`  
**Behavior**: removes the socket from `doctor:<doctorId>` room. No acknowledgement event emitted.

---

### 1.10 `QueueService` Methods

```typescript
class QueueService {
  // Build snapshot for one doctor (today's active appointments)
  async buildSnapshot(doctorId: string): Promise<QueueSnapshotEvent>;

  // Emit queue.updated to a doctor's room after a status change
  async emitUpdated(appointmentId: string, doctorId: string): Promise<void>;

  // Emit queue.removed to a doctor's room after an appointment is deleted
  async emitRemoved(appointmentId: string, doctorId: string): Promise<void>;

  // Calculate position rank for all active appointments of a doctor today
  private async calculatePositions(doctorId: string): Promise<Map<string, number>>;
}
```

`QueueService` is exported from `QueueModule` so that `AppointmentsModule` can inject it and call `emitUpdated` / `emitRemoved` after mutations.

---

### 1.11 Integration Points (Callers of QueueService)

| Triggering Action | Module | QueueService Call |
|---|---|---|
| Appointment status changed (PATCH /:id/status) | AppointmentsModule | `emitUpdated(appointmentId, doctorId)` |
| Appointment rescheduled (PATCH /:id) | AppointmentsModule | `emitUpdated(appointmentId, doctorId)` |
| Appointment deleted (DELETE /:id) | AppointmentsModule | `emitRemoved(appointmentId, doctorId)` |
| Waitlist offer accepted → new appointment created | WaitlistModule | `emitUpdated(newAppointmentId, doctorId)` |
| Appointment created (POST /) — new booking | AppointmentsModule | `emitUpdated(appointmentId, doctorId)` |

---

### 1.12 Prisma Models Used

```prisma
// Read-only — QueueModule does not write to any table
model Appointment {
  id          String            @id @default(uuid())
  doctorId    String
  startsAt    DateTime
  endsAt      DateTime
  status      AppointmentStatus
  notes       String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  doctor      DoctorProfile     @relation(...)
}

enum AppointmentStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELED
  NO_SHOW
}
```

`buildSnapshot()` queries:
```sql
SELECT id, status, startsAt, endsAt, notes
FROM "Appointment"
WHERE doctorId = :doctorId
  AND status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS')
  AND DATE(startsAt AT TIME ZONE :clinicTimezone) = :today
ORDER BY startsAt ASC
```

---

### 1.13 Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `KIOSK_TOKEN_SECRET` | HMAC secret for signing kiosk JWTs | (required) |
| `KIOSK_TOKEN_DEFAULT_EXPIRY_DAYS` | Default kiosk token lifetime | `30` |

Add to `backend/.env.example`:
```
KIOSK_TOKEN_SECRET=...
KIOSK_TOKEN_DEFAULT_EXPIRY_DAYS=30
```

---

## Phase 2 — Unit & E2E Tests

### 2.1 Unit Tests: `KioskTokenService` (`src/queue/kiosk-token.service.spec.ts`)

| Scenario | Expected |
|---|---|
| `sign(doctorId, 30)` | Returns a non-empty string JWT |
| `verify(<valid-token>)` | Returns `{ doctorId: '<uuid>' }` |
| `verify(<expired-token>)` | Returns `null` |
| `verify(<token-wrong-secret>)` | Returns `null` |
| `verify(<malformed-string>)` | Returns `null` |
| `verify(<token-type-not-kiosk>)` | Returns `null` (type guard on payload) |
| Signed payload contains `type: 'kiosk'` | `jwt.decode()` on result confirms `type` field |
| Expiry in token matches `expiresInDays` | `exp - iat ≈ expiresInDays * 86400` (±5s) |

---

### 2.2 Unit Tests: `QueueService` (`src/queue/queue.service.spec.ts`)

Mock `PrismaService` and `ClinicConfigService`. Mock the Socket.IO server (`@WebSocketServer()` instance) as a jest mock.

#### `buildSnapshot()`

| Scenario | Setup | Expected |
|---|---|---|
| No appointments today | DB returns empty array | `items = []` |
| Three active appointments | `startsAt` at 10:00, 10:30, 11:00; all `CONFIRMED` | Three items, positions 1, 2, 3 in order |
| Mix of active + excluded | One `IN_PROGRESS`, one `COMPLETED`, one `CONFIRMED` | Two items returned; COMPLETED excluded |
| All excluded statuses | DB has only `COMPLETED`, `CANCELED`, `NO_SHOW` | `items = []` |
| Date scoping | Appointment yesterday (UTC but today in clinic TZ) | Correct timezone applied; appointment included |
| `notes` field | Appointment has notes `"Check upper molar"` | Item includes `notes: "Check upper molar"` |
| Position recalculation after cancel | Item 2 of 3 is CANCELED → two remaining items | Positions are 1, 2 (no gap) |

#### `emitUpdated()`

| Scenario | Expected |
|---|---|
| Called with valid appointmentId | Fetches current status from DB, recalculates positions, emits to `doctor:<doctorId>` room |
| Appointment moves to `COMPLETED` | `position: null` in emitted event |
| Appointment moves to `CONFIRMED` | `position` is recalculated integer |
| appointmentId does not exist in DB | Logs warning; emits `queue.removed` instead |

#### `emitRemoved()`

| Scenario | Expected |
|---|---|
| Called for deleted appointment | Emits `queue.removed` to `doctor:<doctorId>` room with correct payload |

---

### 2.3 Unit Tests: `QueueGateway` (`src/queue/queue.gateway.spec.ts`)

Use `Test.createTestingModule` with mocked `QueueService` and `KioskTokenService`. Create mock sockets via `{ id: 'socket-1', data: {}, join: jest.fn(), leave: jest.fn(), emit: jest.fn(), disconnect: jest.fn() }`.

#### `handleConnection()`

| Scenario | Setup | Expected |
|---|---|---|
| Valid JWT in `socket.auth.token` | JwtService verifies → user with RECEPTIONIST role | `socket.data.user` populated; no disconnect |
| Valid kiosk token in `socket.auth.kioskToken` | KioskTokenService verifies → `{ doctorId }` | `socket.data.kiosk` populated; socket joins `doctor:<doctorId>` room; `queue.snapshot` emitted |
| Invalid JWT | JwtService throws | `socket.disconnect(true)` called |
| Invalid kiosk token | `verify()` returns `null` | `socket.disconnect(true)` called |
| PATIENT role JWT | Valid JWT but role = PATIENT | `socket.disconnect(true)` called; `exception` event emitted |
| No auth provided | Neither `token` nor `kioskToken` present | `socket.disconnect(true)` called |

#### `handleSubscribe()`

| Scenario | Setup | Expected |
|---|---|---|
| RECEPTIONIST subscribes to any doctor | Valid doctorId | `socket.join('doctor:<doctorId>')` called; `queue.snapshot` emitted to socket |
| DOCTOR subscribes to own doctorProfileId | `socket.data.user.doctorProfileId === doctorId` | Joined; snapshot emitted |
| DOCTOR subscribes to another doctor's room | `doctorProfileId !== doctorId` | `exception` emitted; `join` NOT called |
| Invalid UUID payload | `doctorId: "not-a-uuid"` | `exception` emitted; `join` NOT called |
| Missing doctorId | `{}` payload | `exception` emitted |
| Kiosk socket calls subscribe | `socket.data.kiosk` is set | `exception` emitted (kiosks auto-subscribe; they cannot re-subscribe) |

#### `handleUnsubscribe()`

| Scenario | Expected |
|---|---|
| Valid doctorId | `socket.leave('doctor:<doctorId>')` called |
| Socket not in room | `leave()` still called (idempotent in Socket.IO) |
| Kiosk socket calls unsubscribe | `exception` emitted; leave NOT called |

#### `handleDisconnect()`

| Scenario | Expected |
|---|---|
| Any authenticated socket disconnects | No error thrown; structured log emitted with `userId` or `doctorId` and reason |

---

### 2.4 E2E Tests (`test/queue.e2e-spec.ts`)

Test environment: full NestJS bootstrap with real PostgreSQL (test DB), real Redis (BullMQ), and a real Socket.IO server on a random port. Use `socket.io-client` to connect from tests.

Seed helpers (extend `test/helpers/seed.ts`):
- `seedAppointment(doctorId, startsAt, status, overrides?)` — inserts an `Appointment` row
- `seedDoctor()` — creates a `User` with role `DOCTOR` + `DoctorProfile`
- `seedStaff(role)` — creates a `User` with role `ADMIN` or `RECEPTIONIST`
- `loginUser(email, password)` → returns `accessToken`

#### Flow 1 — Kiosk Token Issue & Connect

```
POST /api/queue/kiosk-token  (as receptionist)
  body: { doctorId: doctor-A.id }
  → 201, body has { token, lobbyUrl }

Connect to /queue namespace with { auth: { kioskToken: token } }
  → connected = true
  → receive 'queue.snapshot' event immediately with doctorId = doctor-A.id
```

#### Flow 2 — Kiosk Connection: Snapshot Contents

```
seed: doctor-A has 3 appointments today
  #1 10:00  CONFIRMED
  #2 10:30  IN_PROGRESS
  #3 11:00  PENDING

Connect as kiosk for doctor-A
  → receive queue.snapshot
  → items length = 3
  → items[0].appointmentId = #2 (IN_PROGRESS? No — ordered by startsAt ASC)
  → actually items[0] = #1 (position 1, startsAt earliest), items[1] = #2, items[2] = #3
  → items[1].status = 'IN_PROGRESS'
  → none of items contain patientId, patientName, phone
```

#### Flow 3 — Staff Subscribe + Snapshot

```
Login as RECEPTIONIST → accessToken

Connect to /queue with { auth: { token: accessToken } }
  → connected (no auto-subscription, no immediate snapshot)

Emit 'queue.subscribe' { doctorId: doctor-A.id }
  → receive 'queue.snapshot' for doctor-A
  → items match seeded appointments
```

#### Flow 4 — Doctor Can Only Subscribe to Own Room

```
Login as doctor-B → accessToken

Connect to /queue with { auth: { token: accessToken } }

Emit 'queue.subscribe' { doctorId: doctor-A.id }  (doctor-A ≠ doctor-B)
  → receive 'exception' event
  → NOT joined to doctor-A room

Emit 'queue.subscribe' { doctorId: doctor-B.doctorProfileId }
  → receive 'queue.snapshot' for doctor-B
```

#### Flow 5 — queue.updated on Status Change

```
seed: doctor-A has appointment #1 (CONFIRMED)

Connect client-1 (receptionist) subscribed to doctor-A room
Connect client-2 (kiosk for doctor-A)

PATCH /api/appointments/#1/status  { status: 'IN_PROGRESS' }  (as doctor-A JWT)
  → both client-1 and client-2 receive 'queue.updated':
      { appointmentId: #1.id, doctorId: doctor-A.id, status: 'IN_PROGRESS', position: 1, updatedAt: <ISO> }
```

#### Flow 6 — queue.updated on Completion (position: null)

```
seed: doctor-A has appointment #1 (IN_PROGRESS)

Connect client-1 subscribed to doctor-A room

PATCH /api/appointments/#1/status  { status: 'COMPLETED' }
  → client-1 receives 'queue.updated':
      { appointmentId: #1.id, status: 'COMPLETED', position: null, updatedAt: <ISO> }
```

#### Flow 7 — queue.removed on Delete

```
seed: doctor-A has appointment #1 (CONFIRMED)

Connect client-1 subscribed to doctor-A room

DELETE /api/appointments/#1  (as receptionist)
  → client-1 receives 'queue.removed':
      { appointmentId: #1.id, doctorId: doctor-A.id }
```

#### Flow 8 — New Booking Triggers queue.updated

```
seed: doctor-A has 0 appointments

Connect client-1 subscribed to doctor-A room

POST /api/appointments  { doctorId: doctor-A.id, startsAt: <tomorrow 10:00> }
  → client-1 receives 'queue.updated':
      { appointmentId: <new-id>, doctorId: doctor-A.id, status: 'PENDING', position: 1, ... }
```

> Note: If the booked slot is for a future date (not today), `position` will be `null` because the snapshot query is date-scoped to today.

#### Flow 9 — Invalid Kiosk Token Rejected

```
Connect to /queue with { auth: { kioskToken: 'invalid-garbage' } }
  → receive 'exception' { status: 'error', message: 'Unauthorized' }
  → connection closed (disconnect event fired)
```

#### Flow 10 — Expired Kiosk Token Rejected

```
issue kiosk token with expiresInDays: 0  (effectively expired immediately)
(or mock time)

Connect to /queue with that token
  → 'exception' received
  → disconnected
```

#### Flow 11 — Unsubscribe

```
Connect client-1 (receptionist)
Emit 'queue.subscribe' { doctorId: doctor-A.id }
  → joined room

PATCH /api/appointments/#1/status ...
  → client-1 receives 'queue.updated'

Emit 'queue.unsubscribe' { doctorId: doctor-A.id }
  → left room

PATCH /api/appointments/#1/status ...
  → client-1 does NOT receive 'queue.updated'
```

#### Flow 12 — Multi-Doctor Receptionist

```
Connect client-1 (receptionist)
Emit 'queue.subscribe' { doctorId: doctor-A.id }
Emit 'queue.subscribe' { doctorId: doctor-B.id }
  → joined both rooms

PATCH doctor-A appointment → client-1 receives queue.updated (doctor-A)
PATCH doctor-B appointment → client-1 receives queue.updated (doctor-B)
```

---

### 2.5 Test Setup & Teardown

```typescript
// test/queue.e2e-spec.ts (outline)
let app: INestApplication;
let prisma: PrismaService;
let httpServer: HttpServer;
let serverAddress: string;

beforeAll(async () => {
  app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  prisma = app.get(PrismaService);
  httpServer = app.getHttpServer();
  await app.init();
  // get the actual port (random port to avoid conflicts)
  await new Promise<void>((r) => httpServer.listen(0, () => r()));
  const port = (httpServer.address() as AddressInfo).port;
  serverAddress = `http://localhost:${port}`;
});

afterEach(async () => {
  await prisma.appointment.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.user.deleteMany();
  // disconnect all test sockets
  for (const socket of openSockets) socket.disconnect();
  openSockets.length = 0;
});

afterAll(async () => {
  await app.close();
});
```

**Socket.io-client helper**:

```typescript
function connectAsKiosk(serverAddr: string, token: string): Socket {
  const s = io(`${serverAddr}/queue`, { auth: { kioskToken: token }, transports: ['websocket'] });
  openSockets.push(s);
  return s;
}

function connectAsJwt(serverAddr: string, accessToken: string): Socket {
  const s = io(`${serverAddr}/queue`, { auth: { token: accessToken }, transports: ['websocket'] });
  openSockets.push(s);
  return s;
}

function waitForEvent<T>(socket: Socket, event: string, timeout = 3000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for '${event}'`)), timeout);
    socket.once(event, (data: T) => { clearTimeout(timer); resolve(data); });
  });
}
```

---

## Phase 3 — Frontend Integration

> **Frontend implementation status**: All four queue-related frontend specs are written. This phase defines the integration contract each page must satisfy against this module.

---

### 3.1 Frontend Pages & Their Socket.IO Usage

| Page | Spec | Auth Method | Rooms Subscribed | Events Consumed |
|---|---|---|---|---|
| Lobby Queue (`/lobby/:doctorId`) | [006](../006-lobby-queue-page/spec.md) | Kiosk token (from URL `?kt=`) | `doctor:<doctorId>` (auto) | `queue.snapshot`, `queue.updated` |
| Staff Queue (`/staff/queue`) | [014](../014-staff-queue-page/spec.md) | JWT (user session) | `doctor:<each-visible-doctorId>` | `queue.snapshot`, `queue.updated`, `queue.removed` |
| Doctor Queue (`/doctor/queue`) | [023](../023-doctor-queue-page/spec.md) | JWT (user session) | `doctor:<own-doctorProfileId>` | `queue.snapshot`, `queue.updated`, `queue.removed` |
| Doctor Today (`/doctor/today`) | [024](../024-doctor-today-page/spec.md) | JWT (user session) | `doctor:<own-doctorProfileId>` | `queue.updated` (refresh badge only) |

---

### 3.2 Kiosk Token Flow (Lobby Display)

The lobby display at `/lobby/:doctorId` obtains its kiosk token from the URL query param `?kt=<token>`. The token is provisioned by a receptionist or admin using:

```
POST /api/queue/kiosk-token  { doctorId }
→ response includes { token, lobbyUrl }
```

The `lobbyUrl` is the full URL to paste into the display device's browser. The frontend must:

1. Read `doctorId` from `useParams()` and `kt` from `useSearchParams()`
2. Pass the token to the socket connection: `io('/queue', { auth: { kioskToken: kt } })`
3. On `connect_error` (bad/expired token): show a full-screen error state with a human-readable message and a QR code or URL to request a new token from staff

```typescript
// frontend/src/features/queue/hooks/useLobbySocket.ts (sketch)
export function useLobbySocket(doctorId: string, kioskToken: string) {
  const [snapshot, setSnapshot] = useState<QueueSnapshotEvent | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io('/queue', {
      auth: { kioskToken },
      transports: ['websocket'],
    });
    socket.on('connect', () => setConnected(true));
    socket.on('queue.snapshot', setSnapshot);
    socket.on('queue.updated', (event: QueueUpdatedEvent) => {
      setSnapshot((prev) => applyUpdatedEvent(prev, event));
    });
    socket.on('connect_error', (err) => setError(err.message));
    return () => { socket.disconnect(); };
  }, [kioskToken]);

  return { snapshot, connected, error };
}
```

**`applyUpdatedEvent` merges the event into the snapshot** — see §3.5.

---

### 3.3 JWT Socket Hook (Staff and Doctor Pages)

```typescript
// frontend/src/features/queue/hooks/useQueueSocket.ts (sketch)
export function useQueueSocket(doctorIds: string[]) {
  const { accessToken } = useAuthContext();
  const [snapshots, setSnapshots] = useState<Record<string, QueueSnapshotEvent>>({});

  useEffect(() => {
    const socket = io('/queue', {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      doctorIds.forEach((id) => socket.emit('queue.subscribe', { doctorId: id }));
    });

    socket.on('queue.snapshot', (data: QueueSnapshotEvent) => {
      setSnapshots((prev) => ({ ...prev, [data.doctorId]: data }));
    });

    socket.on('queue.updated', (event: QueueUpdatedEvent) => {
      setSnapshots((prev) => applyUpdatedToSnapshot(prev, event));
    });

    socket.on('queue.removed', (event: QueueRemovedEvent) => {
      setSnapshots((prev) => applyRemovedToSnapshot(prev, event));
    });

    socket.on('exception', (err) => console.error('Socket error:', err));

    return () => {
      doctorIds.forEach((id) => socket.emit('queue.unsubscribe', { doctorId: id }));
      socket.disconnect();
    };
  }, [accessToken, doctorIds.join(',')]);

  return { snapshots };
}
```

---

### 3.4 Shared Frontend Type Contract

The frontend `types/queue.ts` must match the server event payloads exactly:

```typescript
// types/queue.ts

export interface QueueItem {
  appointmentId: string;
  position: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELED' | 'NO_SHOW';
  startsAt: string;   // ISO 8601 UTC
  endsAt: string;     // ISO 8601 UTC
  notes: string | null;
}

export interface QueueSnapshotEvent {
  doctorId: string;
  date: string;         // "YYYY-MM-DD" in clinic timezone
  items: QueueItem[];
}

export interface QueueUpdatedEvent {
  appointmentId: string;
  doctorId: string;
  status: QueueItem['status'];
  position: number | null;
  updatedAt: string;
}

export interface QueueRemovedEvent {
  appointmentId: string;
  doctorId: string;
}
```

---

### 3.5 Client-Side Snapshot Merging Logic

Both lobby and staff hooks merge incremental `queue.updated` events into their cached snapshot rather than re-fetching. The merge function:

```typescript
function applyUpdatedEvent(
  snapshot: QueueSnapshotEvent | null,
  event: QueueUpdatedEvent
): QueueSnapshotEvent | null {
  if (!snapshot || snapshot.doctorId !== event.doctorId) return snapshot;

  const ACTIVE = new Set(['PENDING', 'CONFIRMED', 'IN_PROGRESS']);
  const isActive = ACTIVE.has(event.status);

  let items = snapshot.items.filter((i) => i.appointmentId !== event.appointmentId);

  if (isActive) {
    // Upsert the item; position from server is authoritative
    items = [
      ...items,
      {
        appointmentId: event.appointmentId,
        position: event.position!,
        status: event.status,
        startsAt: /* retain from existing or re-fetch */ '',
        endsAt: '',
        notes: null,
      },
    ].sort((a, b) => a.position - b.position);
  }

  return { ...snapshot, items };
}
```

> **Note for implementers**: The merge needs `startsAt` / `endsAt` which are not in `queue.updated`. Options:
> 1. Include `startsAt` and `endsAt` in `queue.updated` (recommended — minimal overhead)
> 2. Retain the existing item's times when upserting (safe if the slot didn't change)
>
> **Decision**: Add `startsAt` and `endsAt` to `QueueUpdatedEvent` (see §3.6 below).

---

### 3.6 Extended `QueueUpdatedEvent` for Frontend

To avoid a full re-fetch on every status change, `queue.updated` should include the appointment's time fields:

```typescript
// server emits (extend §1.8 QueueUpdatedEvent):
interface QueueUpdatedEvent {
  appointmentId: string;
  doctorId: string;
  status: AppointmentStatus;
  position: number | null;
  startsAt: string;          // ISO 8601 UTC — included to allow client-side upsert
  endsAt: string;            // ISO 8601 UTC
  notes: string | null;
  updatedAt: string;
}
```

This eliminates the need for the frontend to retain time data from the snapshot and simplifies the merge function.

---

### 3.7 Privacy Contract

The backend **must never** include patient PII in any Socket.IO event:

| Field | In events? |
|---|---|
| Patient name | ❌ Never |
| Patient phone | ❌ Never |
| Patient email | ❌ Never |
| Patient ID (UUID) | ❌ Never |
| Appointment ID (UUID) | ✅ Yes — opaque identifier |
| Position number | ✅ Yes — positional label only |
| Status, times, notes | ✅ Yes |

The lobby display spec (006) derives "Patient #3" display labels from `item.position`. The staff queue (014) maps `appointmentId` to patient details using its REST-fetched appointment list (polled every 30s). These are separate concerns and must never be merged in the WebSocket layer.

---

### 3.8 Token Refresh & Reconnection

The access JWT used for Socket.IO expires (default 15m). The frontend must handle reconnection with a fresh token:

```typescript
socket.on('connect_error', async (err) => {
  if (err.message === 'Unauthorized') {
    // Attempt silent token refresh via REST
    const newToken = await refreshAccessToken();
    if (newToken) {
      socket.auth = { token: newToken };
      socket.connect();   // reconnect with new token
    } else {
      // Redirect to login
    }
  }
});
```

The socket must re-emit `queue.subscribe` on reconnect because room membership is not persisted across disconnections.

---

### 3.9 Connection Status Indicator

All three authenticated queue pages (006, 014, 023) show a live connection status indicator. The frontend should track:

| State | Indicator |
|---|---|
| Connected | Green dot · "Live" |
| Reconnecting | Yellow dot · "Reconnecting…" |
| Disconnected | Red dot · "Offline — data may be stale" |

Backend requirement: the gateway must not emit events to disconnected sockets. Socket.IO handles this automatically, but `QueueService.emitUpdated()` should target the room (not individual sockets) to avoid stale-socket issues.

---

### 3.10 Development Checklist (Backend ↔ Frontend)

- [ ] `POST /api/queue/kiosk-token` accepts `{ doctorId }`, returns `{ token, lobbyUrl, expiresAt }`
- [ ] Kiosk token connects to `/queue` namespace without a user JWT
- [ ] Kiosk connection automatically joins `doctor:<doctorId>` room and receives `queue.snapshot`
- [ ] JWT connection (RECEPTIONIST) can subscribe to any doctor room via `queue.subscribe`
- [ ] JWT connection (DOCTOR) is rejected when subscribing to another doctor's room; `exception` event received
- [ ] `queue.snapshot` items are ordered by `position` ascending (= `startsAt` ascending)
- [ ] `queue.snapshot` items exclude `COMPLETED`, `CANCELED`, `NO_SHOW` appointments
- [ ] `queue.snapshot` items contain no patient PII
- [ ] `queue.updated` is emitted to the room after every status change in `AppointmentsModule`
- [ ] `queue.updated` includes `startsAt`, `endsAt`, `notes`, and `position` (per §3.6)
- [ ] `queue.updated` sets `position: null` when status moves to `COMPLETED`/`CANCELED`/`NO_SHOW`
- [ ] `queue.removed` is emitted after `DELETE /api/appointments/:id`
- [ ] Frontend lobby page reads `?kt=` from URL and uses it as kiosk token
- [ ] Frontend staff queue page subscribes to all visible doctor rooms on mount
- [ ] Frontend doctor queue page subscribes only to own `doctorProfileId` room
- [ ] Token expiry triggers reconnect flow: silent refresh → re-subscribe → snapshot received
- [ ] Expired kiosk token shows full-screen error on lobby display (not a blank screen)
- [ ] CORS allows `http://localhost:5173` with credentials for Socket.IO handshake

---

## Acceptance Criteria

### Gateway Behaviour

- [ ] Kiosk token with invalid signature → connection rejected
- [ ] Kiosk token with valid signature for unknown doctor → still connected but `queue.snapshot` has `items: []`
- [ ] PATIENT role JWT → connection rejected immediately
- [ ] DOCTOR JWT subscribing to another doctor → `exception` emitted; room NOT joined
- [ ] Receptionist subscribes to two doctor rooms → receives independent `queue.snapshot` for each
- [ ] After `queue.unsubscribe`, no further `queue.updated` events received for that room
- [ ] Kiosk socket cannot call `queue.subscribe` or `queue.unsubscribe` (rejected with `exception`)

### Event Correctness

- [ ] `queue.snapshot` items are sorted by `startsAt` ASC; positions are contiguous integers starting at 1
- [ ] `queue.snapshot` excludes `COMPLETED`, `CANCELED`, `NO_SHOW` appointments
- [ ] `queue.updated` emitted within 200ms of the REST mutation completing (same process; no BullMQ hop)
- [ ] `queue.updated.position` is `null` for statuses outside the active set
- [ ] `queue.removed` emitted on appointment hard-delete; not emitted on cancellation (which uses `queue.updated`)
- [ ] New appointment booking emits `queue.updated` with `status: 'PENDING'` and correct `position`
- [ ] Waitlist offer acceptance emits `queue.updated` for the newly created appointment

### Kiosk Token REST Endpoint

- [ ] `POST /api/queue/kiosk-token` requires ADMIN or RECEPTIONIST role → `403` otherwise
- [ ] `doctorId` not found → `404`
- [ ] `expiresInDays` out of range (0 or >365) → `400`
- [ ] `expiresInDays` defaults to 30 when omitted
- [ ] Response includes `lobbyUrl` pointing to `${FRONTEND_URL}/lobby/<doctorId>?kt=<token>`

### Test Coverage

- [ ] All unit test scenarios in §2.1, §2.2, §2.3 pass: `pnpm test src/queue`
- [ ] All E2E flows in §2.4 pass: `pnpm test:e2e -- --testPathPattern=queue`
- [ ] Unit coverage for `QueueService` ≥ 90% branch coverage
- [ ] Unit coverage for `KioskTokenService` = 100% (small, critical)
