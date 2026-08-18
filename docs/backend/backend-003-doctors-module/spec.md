# Spec: DoctorsModule (`backend/src/doctors/`)

**Type**: Backend NestJS Module  
**Plan reference**: [BACKEND_PLAN.md — §3 DoctorsModule](../../BACKEND_PLAN.md#3-doctorsmodule)  
**Frontend specs consumed**: [010-booking-page](../010-booking-page/spec.md), [020-doctors-admin-page](../020-doctors-admin-page/spec.md), [023-doctor-queue-page](../023-doctor-queue-page/spec.md), [024-doctor-today-page](../024-doctor-today-page/spec.md)

---

## Overview

DoctorsModule owns doctor directory profiles, schedule overrides, and the public endpoint that powers the booking page. It bridges the generic `User` record (DOCTOR role) with the richer `DoctorProfile` record, and exposes schedule overrides that let admins add per-day exceptions to clinic working hours.

Three personas interact with this module:
- **Public (unauthenticated)**: read-only access to the doctor directory — used by the booking page.
- **Admin**: full CRUD on doctor accounts and all schedule overrides.
- **Doctor (self)**: can view and update their own profile; can view their own schedule overrides.
- **Receptionist**: can view any doctor's schedule overrides (read-only).

---

## Phase 1 — DTOs & Validation

### 1.1 File Map

```
backend/src/doctors/
├── doctors.module.ts
├── doctors.controller.ts
├── doctors.service.ts
└── dto/
    ├── create-doctor.dto.ts
    ├── update-doctor.dto.ts
    └── create-schedule-override.dto.ts
```

---

### 1.2 `CreateDoctorDto`

```typescript
// POST /api/doctors  (admin only)
class CreateDoctorDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-().]{7,20}$/, { message: 'phone must be a valid phone number' })
  phone?: string;

  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one digit' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @IsOptional()
  @IsEnum(Locale)
  preferredLocale?: Locale;
}
```

**Response** (`201`):
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "firstName": "Sara",
    "lastName": "Ahmed",
    "email": "sara@clinic.local",
    "phone": null,
    "specialization": "Orthodontics",
    "bio": null,
    "isActive": true,
    "preferredLocale": "EN",
    "createdAt": "2026-05-05T10:00:00.000Z"
  }
}
```

**Validation rules**:
- Email must not already exist → `409 Conflict`
- Password hashed with `argon2id`; never stored plain
- `User` (role=DOCTOR) and `DoctorProfile` created in a single Prisma transaction — both rows created or neither
- `preferredLocale` defaults to `'EN'` if omitted

---

### 1.3 `UpdateDoctorDto`

```typescript
// PATCH /api/doctors/:id  (admin or doctor-self)
class UpdateDoctorDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9\s\-().]{7,20}$/, { message: 'phone must be a valid phone number' })
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  specialization?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string | null;

  @IsOptional()
  @IsEnum(Locale)
  preferredLocale?: Locale;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;  // admin-only field; stripped before service call for doctor-self requests
}
```

**Response** (`200`): same shape as `CreateDoctorDto` response.

**Authorization rules**:
- Doctor requesting `PATCH /api/doctors/:id` where `:id` ≠ their own doctor profile → `403 Forbidden`
- Doctor sending `isActive` field → service strips the field silently (does not 400; RBAC guard handles privilege separation at the field level)
- Admin can patch any doctor and can set `isActive`

---

### 1.4 `CreateScheduleOverrideDto`

```typescript
// POST /api/doctors/:id/schedule-overrides  (admin only)
class CreateScheduleOverrideDto {
  @IsDateString()
  date: string;           // YYYY-MM-DD; interpreted in clinic timezone

  @IsBoolean()
  isUnavailable: boolean; // true = mark whole day unavailable (startTime/endTime must be null)

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'startTime must be in HH:mm format' })
  startTime?: string | null;

  @IsOptional()
  @Matches(/^\d{2}:\d{2}$/, { message: 'endTime must be in HH:mm format' })
  endTime?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  reason?: string;
}
```

**Response** (`201`):
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "doctorId": "uuid",
    "date": "2026-06-10",
    "isUnavailable": false,
    "startTime": "09:00",
    "endTime": "13:00",
    "reason": "Morning only",
    "createdAt": "2026-05-05T10:00:00.000Z"
  }
}
```

**Validation rules**:
- If `isUnavailable = true` → `startTime` and `endTime` must both be `null` or absent; if provided, return `400`
- If `isUnavailable = false` → both `startTime` and `endTime` are required; return `400` if either is absent
- `endTime` must be strictly after `startTime` → `400`
- Duplicate override for the same `(doctorId, date)` → `409 Conflict`

---

### 1.5 Response Shape — Public Doctor Directory

`GET /api/doctors` and `GET /api/doctors/:id` return a trimmed shape — **no email, no phone** — to keep the public endpoint safe:

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": "uuid",
      "firstName": "Sara",
      "lastName": "Ahmed",
      "specialization": "Orthodontics",
      "bio": "Dr. Sara Ahmed has 10 years of experience...",
      "isActive": true
    }
  ]
}
```

Admin-authenticated requests to `GET /api/doctors` receive the full shape (email, phone, createdAt). The controller switches the serializer based on `req.user?.role`.

---

### 1.6 Prisma Models Used

```prisma
model DoctorProfile {
  id             String   @id @default(uuid())
  userId         String   @unique
  specialization String?
  bio            String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user              User                     @relation(fields: [userId], references: [id], onDelete: Cascade)
  scheduleOverrides DoctorScheduleOverride[]
  appointments      Appointment[]
}

model DoctorScheduleOverride {
  id            String   @id @default(uuid())
  doctorId      String   // DoctorProfile.id
  date          DateTime @db.Date
  startTime     String?  // HH:mm
  endTime       String?  // HH:mm
  isUnavailable Boolean  @default(false)
  reason        String?
  createdAt     DateTime @default(now())

  doctor DoctorProfile @relation(fields: [doctorId], references: [id], onDelete: Cascade)

  @@unique([doctorId, date])
}
```

---

## Phase 2 — Unit & E2E Tests

### 2.1 Unit Tests (`src/doctors/doctors.service.spec.ts`)

Mock `PrismaService` with `jest.createMockFromModule` or manual stubs. Do **not** hit a real database in unit tests.

#### `findAll()`

| Scenario | Expected |
|----------|----------|
| No auth (public call) | Returns array of doctors; each item excludes email and phone |
| Admin call | Returns full doctor objects including email and phone |
| No doctors in DB | Returns empty array `[]` |

#### `findOne(id)`

| Scenario | Expected |
|----------|----------|
| Valid UUID, exists, role=DOCTOR | Returns doctor profile merged with user fields |
| UUID exists but user role ≠ DOCTOR | Throws `NotFoundException` (404) |
| UUID not found | Throws `NotFoundException` (404) |

#### `create(dto)`

| Scenario | Expected |
|----------|----------|
| Valid payload, unique email | Creates `User` + `DoctorProfile` in transaction; returns merged shape |
| Duplicate email | Throws `ConflictException` (409) |
| Password missing uppercase | Class-validator rejects before service is called |
| Password missing digit | Class-validator rejects before service is called |
| Prisma transaction fails mid-way | Rolls back; neither User nor DoctorProfile row is created |

#### `update(id, dto, requestingUser)`

| Scenario | Expected |
|----------|----------|
| Admin updating any doctor | Applies all fields including `isActive` |
| Doctor updating own profile | Applies firstName, lastName, phone, specialization, bio, preferredLocale; ignores `isActive` |
| Doctor updating another doctor's profile | Throws `ForbiddenException` (403) |
| Updating non-existent doctor | Throws `NotFoundException` (404) |
| Setting nullable fields to null | Sets `phone: null`, `specialization: null`, `bio: null` in DB |

#### `getScheduleOverrides(doctorId, requestingUser)`

| Scenario | Expected |
|----------|----------|
| Admin requesting any doctor | Returns override list |
| Receptionist requesting any doctor | Returns override list |
| Doctor requesting own overrides | Returns override list |
| Doctor requesting another doctor's overrides | Throws `ForbiddenException` (403) |
| No overrides exist | Returns empty array |

#### `createScheduleOverride(doctorId, dto)`

| Scenario | Expected |
|----------|----------|
| Valid unavailable-all-day override | Creates row with `startTime=null`, `endTime=null`, `isUnavailable=true` |
| Valid partial-day override | Creates row with startTime/endTime set |
| `isUnavailable=false` but missing startTime | Throws `BadRequestException` (400) |
| `isUnavailable=true` but startTime provided | Throws `BadRequestException` (400) |
| `endTime` before `startTime` | Throws `BadRequestException` (400) |
| Duplicate `(doctorId, date)` | Throws `ConflictException` (409) |
| Doctor not found | Throws `NotFoundException` (404) |

#### `deleteScheduleOverride(doctorId, overrideId)`

| Scenario | Expected |
|----------|----------|
| Override exists and belongs to doctor | Deletes row; returns `undefined` (204) |
| `overrideId` not found | Throws `NotFoundException` (404) |
| `overrideId` exists but belongs to different doctor | Throws `NotFoundException` (404) — do not leak existence |

---

### 2.2 Controller Unit Tests (`src/doctors/doctors.controller.spec.ts`)

Test that the controller correctly wires guards, delegates to service, and returns the right HTTP status codes without re-testing service logic.

| Endpoint | Guard applied | Expected status |
|----------|--------------|-----------------|
| `GET /doctors` | None (public) | 200 |
| `GET /doctors/:id` | None (public) | 200 |
| `POST /doctors` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | 201 |
| `PATCH /doctors/:id` | `JwtAuthGuard` + `RolesGuard(ADMIN, DOCTOR)` | 200 |
| `GET /doctors/:id/schedule-overrides` | `JwtAuthGuard` + `RolesGuard(ADMIN, RECEPTIONIST, DOCTOR)` | 200 |
| `POST /doctors/:id/schedule-overrides` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | 201 |
| `DELETE /doctors/:id/schedule-overrides/:overrideId` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | 204 |

---

### 2.3 E2E Tests (`test/doctors.e2e-spec.ts`)

Test environment: NestJS `Test.createTestingModule` with real Prisma pointing at a test PostgreSQL database.

#### Flow 1 — Public Doctor Directory

```
GET /api/doctors (no token)
  → 200, array (may be empty)
  → each item has id, firstName, lastName, specialization, bio, isActive
  → each item does NOT have email or phone

GET /api/doctors/:id (no token, id = created doctor)
  → 200, doctor details without email/phone

GET /api/doctors/00000000-0000-0000-0000-000000000000 (no token)
  → 404
```

#### Flow 2 — Admin Creates and Updates a Doctor

```
POST /api/auth/login (admin credentials)
  → capture accessToken

POST /api/doctors (admin token)
  { email: "dr.new@clinic.local", firstName: "Omar", lastName: "Yusuf",
    password: "Secret123", specialization: "General Dentistry" }
  → 201, data has id, userId, email, specialization

GET /api/doctors/:id (admin token)
  → 200, full shape including email

PATCH /api/doctors/:id (admin token)
  { specialization: "Pediatric Dentistry", isActive: false }
  → 200, specialization and isActive updated

GET /api/doctors/:id (no token)
  → 200, isActive: false still returned (public can see inactive; UI hides them)

POST /api/doctors (admin token, duplicate email)
  → 409
```

#### Flow 3 — Doctor Self-Update

```
POST /api/auth/login (doctor credentials from Flow 2)
  → capture accessToken (doctorToken)

PATCH /api/doctors/:ownId (doctorToken)
  { bio: "Updated bio", specialization: "Orthodontics" }
  → 200, bio and specialization updated

PATCH /api/doctors/:ownId (doctorToken, includes isActive: false)
  → 200, but isActive is NOT changed (field silently ignored for self-updates)

PATCH /api/doctors/:otherDoctorId (doctorToken)
  → 403
```

#### Flow 4 — Schedule Overrides Lifecycle

```
POST /api/doctors/:id/schedule-overrides (admin token)
  { date: "2026-07-01", isUnavailable: true }
  → 201, override created

GET /api/doctors/:id/schedule-overrides (admin token)
  → 200, array with one entry

GET /api/doctors/:id/schedule-overrides (receptionist token)
  → 200

GET /api/doctors/:id/schedule-overrides (doctor own token)
  → 200

GET /api/doctors/:id/schedule-overrides (doctor OTHER token)
  → 403

POST /api/doctors/:id/schedule-overrides (admin token, same date again)
  → 409

POST /api/doctors/:id/schedule-overrides (admin token)
  { date: "2026-07-02", isUnavailable: false, startTime: "09:00", endTime: "13:00" }
  → 201

POST /api/doctors/:id/schedule-overrides (admin token, endTime before startTime)
  { date: "2026-07-03", isUnavailable: false, startTime: "13:00", endTime: "09:00" }
  → 400

DELETE /api/doctors/:id/schedule-overrides/:overrideId (admin token)
  → 204

GET /api/doctors/:id/schedule-overrides (admin token)
  → 200, deleted entry no longer present
```

#### Flow 5 — Auth & RBAC Enforcement

```
POST /api/doctors (no token)
  → 401

POST /api/doctors (doctor token)
  → 403

POST /api/doctors (receptionist token)
  → 403

POST /api/doctors/:id/schedule-overrides (receptionist token)
  → 403

DELETE /api/doctors/:id/schedule-overrides/:overrideId (receptionist token)
  → 403
```

---

### 2.4 Test Setup & Teardown

```typescript
// test/doctors.e2e-spec.ts (outline)
beforeAll(async () => {
  app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  prisma = app.get(PrismaService);
  await app.init();
});

afterEach(async () => {
  await prisma.doctorScheduleOverride.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.user.deleteMany({ where: { role: 'DOCTOR' } });
});

afterAll(async () => {
  await app.close();
});
```

The admin user used in tests should be seeded once in `beforeAll` and excluded from teardown (seed by a separate email that is not in the DOCTOR role delete filter).

---

## Phase 3 — Frontend Integration

> **Status check**: All four frontend specs that consume DoctorsModule endpoints are written and spec-complete. **None are implemented yet** (all 🟡 in FRONTEND_PROGRESS.md). The integration contract below must be satisfied when frontend implementation begins.

---

### 3.1 Frontend Pages & Their Doctor Endpoints

| Frontend Page | Spec | Endpoints Used | Auth |
|---|---|---|---|
| Booking Page (`/book`) | [010](../010-booking-page/spec.md) | `GET /api/doctors` | Public |
| Doctors Admin Page (`/admin/settings/doctors`) | [020](../020-doctors-admin-page/spec.md) | `GET /api/doctors`, `GET /api/doctors/:id`, `POST /api/doctors`, `PATCH /api/doctors/:id`, `GET /api/doctors/:id/schedule-overrides`, `POST /api/doctors/:id/schedule-overrides`, `DELETE /api/doctors/:id/schedule-overrides/:overrideId` | Admin |
| Doctor Queue Page (`/doctor/queue`) | [023](../023-doctor-queue-page/spec.md) | `GET /api/doctors/:id` (own profile display) | Doctor |
| Doctor Today Page (`/doctor/today`) | [024](../024-doctor-today-page/spec.md) | `GET /api/doctors/:id` (own profile display) | Doctor |

---

### 3.2 Shared Type Contract

The frontend data models in [spec 020 §7](../020-doctors-admin-page/spec.md#7-data-models) must match the backend response shapes:

```typescript
// Frontend type (from spec 020)
interface DoctorDTO {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;       // only present for admin-authenticated calls
  phone?: string | null;       // only present for admin-authenticated calls
  specialization: string | null;
  bio?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ScheduleOverrideDTO {
  id: string;
  doctorId: string;
  date: string;               // YYYY-MM-DD
  startTime: string | null;   // HH:mm
  endTime: string | null;     // HH:mm
  isUnavailable: boolean;
  reason?: string | null;
  createdAt: string;
}
```

**Key contract rule**: The public `GET /api/doctors` response must omit `email` and `phone`. The admin-authenticated response must include them. The frontend `DoctorDTO` models both shapes with optional fields — the backend serializer is responsible for the distinction, not the frontend.

---

### 3.3 Query Key Conventions

The frontend uses TanStack Query with these query keys (from spec 020 §8):

| Key | Endpoint |
|---|---|
| `['doctors']` | `GET /api/doctors` |
| `['doctors', id]` | `GET /api/doctors/:id` |
| `['doctors', id, 'schedule-overrides']` | `GET /api/doctors/:id/schedule-overrides` |

Mutations that **must** invalidate `['doctors']` and `['slots']`:
- `POST /api/doctors`
- `PATCH /api/doctors/:id`
- `POST /api/doctors/:id/schedule-overrides`
- `DELETE /api/doctors/:id/schedule-overrides/:overrideId`

Slot invalidation is critical: adding or removing a schedule override changes which slots the `SlotGeneratorService` will return.

---

### 3.4 Error Response Shape

The frontend reads `error.response.data.message` for display. Ensure:
- `401` — missing or invalid JWT
- `403` — insufficient role, or doctor accessing another doctor's resource
- `404` — doctor or override not found (message should be `"Doctor not found"` or `"Schedule override not found"`)
- `409` — duplicate email on create (message: `"email already in use"`) or duplicate date on override (message: `"An override already exists for this date"`)
- `400` — validation failures; include per-field messages from class-validator, plus explicit messages for time-range violations

---

### 3.5 Development Checklist (Backend ↔ Frontend)

- [ ] `GET /api/doctors` returns array without auth; public fields only (no email/phone)
- [ ] `GET /api/doctors` returns full fields when called with admin JWT
- [ ] `GET /api/doctors/:id` returns 404 for unknown UUID; no leakage of user data from non-DOCTOR roles
- [ ] `POST /api/doctors` creates both `User` (role=DOCTOR) and `DoctorProfile` atomically; returns merged shape
- [ ] `POST /api/doctors` returns 409 on duplicate email with message `"email already in use"`
- [ ] `PATCH /api/doctors/:id` — doctor-self cannot change `isActive`; admin can
- [ ] `PATCH /api/doctors/:id` — doctor updating another doctor's profile returns 403
- [ ] `GET /api/doctors/:id/schedule-overrides` returns 403 if a doctor requests another doctor's overrides
- [ ] `POST /api/doctors/:id/schedule-overrides` with `isUnavailable=false` and missing times returns 400
- [ ] `POST /api/doctors/:id/schedule-overrides` with duplicate date returns 409
- [ ] `DELETE /api/doctors/:id/schedule-overrides/:overrideId` returns 204 on success; 404 if mismatch
- [ ] Swagger docs at `/api/docs` include all doctors endpoints with correct auth annotations
- [ ] `GET /api/doctors` and `GET /api/doctors/:id` are decorated with `@Public()` and excluded from JwtAuthGuard

---

## Acceptance Criteria

- [ ] All seven doctors endpoints return correct HTTP codes and response shapes
- [ ] `CreateDoctorDto`, `UpdateDoctorDto`, `CreateScheduleOverrideDto` validated by `class-validator`; invalid inputs return `400` with per-field messages
- [ ] Duplicate email on `POST /api/doctors` returns `409`
- [ ] Doctor profile and user created atomically; no partial rows on failure
- [ ] Doctor self-update cannot change `isActive`
- [ ] Doctor cannot access or modify another doctor's schedule overrides
- [ ] Schedule override uniqueness enforced per `(doctorId, date)`
- [ ] Override time validation: end > start; both required when `isUnavailable=false`; both null when `isUnavailable=true`
- [ ] Public directory endpoints do not expose email or phone
- [ ] All unit tests pass: `pnpm test src/doctors`
- [ ] All E2E flows pass: `pnpm test:e2e -- --testPathPattern=doctors`
- [ ] Swagger docs include all doctors endpoints
