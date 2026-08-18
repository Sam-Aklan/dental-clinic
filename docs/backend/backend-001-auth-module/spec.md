# Spec: AuthModule (`backend/src/auth/`)

**Type**: Backend NestJS Module  
**Plan reference**: [BACKEND_PLAN.md — §1 AuthModule](../../BACKEND_PLAN.md#1-authmodule)  
**Frontend specs consumed**: [002-login-page](../002-login-page/spec.md), [003-register-page](../003-register-page/spec.md), [004-forgot-password-page](../004-forgot-password-page/spec.md), [005-reset-password-page](../005-reset-password-page/spec.md), [007-auth-context-and-hooks](../007-auth-context-and-hooks/spec.md), [009-profile-page](../009-profile-page/spec.md)

---

## Overview

AuthModule owns every authentication concern: account creation, credential verification, short-lived access JWTs, rotating HTTP-only refresh cookies, password-reset tokens, and the `/me` endpoint. No other module contains auth logic.

---

## Phase 1 — DTOs & Validation

### 1.1 File Map

```
backend/src/auth/
├── auth.module.ts
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts           ← access token
│   └── jwt-refresh.strategy.ts   ← refresh token from cookie
└── dto/
    ├── register.dto.ts
    ├── login.dto.ts
    ├── forgot-password.dto.ts
    └── reset-password.dto.ts
```

---

### 1.2 `RegisterDto`

```typescript
// POST /api/auth/register
class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(8)
  @MaxLength(72)          // argon2 hash limit
  @Matches(/[A-Z]/, { message: 'password must contain at least one uppercase letter' })
  @Matches(/[0-9]/, { message: 'password must contain at least one digit' })
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;

  @IsOptional()
  @IsEnum(Locale)                // 'EN' | 'AR'
  preferredLocale?: Locale;
}
```

**Response** (`201`):
```json
{
  "statusCode": 201,
  "data": {
    "accessToken": "<jwt>",
    "user": { "id", "email", "firstName", "lastName", "role", "preferredLocale" }
  }
}
```

**Validation rules**:
- Email must not already exist in `User` table → `409 Conflict`
- Password hashed with `argon2id` (never stored plain)
- Role auto-set to `PATIENT`; `PatientProfile` row created in same transaction
- `preferredLocale` defaults to `'EN'` if omitted

---

### 1.3 `LoginDto`

```typescript
// POST /api/auth/login
class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

**Response** (`200`):
```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "<jwt>",
    "user": { "id", "email", "firstName", "lastName", "role", "preferredLocale" }
  }
}
```
Sets `Set-Cookie: refreshToken=<token>; HttpOnly; SameSite=Lax; Path=/api/auth/refresh`

**Validation rules**:
- Generic error on bad credentials (do not distinguish email-not-found vs wrong-password) → `401 Unauthorized`
- Disabled accounts → `403 Forbidden` with message `"account_disabled"`

---

### 1.4 `ForgotPasswordDto`

```typescript
// POST /api/auth/forgot-password
class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
```

**Response** (`200`) — always success to prevent enumeration:
```json
{ "statusCode": 200, "data": { "message": "If that email exists, a reset link was sent." } }
```

**Logic**:
- Look up user by email; if not found, return 200 silently
- Generate a cryptographically random token (32 bytes hex), store `PasswordResetToken` row with `expiresAt = now + 1h`
- Queue `password-reset` email job via NotificationsModule with `{ userId, token, locale }`
- Old reset tokens for the same user remain valid until used or expired (one at a time is fine)

---

### 1.5 `ResetPasswordDto`

```typescript
// POST /api/auth/reset-password
class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/)
  @Matches(/[0-9]/)
  newPassword: string;
}
```

**Response** (`200`):
```json
{ "statusCode": 200, "data": { "message": "Password updated." } }
```

**Logic**:
- Find `PasswordResetToken` where `token = ?` AND `usedAt IS NULL` AND `expiresAt > now` → `400` if not found
- Hash new password, update `User.passwordHash`
- Mark token `usedAt = now` (single-use)
- Delete all `RefreshToken` rows for the user (force re-login)

---

### 1.6 Refresh Token (no DTO — cookie only)

**Endpoint**: `POST /api/auth/refresh`  
**Guard**: `JwtRefreshStrategy` reads `req.cookies.refreshToken`

**Logic**:
- Find `RefreshToken` row by hashed value; verify not expired
- Delete old row, issue new refresh token (rotation), set new cookie
- Return new `accessToken`

**Response** (`200`):
```json
{ "statusCode": 200, "data": { "accessToken": "<new-jwt>" } }
```

**Error** `401` if cookie absent, token not found, or expired.

---

### 1.7 Logout (no DTO — cookie only)

**Endpoint**: `POST /api/auth/logout`  
**Guard**: Optional — works even without valid access token (uses refresh cookie)

**Logic**:
- Delete `RefreshToken` row matching cookie value
- Clear `refreshToken` cookie (`maxAge=0`)

**Response** (`200`):
```json
{ "statusCode": 200, "data": { "message": "Logged out." } }
```

---

### 1.8 `/me` Endpoint

**Endpoint**: `GET /api/auth/me`  
**Guard**: `JwtAuthGuard`

**Response** (`200`):
```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "PATIENT",
    "preferredLocale": "EN",
    "isActive": true
  }
}
```

---

### 1.9 JWT Strategy Details

**Access token** (`jwt.strategy.ts`):
- Algorithm: `HS256`
- Secret: `JWT_ACCESS_SECRET` env var
- Expiry: `JWT_ACCESS_EXPIRY` (default `15m`)
- Payload: `{ sub: userId, role, email, iat, exp }`
- Extracted from: `Authorization: Bearer <token>` header

**Refresh token** (`jwt-refresh.strategy.ts`):
- Algorithm: `HS256`
- Secret: `JWT_REFRESH_SECRET` env var
- Expiry: `JWT_REFRESH_EXPIRY` (default `7d`)
- Extracted from: HTTP-only cookie `refreshToken`
- Stored as: `bcrypt`-hashed in `RefreshToken` table (one row per session)

---

### 1.10 Prisma Models Used

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  firstName     String
  lastName      String
  role          Role     @default(PATIENT)
  preferredLocale Locale @default(EN)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  refreshTokens       RefreshToken[]
  passwordResetTokens PasswordResetToken[]
  patientProfile      PatientProfile?
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  tokenHash String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model PasswordResetToken {
  id        String    @id @default(uuid())
  userId    String
  token     String    @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Phase 2 — Unit & E2E Tests

### 2.1 Unit Tests (`src/auth/auth.service.spec.ts`)

#### `register()`

| Scenario | Expected |
|----------|----------|
| Valid payload, unique email | Creates User + PatientProfile in transaction; returns `{ accessToken, user }` |
| Duplicate email | Throws `ConflictException` (409) |
| Password not meeting policy | Class-validator rejects before service is called |
| argon2 is called | Verify `argon2.hash` called with `type: argon2id` |

#### `login()`

| Scenario | Expected |
|----------|----------|
| Valid credentials | Returns `{ accessToken, user }`, sets refresh cookie |
| Wrong password | Throws `UnauthorizedException` (401) |
| Email not found | Throws `UnauthorizedException` (401) — same error as wrong password |
| Account disabled (`isActive: false`) | Throws `ForbiddenException` (403) with `"account_disabled"` |

#### `refreshTokens()`

| Scenario | Expected |
|----------|----------|
| Valid refresh token in cookie | Rotates token, returns new `accessToken` |
| Expired token | Throws `UnauthorizedException` |
| Token not in DB (already rotated / stolen) | Throws `UnauthorizedException` |
| Missing cookie | Throws `UnauthorizedException` |

#### `logout()`

| Scenario | Expected |
|----------|----------|
| Valid refresh cookie | Deletes `RefreshToken` row, clears cookie |
| Invalid/absent cookie | Still returns 200 (no-op, idempotent) |

#### `forgotPassword()`

| Scenario | Expected |
|----------|----------|
| Email exists | Creates `PasswordResetToken`, queues email job |
| Email does not exist | Returns same 200 response, no job queued |

#### `resetPassword()`

| Scenario | Expected |
|----------|----------|
| Valid single-use token | Updates `passwordHash`, marks token `usedAt`, deletes all `RefreshToken` rows |
| Expired token | Throws `BadRequestException` (400) |
| Already-used token | Throws `BadRequestException` (400) |
| Token not found | Throws `BadRequestException` (400) |

#### `getMe()`

| Scenario | Expected |
|----------|----------|
| Valid JWT | Returns sanitized user object (no `passwordHash`) |

---

### 2.2 Strategy Unit Tests

**`jwt.strategy.spec.ts`**:
- `validate()` returns `{ userId, role }` from payload
- Invalid/expired tokens rejected by Passport before `validate()` is called

**`jwt-refresh.strategy.spec.ts`**:
- Cookie parsed correctly
- `validate()` calls `authService.refreshTokens()` and returns new tokens

---

### 2.3 E2E Tests (`test/auth.e2e-spec.ts`)

Test environment: NestJS `Test.createTestingModule` with real Prisma pointing at a test PostgreSQL database. Redis mocked via BullMQ `testQueues`.

#### Flow 1 — Full Registration & Login

```
POST /api/auth/register (valid payload)
  → 201, body has accessToken and user
  → DB has User row + PatientProfile row
  → accessToken decodes to correct sub/role

GET /api/auth/me (with accessToken)
  → 200, returns user

POST /api/auth/login (same credentials)
  → 200, body has new accessToken
  → response sets refreshToken cookie
```

#### Flow 2 — Token Refresh & Rotation

```
POST /api/auth/login
  → capture refreshToken cookie

POST /api/auth/refresh (with cookie)
  → 200, new accessToken returned
  → response sets new refreshToken cookie

POST /api/auth/refresh (with OLD cookie)
  → 401 (token rotated; old one invalid)
```

#### Flow 3 — Logout

```
POST /api/auth/login
  → capture refreshToken cookie

POST /api/auth/logout (with cookie)
  → 200

POST /api/auth/refresh (with same cookie)
  → 401 (token deleted)

GET /api/auth/me (with accessToken)
  → still 200 until JWT expiry (stateless)
```

#### Flow 4 — Password Reset

```
POST /api/auth/forgot-password { email: existing }
  → 200

(spy on NotificationsService to capture token)

POST /api/auth/reset-password { token, newPassword }
  → 200

POST /api/auth/login (old password)
  → 401

POST /api/auth/login (new password)
  → 200

POST /api/auth/reset-password (same token again)
  → 400 (single-use)
```

#### Flow 5 — Validation Errors

```
POST /api/auth/register { email: "not-an-email" }
  → 400

POST /api/auth/register { email: "a@b.com", password: "weak" }
  → 400

POST /api/auth/register (duplicate email)
  → 409
```

---

### 2.4 Test Setup & Teardown

```typescript
// test/auth.e2e-spec.ts (outline)
beforeAll(async () => {
  app = await Test.createTestingModule({ imports: [AppModule] }).compile();
  prisma = app.get(PrismaService);
  await app.init();
});

afterEach(async () => {
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await app.close();
});
```

---

## Phase 3 — Frontend Integration

> **Status check**: All frontend auth specs (002–007, 009) are written. Implementation has **not yet started** (all 🟡). The integration contract below must be satisfied when frontend implementation begins.

### 3.1 Frontend Pages & Their Auth Endpoints

| Frontend Page / Module | Spec | Auth Endpoints Used |
|------------------------|------|---------------------|
| Login Page (`/login`) | [002](../002-login-page/spec.md) | `POST /api/auth/login` |
| Register Page (`/register`) | [003](../003-register-page/spec.md) | `POST /api/auth/register` |
| Forgot Password Page (`/forgot-password`) | [004](../004-forgot-password-page/spec.md) | `POST /api/auth/forgot-password` |
| Reset Password Page (`/reset-password`) | [005](../005-reset-password-page/spec.md) | `POST /api/auth/reset-password` |
| Auth Context & Hooks (`auth-api.ts`) | [007](../007-auth-context-and-hooks/spec.md) | `POST /api/auth/refresh`, `GET /api/auth/me`, `POST /api/auth/logout` |
| Profile Page (`/me`) | [009](../009-profile-page/spec.md) | `GET /api/auth/me` |

---

### 3.2 Axios Integration (`lib/api.ts`)

The frontend uses an axios instance with an auto-refresh interceptor. The backend must support this contract exactly:

```
1. Client makes API request with Authorization: Bearer <accessToken>
2. Backend returns 401
3. Interceptor catches 401, calls POST /api/auth/refresh (cookie sent automatically)
4. On success → retry original request with new accessToken
5. On refresh failure → clear state, redirect to /login
```

**Cookie requirements**:
- Name: `refreshToken`
- Flags: `HttpOnly`, `SameSite=Lax`, `Path=/api/auth/refresh`
- During development (cross-origin): set `SameSite=None; Secure` or use proxy  
- `withCredentials: true` must be set on the axios instance

**CORS** (`main.ts`):
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,  // 'http://localhost:5173'
  credentials: true,
});
```

---

### 3.3 Shared Type Contract

The `AuthUser` type in the frontend (`types/domain.ts`) must match the `/me` response exactly:

```typescript
// Frontend type (from spec 007)
interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'PATIENT';
  preferredLocale: 'EN' | 'AR';
  isActive: boolean;
}
```

Backend `/me` must return **all seven fields** — no extras, no omissions (extras are OK, omissions break the frontend).

---

### 3.4 Error Response Shape

The frontend `auth-api.ts` expects errors in this shape (from `http-exception.filter.ts`):

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized",
  "timestamp": "2026-05-04T12:00:00.000Z",
  "path": "/api/auth/login"
}
```

The frontend reads `error.response.data.message` for display. Ensure:
- `401` — bad credentials / expired token
- `403` — disabled account (message must be `"account_disabled"`)
- `409` — duplicate email (message must clearly state email conflict)
- `400` — validation failures include per-field `message` array from class-validator

---

### 3.5 Development Checklist (Backend ↔ Frontend)

- [ ] Backend `POST /api/auth/register` returns `{ data: { accessToken, user } }`
- [ ] Backend `POST /api/auth/login` sets `refreshToken` HTTP-only cookie and returns `{ data: { accessToken, user } }`
- [ ] Backend `GET /api/auth/me` protected by `JwtAuthGuard`; returns all `AuthUser` fields
- [ ] Backend `POST /api/auth/refresh` reads cookie, rotates token, returns `{ data: { accessToken } }`
- [ ] Backend `POST /api/auth/logout` clears cookie and returns `200`
- [ ] Backend `POST /api/auth/forgot-password` always returns `200` (no enumeration)
- [ ] Backend `POST /api/auth/reset-password` token is single-use; on success all refresh tokens purged
- [ ] CORS configured for `http://localhost:5173` with `credentials: true`
- [ ] Swagger docs at `/api/docs` include all auth endpoints with example request/response bodies
- [ ] MailHog (dev SMTP) receives password-reset email with reset link `${FRONTEND_URL}/reset-password?token=<token>`

---

### 3.6 Reset Link Format

The password-reset email must include a link in this format:
```
${FRONTEND_URL}/reset-password?token=<raw-token>
```

The frontend `ResetPasswordPage` reads `?token` from the URL query string and submits it to `POST /api/auth/reset-password`.

---

## Acceptance Criteria

- [ ] All seven auth endpoints return correct HTTP codes and response shapes
- [ ] `RegisterDto`, `LoginDto`, `ForgotPasswordDto`, `ResetPasswordDto` validated by `class-validator`; invalid inputs return `400` with per-field messages
- [ ] Duplicate email on register returns `409`
- [ ] Disabled account on login returns `403` with `"account_disabled"` message
- [ ] Refresh token rotation: old token invalid after first use
- [ ] Password-reset token is single-use and expires after 1 hour
- [ ] Logout deletes refresh token row and clears cookie
- [ ] `/me` returns all `AuthUser` fields; `passwordHash` never included
- [ ] All unit tests pass: `pnpm test src/auth`
- [ ] All E2E flows pass: `pnpm test:e2e -- --testPathPattern=auth`
- [ ] CORS allows `http://localhost:5173` with credentials
- [ ] Swagger docs include all auth endpoints
