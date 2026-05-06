# Spec: ClinicConfigModule (`backend/src/clinic-config/`)

**Type**: Backend NestJS Module  
**Plan reference**: [BACKEND_PLAN.md — §4 ClinicConfigModule](../../BACKEND_PLAN.md#4-cliniconfigmodule)  
**Frontend specs consumed**: [019-clinic-settings-page](../019-clinic-settings-page/spec.md), [010-booking-page](../010-booking-page/spec.md), [017-walk-in-booking-page](../017-walk-in-booking-page/spec.md)

---

## Overview

ClinicConfigModule owns three closely related concerns:

1. **Singleton clinic config** — global settings that drive slot generation and notification timing: timezone, slot duration, reminder schedule, waitlist offer window, and minimum arrival buffer.
2. **Working hours** — one row per weekday (0–6) defining daily open/close times or a `isClosed` flag.
3. **Holidays** — calendar dates that mark clinic closures and block slot generation entirely.

The split between read access and write access is deliberate: all three entities are **public for reads** (the booking page needs them without authentication) but **admin-only for writes**.

ClinicConfigModule is a cross-cutting dependency: `AppointmentsModule` (slot generator) and `WaitlistOfferEngineModule` both import it. Changing any setting here has downstream effects on available slots, offer expiry windows, and reminder delivery times.

Two personas interact with this module:
- **Public (unauthenticated)**: read-only access to config, working hours, and holidays — required by the booking page to render slots and display clinic hours.
- **Admin**: full read/write access to all three resource types.

---

## Phase 1 — DTOs & Validation

### 1.1 File Map

```
backend/src/clinic-config/
├── clinic-config.module.ts
├── clinic-config.controller.ts
├── clinic-config.service.ts
└── dto/
    ├── update-clinic-config.dto.ts
    ├── working-hour.dto.ts
    └── create-holiday.dto.ts
```

---

### 1.2 `UpdateClinicConfigDto`

```typescript
// PATCH /api/clinic-config  (admin only)
class UpdateClinicConfigDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  timeZone?: string;          // Must be a valid IANA timezone string (e.g. "Asia/Riyadh")

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(180)
  @IsMultipleOf(5)            // Custom decorator: value % 5 === 0
  slotDurationMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  reminderHoursBefore?: number;

  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(1440)
  offerWindowMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
  minArrivalMinutes?: number;
}
```

**Validation rules**:
- `timeZone` must be a valid IANA timezone identifier (validate with `Intl.supportedValuesOf('timeZone')` or the `luxon`/`dayjs-timezone` equivalents); invalid values return `400`
- All numeric fields must be integers; float values return `400`
- `slotDurationMinutes` must be a multiple of 5 — enforce via a custom `@IsMultipleOf(5)` decorator built on `registerDecorator`
- All fields are optional; omitted fields are not updated (partial PATCH semantics)
- Since `ClinicConfig` is a singleton, the service always upserts the single row (never inserts a second row)

**Response** (`200`):
```json
{
  "statusCode": 200,
  "data": {
    "id": "clxyz...",
    "timeZone": "Asia/Riyadh",
    "slotDurationMinutes": 30,
    "reminderHoursBefore": 24,
    "offerWindowMinutes": 30,
    "minArrivalMinutes": 45,
    "updatedAt": "2026-05-05T10:00:00.000Z"
  }
}
```

---

### 1.3 `WorkingHourDto`

Used for both individual item shape in responses and as the element type in the replace-all `PUT` body.

```typescript
// PUT /api/clinic-config/working-hours  (admin only)
// Body: WorkingHourDto[]  (array of exactly 7 items, one per dayOfWeek 0-6)

class WorkingHourDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;          // 0 = Sunday, 6 = Saturday

  @IsBoolean()
  isClosed: boolean;

  @ValidateIf((o) => !o.isClosed)
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
  startTime: string | null;

  @ValidateIf((o) => !o.isClosed)
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
  endTime: string | null;
}
```

**Validation rules**:
- The request body must contain exactly 7 items, one per day of week (0–6); duplicate `dayOfWeek` values → `400`
- `startTime` and `endTime` are required when `isClosed = false`; must be null (or omitted) when `isClosed = true`
- `endTime` must be strictly after `startTime` (lexicographic comparison is valid for `HH:mm` strings); violation → `400`
- The replace operation is atomic: all 7 working hour rows are deleted and re-inserted in a single Prisma transaction
- `GET /api/clinic-config/working-hours` always returns exactly 7 items even if the DB has fewer (missing days treated as `isClosed: true` with null times)

**Response** (`200`) for both `GET` and `PUT`:
```json
{
  "statusCode": 200,
  "data": [
    { "id": "clxyz...", "dayOfWeek": 0, "isClosed": true,  "startTime": null,    "endTime": null    },
    { "id": "clxyz...", "dayOfWeek": 1, "isClosed": false, "startTime": "09:00", "endTime": "17:00" },
    { "id": "clxyz...", "dayOfWeek": 2, "isClosed": false, "startTime": "09:00", "endTime": "17:00" },
    { "id": "clxyz...", "dayOfWeek": 3, "isClosed": false, "startTime": "09:00", "endTime": "17:00" },
    { "id": "clxyz...", "dayOfWeek": 4, "isClosed": false, "startTime": "09:00", "endTime": "17:00" },
    { "id": "clxyz...", "dayOfWeek": 5, "isClosed": false, "startTime": "09:00", "endTime": "13:00" },
    { "id": "clxyz...", "dayOfWeek": 6, "isClosed": true,  "startTime": null,    "endTime": null    }
  ]
}
```

---

### 1.4 `CreateHolidayDto`

```typescript
// POST /api/clinic-config/holidays  (admin only)
class CreateHolidayDto {
  @IsDateString()
  date: string;               // YYYY-MM-DD; interpreted as a calendar date (no time component)

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;               // Admin-provided label, e.g. "National Day"
}
```

**Validation rules**:
- `date` must be a valid calendar date string in `YYYY-MM-DD` format (ISO 8601 date); reject time-bearing strings
- `date` must not be in the past relative to the clinic timezone; violation → `400` with message `"Holiday date must be today or in the future"`
- Duplicate `date` → `409 Conflict` with message `"A holiday already exists for this date"`
- `name` trimmed server-side; blank-after-trim → `400`

**Response** (`201`):
```json
{
  "statusCode": 201,
  "data": {
    "id": "clxyz...",
    "date": "2026-12-25",
    "name": "Christmas",
    "createdAt": "2026-05-05T10:00:00.000Z"
  }
}
```

**`DELETE /api/clinic-config/holidays/:id`** returns `204 No Content` on success, `404` if the holiday row is not found.

---

### 1.5 `GET /api/clinic-config` — Public Read Response

```json
{
  "statusCode": 200,
  "data": {
    "id": "clxyz...",
    "timeZone": "Asia/Riyadh",
    "slotDurationMinutes": 30,
    "reminderHoursBefore": 24,
    "offerWindowMinutes": 30,
    "minArrivalMinutes": 45,
    "updatedAt": "2026-05-05T10:00:00.000Z"
  }
}
```

This endpoint is decorated with `@Public()` and excluded from `JwtAuthGuard`. Both the booking page and the admin settings page call it.

---

### 1.6 Prisma Models Used

```prisma
model ClinicConfig {
  id                  String   @id @default(cuid())
  slotDurationMinutes Int      @default(30)
  timeZone            String   @default("UTC")
  reminderHoursBefore Int      @default(24)
  offerWindowMinutes  Int      @default(30)
  minArrivalMinutes   Int      @default(45)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model WorkingHour {
  id        String   @id @default(cuid())
  dayOfWeek Int                          // 0-6 (Sunday-Saturday)
  startTime String?                      // HH:mm; null when isClosed
  endTime   String?                      // HH:mm; null when isClosed
  isClosed  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([dayOfWeek])
}

model Holiday {
  id        String   @id @default(cuid())
  date      DateTime @db.Date
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([date])
}
```

**Singleton enforcement**: The service method `getConfig()` performs `prisma.clinicConfig.upsert` on a well-known seed row (e.g. `where: { id: 'singleton' }`). The initial migration seeds one row. No code path ever creates a second row.

---

## Phase 2 — Unit & E2E Tests

### 2.1 Unit Tests (`src/clinic-config/clinic-config.service.spec.ts`)

Mock `PrismaService` with jest stubs. Do **not** hit a real database in unit tests.

#### `getConfig()`

| Scenario | Expected |
|---|---|
| Row exists in DB | Returns the singleton `ClinicConfig` row |
| No row exists (fresh DB, seed not run) | Service upserts and returns defaults |

#### `updateConfig(dto)`

| Scenario | Expected |
|---|---|
| Valid partial update (subset of fields) | Only provided fields updated; others unchanged |
| `slotDurationMinutes: 25` (not a multiple of 5) | `BadRequestException` (400) |
| `timeZone: "Invalid/Zone"` | `BadRequestException` (400) with message indicating invalid timezone |
| `reminderHoursBefore: 0` | `BadRequestException` (400) |
| `reminderHoursBefore: 169` | `BadRequestException` (400) |
| Empty body `{}` | Returns current config unchanged |

#### `getWorkingHours()`

| Scenario | Expected |
|---|---|
| All 7 days exist in DB | Returns array of 7 sorted by `dayOfWeek` |
| DB has 5 days (missing 2) | Returns 7 items; missing days filled with `{ isClosed: true, startTime: null, endTime: null }` |
| DB is empty | Returns 7 closed-day defaults |

#### `replaceWorkingHours(dtos)`

| Scenario | Expected |
|---|---|
| Valid 7-item array | Deletes all existing rows, inserts 7 new rows in transaction; returns new array |
| `isClosed: false` but `startTime` null | `BadRequestException` (400) |
| `isClosed: true` but `startTime` provided | `BadRequestException` (400) |
| `endTime` before `startTime` (e.g. start `"14:00"`, end `"09:00"`) | `BadRequestException` (400) |
| Duplicate `dayOfWeek` values in input array | `BadRequestException` (400) |
| Input array has 6 items (missing one day) | `BadRequestException` (400) |
| Prisma transaction throws mid-insert | Rolls back; original rows preserved |

#### `getHolidays()`

| Scenario | Expected |
|---|---|
| Holidays exist | Returns array sorted ascending by `date` |
| No holidays | Returns empty array `[]` |

#### `createHoliday(dto)`

| Scenario | Expected |
|---|---|
| Valid future date, unique | Creates row; returns holiday with `id`, `date`, `name`, `createdAt` |
| Date in the past (clinic timezone) | `BadRequestException` (400) |
| Duplicate `date` | `ConflictException` (409) |
| `name` is blank after trim | `BadRequestException` (400) |
| Invalid `date` string (not YYYY-MM-DD) | Class-validator rejects; 400 |

#### `deleteHoliday(id)`

| Scenario | Expected |
|---|---|
| Valid ID, row exists | Deletes row; returns `undefined` (204) |
| ID not found | `NotFoundException` (404) |

---

### 2.2 Controller Unit Tests (`src/clinic-config/clinic-config.controller.spec.ts`)

Test guard wiring and HTTP status codes without re-testing service logic.

| Endpoint | Guard applied | Expected status |
|---|---|---|
| `GET /clinic-config` | `@Public()` — no auth | 200 |
| `PATCH /clinic-config` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | 200 |
| `GET /clinic-config/working-hours` | `@Public()` — no auth | 200 |
| `PUT /clinic-config/working-hours` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | 200 |
| `GET /clinic-config/holidays` | `@Public()` — no auth | 200 |
| `POST /clinic-config/holidays` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | 201 |
| `DELETE /clinic-config/holidays/:id` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | 204 |

---

### 2.3 E2E Tests (`test/clinic-config.e2e-spec.ts`)

Test environment: NestJS `Test.createTestingModule` with real Prisma against a test PostgreSQL database.

#### Flow 1 — Public Read Access (No Authentication)

```
GET /api/clinic-config (no token)
  → 200, data has id, timeZone, slotDurationMinutes, reminderHoursBefore, offerWindowMinutes, minArrivalMinutes

GET /api/clinic-config/working-hours (no token)
  → 200, data is array of 7 items

GET /api/clinic-config/holidays (no token)
  → 200, data is array (may be empty)
```

#### Flow 2 — Admin Updates Clinic Config

```
POST /api/auth/login (admin credentials)
  → capture accessToken

PATCH /api/clinic-config (admin token)
  { slotDurationMinutes: 20, timeZone: "Asia/Riyadh" }
  → 200, slotDurationMinutes = 20, timeZone = "Asia/Riyadh"

GET /api/clinic-config (no token)
  → 200, reflects updated values (confirms public read sees latest)

PATCH /api/clinic-config (admin token)
  { slotDurationMinutes: 25 }
  → 400 (not a multiple of 5)

PATCH /api/clinic-config (admin token)
  { timeZone: "Not/AReal/Timezone" }
  → 400

PATCH /api/clinic-config (no token)
  { slotDurationMinutes: 30 }
  → 401

PATCH /api/clinic-config (patient token)
  { slotDurationMinutes: 30 }
  → 403
```

#### Flow 3 — Working Hours Lifecycle

```
PUT /api/clinic-config/working-hours (admin token)
  [
    { dayOfWeek: 0, isClosed: true,  startTime: null,    endTime: null    },
    { dayOfWeek: 1, isClosed: false, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 2, isClosed: false, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 3, isClosed: false, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 4, isClosed: false, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 5, isClosed: false, startTime: "09:00", endTime: "13:00" },
    { dayOfWeek: 6, isClosed: true,  startTime: null,    endTime: null    }
  ]
  → 200, array of 7 items

GET /api/clinic-config/working-hours (no token)
  → 200, matches what was saved

PUT /api/clinic-config/working-hours (admin token, endTime before startTime on day 1)
  → 400

PUT /api/clinic-config/working-hours (admin token, only 6 days supplied)
  → 400

PUT /api/clinic-config/working-hours (admin token, isClosed=false but startTime omitted)
  → 400

PUT /api/clinic-config/working-hours (no token)
  → 401
```

#### Flow 4 — Holidays Lifecycle

```
POST /api/clinic-config/holidays (admin token)
  { date: "2027-01-01", name: "New Year" }
  → 201, data has id, date = "2027-01-01", name = "New Year"

GET /api/clinic-config/holidays (no token)
  → 200, array contains the new holiday

POST /api/clinic-config/holidays (admin token, same date)
  { date: "2027-01-01", name: "Duplicate" }
  → 409

POST /api/clinic-config/holidays (admin token, past date)
  { date: "2024-01-01", name: "Past date" }
  → 400

DELETE /api/clinic-config/holidays/:id (admin token)
  → 204

GET /api/clinic-config/holidays (no token)
  → 200, holiday no longer present

DELETE /api/clinic-config/holidays/00000000-0000-0000-0000-000000000000 (admin token)
  → 404

POST /api/clinic-config/holidays (no token)
  → 401

POST /api/clinic-config/holidays (doctor token)
  → 403
```

#### Flow 5 — Singleton Integrity

```
PATCH /api/clinic-config (admin token) { slotDurationMinutes: 45 }
  → 200

PATCH /api/clinic-config (admin token) { reminderHoursBefore: 48 }
  → 200, slotDurationMinutes still 45 (previous partial patch preserved)

GET /api/clinic-config (no token)
  → 200, { slotDurationMinutes: 45, reminderHoursBefore: 48 }
  -- Only one ClinicConfig row exists in the database
```

---

### 2.4 Test Setup & Teardown

```typescript
// test/clinic-config.e2e-spec.ts (outline)
beforeAll(async () => {
  app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  prisma = app.get(PrismaService);
  await app.init();
  // Seed admin user once for the suite
  adminToken = await loginAs(app, 'ADMIN');
  patientToken = await loginAs(app, 'PATIENT');
  doctorToken = await loginAs(app, 'DOCTOR');
});

afterEach(async () => {
  await prisma.holiday.deleteMany();
  await prisma.workingHour.deleteMany();
  // Reset ClinicConfig to defaults rather than deleting (it's a singleton)
  await prisma.clinicConfig.updateMany({
    data: {
      slotDurationMinutes: 30,
      timeZone: 'UTC',
      reminderHoursBefore: 24,
      offerWindowMinutes: 30,
      minArrivalMinutes: 45,
    },
  });
});

afterAll(async () => {
  await app.close();
});
```

The singleton `ClinicConfig` row is reset (not deleted) between tests to preserve the unique row invariant.

---

## Phase 3 — Frontend Integration

> **Status check** (as of 2026-05-05): The primary frontend consumer, **ClinicSettingsPage** (`/admin/settings/clinic`, [spec 019](../019-clinic-settings-page/spec.md)), is **spec-complete but not yet implemented** (`🟡`). The **BookingPage** ([spec 010](../010-booking-page/spec.md)) and **WalkInBookingPage** ([spec 017](../017-walk-in-booking-page/spec.md)) depend on slot generation which is powered by `ClinicConfig` internally (via `SlotGeneratorService`), but neither page calls clinic-config endpoints directly. All three pages are `🟡` spec-complete.
>
> **Action required**: Confirm with the developer whether any of these pages have been partially implemented in the frontend codebase — update this section if the status has changed.

---

### 3.1 Frontend Pages & Their Clinic-Config Endpoints

| Frontend Page | Spec | Endpoints Directly Called | Auth |
|---|---|---|---|
| Clinic Settings Page (`/admin/settings/clinic`) | [019](../019-clinic-settings-page/spec.md) | `GET /clinic-config`, `PATCH /clinic-config`, `GET /working-hours`, `PUT /working-hours`, `GET /holidays`, `POST /holidays`, `DELETE /holidays/:id` | Admin |
| Booking Page (`/book`) | [010](../010-booking-page/spec.md) | `GET /clinic-config` (slot duration for UI display only) | Public |
| Walk-In Booking Page (`/staff/walkin`) | [017](../017-walk-in-booking-page/spec.md) | `GET /clinic-config` (slot duration for UI display only) | Receptionist / Admin |

The booking pages do **not** call `/working-hours` or `/holidays` directly — those are consumed server-side by the slot generator. The `slotDurationMinutes` value from `GET /clinic-config` is used on the frontend to display slot length in the UI (e.g. "30-minute appointments").

---

### 3.2 Shared Type Contract

The frontend data models in [spec 019 §4](../019-clinic-settings-page/spec.md#4-data-models) must match the backend response shapes exactly:

```typescript
// Frontend types (from spec 019 §4)
interface ClinicConfigDTO {
  id: string;
  timeZone: string;
  slotDurationMinutes: number;
  reminderHoursBefore: number;
  waitlistOfferWindowMinutes: number;   // backend field: offerWindowMinutes
  minArrivalBufferMinutes?: number;     // backend field: minArrivalMinutes
  updatedAt: string;
}

interface WorkingHourDTO {
  id?: string;
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
}

interface HolidayDTO {
  id: string;
  date: string;         // YYYY-MM-DD
  name: string;
  createdAt?: string;
}
```

**Field name discrepancy to resolve**: The frontend spec uses `waitlistOfferWindowMinutes` and `minArrivalBufferMinutes`; the Prisma schema uses `offerWindowMinutes` and `minArrivalMinutes`. The backend response must map to the frontend names — either by using `@Expose()` + `@Transform()` in a response DTO, or by using the frontend names as the canonical field names in the Prisma schema. **Decide and align before implementation begins.** Recommendation: use the frontend spec names as they are more descriptive.

---

### 3.3 Query Key Conventions

The frontend uses TanStack Query with these query keys (from spec 019 §7):

| Key | Endpoint | Stale Time |
|---|---|---|
| `['clinic-config']` | `GET /api/clinic-config` | 60 000 ms |
| `['working-hours']` | `GET /api/clinic-config/working-hours` | 60 000 ms |
| `['holidays']` | `GET /api/clinic-config/holidays` | 60 000 ms |

Mutations that **must** trigger downstream invalidations:

| Mutation | Invalidates |
|---|---|
| `PATCH /clinic-config` | `['clinic-config']`, `['slots']` (slot duration affects display) |
| `PUT /working-hours` | `['working-hours']`, `['slots']`, `['analytics']` |
| `POST /holidays` | `['holidays']`, `['slots']`, `['analytics']` |
| `DELETE /holidays/:id` | `['holidays']`, `['slots']`, `['analytics']` |

Slot invalidation is critical: working hours and holidays directly control which slots the `SlotGeneratorService` returns. A stale slot cache after a holiday is added will show phantom availability.

---

### 3.4 Error Response Shape

The frontend reads `error.response.data.message` for toast/alert display. Ensure:

| Status | Trigger | Message |
|---|---|---|
| `400` | Invalid timezone | `"timeZone must be a valid IANA timezone identifier"` |
| `400` | `slotDurationMinutes` not multiple of 5 | `"slotDurationMinutes must be a multiple of 5"` |
| `400` | Working hours missing times for open day | `"startTime and endTime are required when isClosed is false"` |
| `400` | Working hours end before start | `"endTime must be after startTime"` |
| `400` | Holiday date in past | `"Holiday date must be today or in the future"` |
| `401` | Missing/invalid JWT on write endpoint | `"Unauthorized"` |
| `403` | Non-admin role on write endpoint | `"Forbidden resource"` |
| `404` | Holiday ID not found on delete | `"Holiday not found"` |
| `409` | Duplicate holiday date | `"A holiday already exists for this date"` |

---

### 3.5 Development Checklist (Backend ↔ Frontend)

- [ ] `GET /api/clinic-config` returns 200 with no auth token
- [ ] `GET /api/clinic-config/working-hours` returns 200 with no auth token; always 7 items
- [ ] `GET /api/clinic-config/holidays` returns 200 with no auth token; sorted ascending by date
- [ ] `PATCH /api/clinic-config` — partial updates work; unset fields are not zeroed
- [ ] `PATCH /api/clinic-config` — `slotDurationMinutes: 25` returns 400
- [ ] `PATCH /api/clinic-config` — invalid `timeZone` returns 400
- [ ] `PUT /api/clinic-config/working-hours` — full 7-day replace is atomic (no partial state on failure)
- [ ] `PUT /api/clinic-config/working-hours` — open day missing `endTime` returns 400
- [ ] `POST /api/clinic-config/holidays` — duplicate date returns 409 with message
- [ ] `POST /api/clinic-config/holidays` — past date returns 400 with message
- [ ] `DELETE /api/clinic-config/holidays/:id` — unknown ID returns 404
- [ ] All write endpoints return 401 with no token, 403 with non-admin token
- [ ] Field names in responses match what spec 019 expects (`waitlistOfferWindowMinutes`, `minArrivalBufferMinutes`) — or field-name alignment decision is documented and implemented consistently on both sides
- [ ] Swagger docs at `/api/docs` include all 7 endpoints with correct auth annotations and `@Public()` decorators shown for the 3 public reads
- [ ] After `PUT /working-hours` or holiday mutation, `GET /appointments/slots` returns updated availability

---

## Acceptance Criteria

- [ ] All 7 clinic-config endpoints return correct HTTP codes and response shapes
- [ ] `ClinicConfig` remains a singleton — no code path can create a second row
- [ ] `UpdateClinicConfigDto`, `WorkingHourDto`, `CreateHolidayDto` validated by `class-validator`; invalid inputs return `400` with per-field messages
- [ ] IANA timezone validation rejects unknown timezone strings
- [ ] `slotDurationMinutes` must be a multiple of 5; `@IsMultipleOf(5)` custom decorator implemented
- [ ] Working hours replacement is atomic; partial failures leave original data intact
- [ ] Working hours always return exactly 7 items from `GET`; missing days returned as closed defaults
- [ ] Holiday date-in-past rule evaluated relative to clinic timezone (from `ClinicConfig.timeZone`)
- [ ] Duplicate holiday date returns `409` with specific message
- [ ] `GET /clinic-config`, `GET /working-hours`, `GET /holidays` decorated with `@Public()` and bypass `JwtAuthGuard`
- [ ] All unit tests pass: `pnpm test src/clinic-config`
- [ ] All E2E flows pass: `pnpm test:e2e -- --testPathPattern=clinic-config`
- [ ] Swagger docs include all 7 endpoints
- [ ] Field name alignment between backend and frontend (spec 019) resolved and documented
