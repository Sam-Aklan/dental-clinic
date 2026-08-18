# Spec: UsersModule (`backend/src/users/`)

**Type**: Backend NestJS Module  
**Plan reference**: [BACKEND_PLAN.md — §2 UsersModule](../../BACKEND_PLAN.md#2-usersmodule)  
**Frontend specs consumed**: [009-profile-page](../009-profile-page/spec.md), [021-users-admin-page](../021-users-admin-page/spec.md)

---

## Overview

UsersModule owns all user management operations that are distinct from authentication: admin-level CRUD on user accounts, role assignment, account disable/enable, and self-service profile updates including password change. It does **not** own login, JWT issuance, or password-reset flows — those belong to AuthModule.

Two personas interact with this module:
- **Admin**: can list all users, create users with any role, edit any profile, and disable accounts.
- **Self (any role)**: can read and update their own profile, change their own password.

The module exposes a `/users/me` convenience alias (maps to the authenticated user's own ID) so the frontend profile page does not need to know the user's UUID.

---

## Phase 1 — DTOs & Validation

### 1.1 File Map

```
backend/src/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
└── dto/
    ├── create-user.dto.ts
    ├── update-user.dto.ts
    └── change-password.dto.ts
```

---

### 1.2 `CreateUserDto`

```typescript
// POST /api/users  (admin only)
class CreateUserDto {
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
  @MaxLength(20)
  @Matches(/^\+?[0-9\s\-().]{7,20}$/, { message: 'phone must be a valid phone number' })
  phone?: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsEnum(Locale)
  preferredLocale?: Locale;

  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one digit' })
  password: string;
}
```

**Response** (`201`):
```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": null,
    "role": "RECEPTIONIST",
    "preferredLocale": "EN",
    "isActive": true,
    "createdAt": "2026-05-05T10:00:00.000Z",
    "updatedAt": "2026-05-05T10:00:00.000Z"
  }
}
```

**Validation rules**:
- Email must not already exist in `User` table → `409 Conflict` with `message: "email_already_exists"`
- Password hashed with `argon2id` before storage (reuse `AuthService.hashPassword` or a shared util)
- If `role === PATIENT`, a `PatientProfile` row is created in the same transaction
- If `role === DOCTOR`, a `DoctorProfile` stub row is created in the same transaction (admin should complete it via DoctorsModule)
- `preferredLocale` defaults to `'EN'` if omitted

---

### 1.3 `UpdateUserDto`

```typescript
// PATCH /api/users/:id  (admin or self)
class UpdateUserDto {
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
  @MaxLength(20)
  @Matches(/^\+?[0-9\s\-().]{7,20}$/, { message: 'phone must be a valid phone number' })
  @Allow(null)
  phone?: string | null;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(Locale)
  preferredLocale?: Locale;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;    // patient profile field; ignored for non-patient roles
}
```

**Response** (`200`): same shape as `CreateUserDto` response.

**Authorization rules**:
- A non-admin user can only `PATCH` their own record (`id === req.user.sub`)
- Non-admin users cannot change `role` — if `role` is present in the body, strip it silently (or reject with `403`)
- Only admin can update `role`
- Admin cannot set their own role to a non-admin role if they are the last admin (prevent lock-out) → `409` with `message: "last_admin"`

---

### 1.4 `ChangePasswordDto`

```typescript
// POST /api/users/:id/change-password  (self only)
// Also: POST /api/users/me/change-password
class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one digit' })
  newPassword: string;
}
```

**Response** (`200`):
```json
{ "statusCode": 200, "data": { "message": "Password updated." } }
```

**Validation rules**:
- `currentPassword` must verify against stored `passwordHash` → `400` with `message: "current_password_incorrect"` on mismatch
- `newPassword` must not be identical to `currentPassword` → `400` with `message: "password_same_as_current"`
- On success, all `RefreshToken` rows for the user are deleted (force re-login on other devices)

---

### 1.5 `GET /users` Query Params

Handled as a plain query object (not a separate DTO class, but validated via `class-validator` with `@IsOptional`):

```typescript
class UserFilterQuery {
  @IsOptional()
  @IsString()
  q?: string;              // search name, email, or phone

  @IsOptional()
  @IsEnum(Role, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  role?: Role[];

  @IsOptional()
  @IsIn(['active', 'disabled', 'all'])
  status?: 'active' | 'disabled' | 'all';

  @IsOptional()
  @IsEnum(Locale)
  preferredLocale?: Locale;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;           // default 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;       // default 20

  @IsOptional()
  @IsIn(['firstName', 'lastName', 'email', 'role', 'createdAt'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc';
}
```

**Response** (`200`):
```json
{
  "statusCode": 200,
  "data": {
    "items": [ { ...user } ],
    "total": 85,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 1.6 `/users/me` and `/users/me/change-password` Aliases

These are convenience routes for the frontend profile page so it does not need the user's UUID:

- `GET /users/me` → `GET /users/:id` resolved to `req.user.sub`
- `PATCH /users/me` → `PATCH /users/:id` with self-authorization rules
- `POST /users/me/change-password` → `POST /users/:id/change-password`

Implemented as separate controller methods that delegate to the same service methods, passing `req.user.sub` as the `id`.

---

### 1.7 `PATCH /:id/disable`

No request body. Admin-only.

**Response** (`200`):
```json
{ "statusCode": 200, "data": { "message": "User disabled.", "id": "uuid", "isActive": false } }
```

**Validation rules**:
- Admin cannot disable themselves → `403` with `message: "cannot_disable_self"`
- If the user is already disabled, return `200` (idempotent)
- Disabling a user deletes all their `RefreshToken` rows (immediate session revocation)
- On disable, write an `AuditLog` entry (action: `USER_DISABLED`, actor: admin, targetId: userId)

---

### 1.8 Prisma Models Used

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String
  firstName       String
  lastName        String
  phone           String?
  role            Role      @default(PATIENT)
  preferredLocale Locale    @default(EN)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  refreshTokens    RefreshToken[]
  patientProfile   PatientProfile?
  doctorProfile    DoctorProfile?
}

model PatientProfile {
  id          String    @id @default(uuid())
  userId      String    @unique
  dateOfBirth DateTime?
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

### 1.9 Response Shape (Serialized User)

The service always returns a sanitized user object. The `passwordHash` field must **never** appear in any response. Use a `UserResponseDto` or a `class-transformer` `@Exclude()` decorator on `passwordHash`.

```typescript
class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  preferredLocale: Locale;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // patientProfile included only when relevant:
  patientProfile?: { dateOfBirth: string | null } | null;
}
```

---

## Phase 2 — Unit & E2E Tests

### 2.1 Unit Tests (`src/users/users.service.spec.ts`)

#### `findAll()`

| Scenario | Expected |
|----------|----------|
| No filters, default pagination | Returns first 20 users, total count |
| Filter by `role: ['DOCTOR']` | Returns only DOCTOR rows |
| Filter by `status: 'disabled'` | Returns only `isActive: false` rows |
| Search by partial email | Returns matching users (case-insensitive) |
| `sortBy: 'createdAt', sortDir: 'desc'` | Rows ordered descending by createdAt |
| `page: 2, pageSize: 5` | Returns correct slice and total |

#### `findOne(id)`

| Scenario | Expected |
|----------|----------|
| Existing user ID | Returns sanitized user (no `passwordHash`) |
| Non-existent ID | Throws `NotFoundException` (404) |

#### `create(dto)`

| Scenario | Expected |
|----------|----------|
| Valid payload, unique email | Creates User + PatientProfile (role=PATIENT) / DoctorProfile stub (role=DOCTOR); returns UserResponseDto |
| Duplicate email | Throws `ConflictException` (409) with `"email_already_exists"` |
| Role=ADMIN | Creates user; no profile row created |
| Password hashing | Verify `argon2.hash` called; plain password not stored |

#### `update(id, dto, requestingUser)`

| Scenario | Expected |
|----------|----------|
| Admin updates another user | All fields including `role` updated |
| Non-admin updates own profile | `firstName`, `lastName`, `phone`, `preferredLocale` updated; `role` silently stripped |
| Non-admin updates another user | Throws `ForbiddenException` (403) |
| Admin demotes self (last admin) | Throws `ConflictException` (409) with `"last_admin"` |
| `dateOfBirth` for PATIENT role | Updates `patientProfile.dateOfBirth` |
| `dateOfBirth` for non-PATIENT role | Field ignored |

#### `disable(id, requestingAdminId)`

| Scenario | Expected |
|----------|----------|
| Admin disables another user | Sets `isActive: false`, deletes RefreshTokens, writes AuditLog |
| Admin disables self | Throws `ForbiddenException` (403) with `"cannot_disable_self"` |
| Target already disabled | Returns 200, no duplicate audit entry |
| Non-existent ID | Throws `NotFoundException` (404) |

#### `changePassword(id, dto, requestingUserId)`

| Scenario | Expected |
|----------|----------|
| Correct `currentPassword` | Hashes `newPassword`, updates `passwordHash`, deletes all `RefreshToken` rows |
| Wrong `currentPassword` | Throws `BadRequestException` (400) with `"current_password_incorrect"` |
| `newPassword` same as current | Throws `BadRequestException` (400) with `"password_same_as_current"` |
| Another user's ID | Throws `ForbiddenException` (403) — self only |

---

### 2.2 Controller Unit Tests (`src/users/users.controller.spec.ts`)

| Test | Expected |
|------|----------|
| `GET /users` without JWT | 401 from `JwtAuthGuard` |
| `GET /users` with PATIENT role | 403 from `RolesGuard` |
| `PATCH /users/:id` with non-admin and other user's id | 403 |
| `POST /users` with RECEPTIONIST role | 403 |
| `GET /users/me` | Resolves to correct user |
| `PATCH /users/me/change-password` with wrong current password | 400 |

---

### 2.3 E2E Tests (`test/users.e2e-spec.ts`)

Test environment: NestJS `Test.createTestingModule` with real Prisma against a test PostgreSQL database.

#### Flow 1 — Admin Lists and Creates Users

```
POST /api/auth/login (admin credentials)
  → capture accessToken

GET /api/users (with token)
  → 200, paginated list

POST /api/users (with token)
  { email, firstName, lastName, role: 'RECEPTIONIST', password }
  → 201, user object
  → DB has User row (role=RECEPTIONIST, isActive=true)
  → passwordHash NOT in response

POST /api/users (duplicate email)
  → 409, message: "email_already_exists"
```

#### Flow 2 — Self-Service Profile Update

```
POST /api/auth/login (patient credentials)
  → capture accessToken

GET /api/users/me (with token)
  → 200, own profile

PATCH /api/users/me (with token)
  { firstName: "Updated", preferredLocale: "AR" }
  → 200, updated profile

PATCH /api/users/me (with token)
  { role: "ADMIN" }
  → 200 but role NOT changed (non-admin cannot change role)
```

#### Flow 3 — Change Password Flow

```
POST /api/auth/login (patient credentials)
  → capture accessToken + refreshToken cookie

POST /api/users/me/change-password
  { currentPassword: "Correct1", newPassword: "NewPass2" }
  → 200

POST /api/auth/refresh (old refreshToken cookie)
  → 401 (all tokens invalidated on password change)

POST /api/auth/login (old password)
  → 401

POST /api/auth/login (new password)
  → 200
```

#### Flow 4 — Admin Disable Flow

```
POST /api/auth/login (admin credentials)
  → capture adminToken

POST /api/users { role: 'RECEPTIONIST', ... }
  → 201, capture userId

PATCH /api/users/:userId/disable (with adminToken)
  → 200, isActive: false

POST /api/auth/login (disabled user credentials)
  → 403, message: "account_disabled"

PATCH /api/users/:adminId/disable (admin disabling self)
  → 403, message: "cannot_disable_self"
```

#### Flow 5 — RBAC Enforcement

```
POST /api/auth/login (patient credentials)
  → capture patientToken

GET /api/users (with patientToken)
  → 403

POST /api/users (with patientToken)
  → 403

PATCH /api/users/:otherUserId (with patientToken)
  → 403
```

#### Flow 6 — Validation Errors

```
POST /api/users (admin token)
  { email: "not-an-email", firstName: "", role: "UNKNOWN" }
  → 400, per-field errors

POST /api/users/me/change-password
  { currentPassword: "", newPassword: "weak" }
  → 400
```

---

### 2.4 Test Setup & Teardown

```typescript
// test/users.e2e-spec.ts (outline)
beforeAll(async () => {
  app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  prisma = app.get(PrismaService);
  await app.init();
  // Seed: create admin user for test flows
  adminUser = await prisma.user.create({ data: { ...adminSeed } });
});

afterEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.user.deleteMany({ where: { id: { not: adminUser.id } } });
});

afterAll(async () => {
  await prisma.user.deleteMany();
  await app.close();
});
```

---

## Phase 3 — Frontend Integration

> **Status check**: Frontend spec 021 (UsersAdminPage) and spec 009 (ProfilePage) are **both written**. Implementation status of those pages must be confirmed before wiring up this module.

### 3.1 Frontend Pages & Their Users Endpoints

| Frontend Page / Module | Spec | Users Endpoints Used |
|------------------------|------|----------------------|
| Users Admin Page (`/admin/settings/users`) | [021](../021-users-admin-page/spec.md) | `GET /users`, `POST /users`, `GET /users/:id`, `PATCH /users/:id`, `PATCH /users/:id/disable` |
| Profile Page (`/me`) | [009](../009-profile-page/spec.md) | `GET /users/me`, `PATCH /users/me`, `POST /users/me/change-password` |

---

### 3.2 URL Discrepancy: `/users/me` vs `/users/:id`

The backend plan lists endpoints as `GET /:id`, `PATCH /:id`, `POST /:id/change-password`. The **ProfilePage spec (009)** calls `/users/me`, `/users/me`, and `/users/me/password`.

Resolution: the UsersModule must expose both forms:

| Controller Route | Maps To | Auth |
|-----------------|---------|------|
| `GET /users/me` | self lookup | JwtAuthGuard |
| `PATCH /users/me` | self update | JwtAuthGuard |
| `POST /users/me/change-password` | self password change | JwtAuthGuard |
| `GET /users/:id` | lookup by id | JwtAuthGuard + admin-or-self |
| `PATCH /users/:id` | update by id | JwtAuthGuard + admin-or-self |
| `POST /users/:id/change-password` | password change | JwtAuthGuard + self-only |

> **NestJS route ordering**: `/users/me` must be declared **before** `/users/:id` in the controller to avoid `:id` capturing the literal string `"me"`.

---

### 3.3 Shared Type Contract

The `AdminUserDTO` type in the frontend ([021](../021-users-admin-page/spec.md)) expects:

```typescript
interface AdminUserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';
  languagePreference: 'en' | 'ar';   // NOTE: lowercase in frontend spec
  isDisabled?: boolean;               // NOTE: frontend uses isDisabled, backend uses isActive
  createdAt: string;
  updatedAt: string;
}
```

**Mapping differences to reconcile**:

| Backend field | Frontend field | Transformation |
|--------------|---------------|----------------|
| `preferredLocale: 'EN' \| 'AR'` | `languagePreference: 'en' \| 'ar'` | Lowercase in response, or frontend normalizes |
| `isActive: boolean` | `isDisabled?: boolean` | Frontend inverts: `isDisabled = !isActive` |

**Recommended approach**: keep the backend canonical (`preferredLocale`, `isActive`) and have the frontend `users-api.ts` normalize the fields when mapping the response. Document the mapping in the frontend API layer.

The `ProfilePage` (spec 009) uses `GET /users/me` and expects:
```typescript
{
  id, email, firstName, lastName, phone, role,
  preferredLocale,       // matches backend name
  patientProfile: { dateOfBirth: string | null } | null
}
```
This aligns with backend `UserResponseDto` — no discrepancy.

---

### 3.4 Paginated List Response Contract

The frontend `useUsers` hook expects the list response to include pagination metadata:
```json
{
  "statusCode": 200,
  "data": {
    "items": [ ...users ],
    "total": 85,
    "page": 1,
    "pageSize": 20
  }
}
```

The `TransformInterceptor` wraps `data` — the service should return `{ items, total, page, pageSize }` and the interceptor wraps it in `{ statusCode, data }`.

---

### 3.5 Error Response Contract

The frontend expects the standard error shape from `HttpExceptionFilter`:
```json
{
  "statusCode": 409,
  "message": "email_already_exists",
  "error": "Conflict",
  "timestamp": "...",
  "path": "/api/users"
}
```

Frontend-specific error handling in [021](../021-users-admin-page/spec.md):
- `409` on `POST /users` → inline email field error in dialog
- `403 cannot_disable_self` → error alert explaining current admin cannot be disabled
- `409 last_admin` → blocking alert on role change (admin demotes self and would be last admin)

---

### 3.6 Development Checklist (Backend ↔ Frontend)

- [ ] `GET /api/users` returns paginated `{ items, total, page, pageSize }` with all `AdminUserDTO` fields
- [ ] `POST /api/users` returns `201` with the new user object; `409` on duplicate email
- [ ] `GET /api/users/:id` returns user by UUID; `404` if not found
- [ ] `PATCH /api/users/:id` enforces admin-or-self; role change restricted to admin
- [ ] `PATCH /api/users/:id/disable` is idempotent; `403` on self-disable
- [ ] `GET /api/users/me` returns full profile including `patientProfile` if applicable
- [ ] `PATCH /api/users/me` updates own profile; role change is silently ignored for non-admin
- [ ] `POST /api/users/me/change-password` invalidates all refresh tokens on success
- [ ] `passwordHash` never appears in any response body
- [ ] `/users/me` routes declared before `/:id` in the controller (NestJS ordering)
- [ ] Swagger docs at `/api/docs` document all users endpoints with example payloads
- [ ] `AuditLog` row written for: user created by admin, user disabled, role changed by admin

---

## Acceptance Criteria

- [ ] All users endpoints return correct HTTP codes and response shapes
- [ ] `CreateUserDto`, `UpdateUserDto`, `ChangePasswordDto` validated by `class-validator`; invalid inputs return `400` with per-field messages
- [ ] Admin-only routes return `403` for non-admin roles
- [ ] Self-only routes return `403` when called for another user's ID
- [ ] Duplicate email returns `409` with `message: "email_already_exists"`
- [ ] `passwordHash` never included in any response
- [ ] `PATCH /:id/disable` invalidates all `RefreshToken` rows for the target user
- [ ] `POST /:id/change-password` invalidates all `RefreshToken` rows and verifies `currentPassword`
- [ ] Last-admin demotion blocked with `409 last_admin`
- [ ] Self-disable blocked with `403 cannot_disable_self`
- [ ] `/users/me` routes resolve to the authenticated user's own record
- [ ] All unit tests pass: `pnpm test src/users`
- [ ] All E2E flows pass: `pnpm test:e2e -- --testPathPattern=users`
- [ ] Swagger docs include all users endpoints
