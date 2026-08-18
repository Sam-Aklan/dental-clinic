# Spec: Common (`backend/src/common/`)

**Type**: Backend NestJS Shared Infrastructure  
**Plan reference**: [BACKEND_PLAN.md - section 13 Common](../../BACKEND_PLAN.md#13-common)  
**Frontend specs consumed**:
- [007-auth-context-and-hooks](../007-auth-context-and-hooks/spec.md) - token handling, current user state, refresh behavior, and authenticated API calls
- [008-protected-route](../008-protected-route/spec.md) - role-gated route access and redirects
- [025-error-pages](../025-error-pages/spec.md) - standard handling for `401`, `403`, `404`, and server errors
- [026-common-components](../026-common-components/spec.md) - shared API loading/error states and reusable UI patterns
- All page specs that call REST endpoints depend on the Common response wrapper, validation errors, auth decorators, and guards.

> **Frontend implementation status**: User confirmed on 2026-05-06 that the corresponding frontend pages are not in place yet. Phase 4 is therefore a contract-first handoff for future frontend implementation.

---

## Overview

Common owns cross-cutting backend primitives used by every feature module. It standardizes authentication and authorization, request metadata access, response envelopes, and error responses so each module can focus on its own business rules.

All Common behavior:

1. Protects private routes through JWT authentication and role checks.
2. Allows explicitly public routes through a `@Public()` decorator.
3. Exposes current authenticated user metadata through `@CurrentUser()`.
4. Exposes booking idempotency keys through `@IdempotencyKey()`.
5. Wraps successful HTTP responses as `{ "statusCode": number, "data": ... }`.
6. Standardizes exception responses with status, message, error name, timestamp, and path.
7. Does not own domain services, database models, or frontend-specific behavior.

---

## Phase 1 - DTOs, Validation & Shared Contracts

### 1.1 File Map

```
backend/src/common/
|-- decorators/
|   |-- current-user.decorator.ts
|   |-- idempotency-key.decorator.ts
|   |-- public.decorator.ts
|   `-- roles.decorator.ts
|-- filters/
|   `-- http-exception.filter.ts
|-- guards/
|   |-- jwt-auth.guard.ts
|   `-- roles.guard.ts
|-- interceptors/
|   `-- transform.interceptor.ts
|-- dto/
|   |-- error-response.dto.ts
|   `-- success-response.dto.ts
`-- types/
    |-- authenticated-user.type.ts
    `-- request-with-user.type.ts
```

### 1.2 Authenticated User Contract

JWT strategies attach a minimal authenticated user object to the request. Common decorators and guards read this shape.

```typescript
export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'PATIENT';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  doctorProfileId?: string | null;
  patientProfileId?: string | null;
}
```

Acceptance criteria:

- `userId`, `email`, and `role` are always present on authenticated HTTP requests.
- `doctorProfileId` is present only when the authenticated user has a linked doctor profile.
- `patientProfileId` is present only when the authenticated user has a linked patient profile.
- Guards and decorators do not query the database directly; they rely on the validated JWT payload and strategy-populated request state.

### 1.3 `@Roles()` Decorator

```typescript
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
```

Validation rules:

- The decorator accepts one or more roles from the shared `UserRole` union.
- Empty role lists should not be used on controllers; routes without role restrictions should omit the decorator or be explicitly `@Public()`.
- Swagger route documentation should align with role metadata in the controller.

### 1.4 `@Public()` Decorator

```typescript
export const Public = () => SetMetadata('isPublic', true);
```

Acceptance criteria:

- `JwtAuthGuard` bypasses authentication only when route or controller metadata has `isPublic = true`.
- Public routes are intentional and visible at the controller method level when possible.
- Public routes still run validation pipes and exception filters.

### 1.5 `@CurrentUser()` Decorator

```typescript
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return data ? request.user?.[data] : request.user;
  },
);
```

Usage examples:

```typescript
@CurrentUser() user: AuthenticatedUser
@CurrentUser('userId') userId: string
@CurrentUser('role') role: UserRole
```

Validation rules:

- If used on a private route, the decorator returns the authenticated user from `request.user`.
- If used on a public route, the decorator may return `undefined`; controllers should not require it there.
- The decorator must not expose token claims that are not part of `AuthenticatedUser`.

### 1.6 `@IdempotencyKey()` Decorator

```typescript
export const IdempotencyKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.header('Idempotency-Key') ?? undefined;
  },
);
```

Validation rules:

- The decorator reads the `Idempotency-Key` header exactly.
- AppointmentsModule validates whether the key is required for booking routes.
- Recommended header constraints for modules that require it: non-empty string, max 128 characters, printable ASCII.
- Missing or invalid keys should produce `400 Bad Request` on endpoints that require idempotency.

### 1.7 `JwtAuthGuard`

`JwtAuthGuard` extends Passport's JWT guard and respects `@Public()` metadata.

Acceptance criteria:

- Private routes without an access token return `401 Unauthorized`.
- Invalid or expired access tokens return `401 Unauthorized`.
- `@Public()` routes skip JWT enforcement.
- Guard behavior is consistent for controller-level and method-level metadata.
- The guard does not clear refresh cookies; refresh/logout behavior remains in AuthModule.

### 1.8 `RolesGuard`

`RolesGuard` enforces `@Roles()` metadata after authentication.

Acceptance criteria:

- Routes with no `@Roles()` metadata allow any authenticated role unless a module adds stricter service-level ownership checks.
- Routes with role metadata require the authenticated user's role to be included in the allowed list.
- Unauthenticated access is treated as `401` by `JwtAuthGuard`, not as `403` by `RolesGuard`.
- Authenticated users with insufficient roles receive `403 Forbidden`.
- Ownership checks such as "doctor self" or "patient own" remain in the owning module service/controller logic.

### 1.9 Success Response DTO

All successful HTTP responses are wrapped by `TransformInterceptor`.

```typescript
class SuccessResponseDto<T> {
  statusCode: number;
  data: T;
}
```

Response examples:

```json
{
  "statusCode": 200,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

```json
{
  "statusCode": 204,
  "data": null
}
```

Acceptance criteria:

- Plain controller return values are wrapped once.
- Already-wrapped values are not double-wrapped if a controller intentionally returns `{ statusCode, data }`.
- `null` and `undefined` responses are represented as `data: null`.
- Streamed files, CSV exports, and raw responses may opt out if wrapping would break the HTTP contract.
- Socket.IO events are not wrapped by this interceptor.

### 1.10 Error Response DTO

`HttpExceptionFilter` standardizes thrown HTTP exceptions.

```typescript
class ErrorResponseDto {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

Response example:

```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request",
  "timestamp": "2026-05-06T12:00:00.000Z",
  "path": "/api/auth/register"
}
```

Validation and mapping requirements:

- `ValidationPipe` errors use `400 Bad Request` and preserve useful field-level messages.
- `UnauthorizedException` maps to `401 Unauthorized`.
- `ForbiddenException` maps to `403 Forbidden`.
- `NotFoundException` maps to `404 Not Found`.
- `ConflictException` maps to `409 Conflict`.
- Unexpected errors map to `500 Internal Server Error` without leaking stack traces to clients.
- `timestamp` is an ISO 8601 UTC string.
- `path` includes the request URL path including `/api` prefix.

### 1.11 Global Registration

Common providers should be registered in the app bootstrap or root module according to NestJS best practices.

Expected global behavior:

- `ValidationPipe` runs before controllers with `whitelist: true`, `forbidNonWhitelisted: true`, and `transform: true`.
- `TransformInterceptor` wraps REST responses globally unless a route explicitly opts out.
- `HttpExceptionFilter` formats HTTP errors globally.
- `JwtAuthGuard` can be registered globally if route-level `@Public()` is implemented correctly, or applied per controller consistently.
- `RolesGuard` is applied wherever `@Roles()` is used.

---

## Phase 2 - Backend Integration Behavior

### 2.1 Route Protection Matrix

Feature modules must use Common decorators and guards consistently.

| Module | Public Routes | Private Role-Gated Routes |
|---|---|---|
| AuthModule | Register, login, refresh, forgot/reset password | `/me`, logout |
| DoctorsModule | Public doctor directory and detail | Admin create/update, doctor self updates, schedule overrides |
| ClinicConfigModule | Read config, working hours, holidays | Admin config, hours, and holiday mutations |
| AppointmentsModule | Slot lookup | Patient/receptionist booking, list, status, reschedule, cancel |
| WaitlistModule | Offer lookup only if tokenized later; otherwise none | Patient waitlist and offer actions, staff listing |
| QueueModule | Kiosk token connection path after token validation | Staff/doctor Socket.IO JWT connections and kiosk-token issuing endpoint |
| AnalyticsModule | None | Admin/receptionist/doctor scoped analytics |
| AuditModule | None | Admin-only audit log listing |

Acceptance criteria:

- Every non-public controller route is protected by JWT authentication.
- Every staff-only route declares role requirements.
- Public routes are explicitly decorated with `@Public()`.
- Service-level ownership rules remain tested in feature modules.

### 2.2 Response Envelope Behavior

The REST API contract from `BACKEND_PLAN.md` requires consistent response envelopes.

Acceptance criteria:

- `GET`, `POST`, `PATCH`, and `DELETE` responses use the same `{ statusCode, data }` envelope unless intentionally returning raw files or streams.
- Created resources return `201` when NestJS defaults or controller decorators set created status.
- Empty deletes return `data: null` with a stable status code.
- Pagination payloads are wrapped under `data`, not merged with the envelope.
- Feature specs can document only their `data` payload while relying on Common for the outer wrapper.

### 2.3 Error Handling Behavior

Common error handling must be predictable enough for forms, protected routes, and global error pages.

Acceptance criteria:

- Validation errors preserve arrays of messages when class-validator returns multiple violations.
- Domain exceptions thrown by services are not replaced with generic messages.
- Unexpected internal errors are logged server-side and returned as generic `500` responses.
- Prisma errors may be mapped by feature services or by a shared error layer, but clients never receive raw Prisma error objects.
- Error responses are never wrapped by `TransformInterceptor` as success payloads.

### 2.4 Swagger Integration

Common contracts should be reflected in module Swagger docs.

Acceptance criteria:

- Protected routes include bearer auth metadata through `@ApiBearerAuth()` at controller or method level.
- Controllers document common `401`, `403`, `404`, and `409` responses where applicable.
- DTOs used for standard success and error envelopes are available for Swagger references if the project uses wrapper helpers.
- Public routes are not documented as requiring bearer auth.

### 2.5 Security Requirements

Acceptance criteria:

- JWT guard never accepts tokens from query params for normal REST routes.
- Sensitive headers, cookies, access tokens, refresh tokens, password reset tokens, and password fields are never returned in error messages.
- Role checks are deny-by-default when route metadata declares roles and the user role is missing or unknown.
- Validation strips unknown request fields and rejects non-whitelisted fields.
- CORS and helmet remain configured at the app level, outside this module, but must not conflict with the Common auth/error contracts.

---

## Phase 3 - Unit Testing & E2E Testing

### 3.1 Unit Tests

Add focused tests for Common primitives.

Recommended files:

```
backend/src/common/guards/jwt-auth.guard.spec.ts
backend/src/common/guards/roles.guard.spec.ts
backend/src/common/decorators/current-user.decorator.spec.ts
backend/src/common/decorators/idempotency-key.decorator.spec.ts
backend/src/common/interceptors/transform.interceptor.spec.ts
backend/src/common/filters/http-exception.filter.spec.ts
```

Guard test cases:

| Case | Expected Result |
|---|---|
| Route has `@Public()` metadata | `JwtAuthGuard` allows request without invoking JWT validation failure |
| Route has no `@Public()` metadata and no token | Request is rejected with `401` |
| Route allows `ADMIN` and user is admin | `RolesGuard` allows request |
| Route allows `ADMIN` and user is receptionist | `RolesGuard` rejects with `403` |
| Route has no role metadata | `RolesGuard` allows authenticated request |
| Request has no user in `RolesGuard` | Guard rejects or lets auth guard produce `401`, according to implementation order |

Decorator test cases:

| Case | Expected Result |
|---|---|
| `@CurrentUser()` without key | Returns full authenticated user object |
| `@CurrentUser('userId')` | Returns only the user ID |
| `@CurrentUser()` on public request | Returns `undefined` safely |
| `@IdempotencyKey()` with header | Returns the header value |
| `@IdempotencyKey()` without header | Returns `undefined` |

Interceptor and filter test cases:

| Case | Expected Result |
|---|---|
| Controller returns object | Response is wrapped as `{ statusCode, data }` |
| Controller returns array | Array is wrapped under `data` |
| Controller returns `undefined` | Response uses `data: null` |
| Controller returns already wrapped value | Interceptor does not double-wrap |
| Validation exception is thrown | Filter returns standard `400` payload with message array |
| Forbidden exception is thrown | Filter returns standard `403` payload |
| Unknown error is thrown | Filter returns generic `500` payload without stack trace |

### 3.2 E2E Tests

Add common behavior coverage either in a dedicated `common.e2e-spec.ts` file or in feature e2e suites where the behavior is exercised through real routes.

Required e2e scenarios:

1. Public route such as `GET /api/doctors` is accessible without an access token.
2. Private route such as `GET /api/auth/me` rejects missing access token with standard `401` payload.
3. Admin-only route rejects a patient or receptionist with standard `403` payload.
4. Valid authenticated request returns the standard success envelope.
5. Invalid request body returns a standard `400` validation payload and strips unknown fields.
6. Not-found resource returns standard `404` payload.
7. Conflict workflow such as duplicate booking returns standard `409` payload.
8. Booking route requiring `Idempotency-Key` rejects a missing or invalid key with `400`.
9. Error payload includes `timestamp` and `path` and does not include stack traces, tokens, or passwords.

Test data requirements:

- Seed or create one user per role: admin, receptionist, doctor, patient.
- Use real JWT access tokens from AuthModule login/register helpers.
- Exercise Common through real controllers, not synthetic test-only routes, where feasible.
- Keep ownership-specific assertions in the owning module e2e suites.

Commands:

```bash
pnpm test
pnpm test:e2e
```

---

## Phase 4 - Frontend Integration

### 4.1 Current Status

The user confirmed the corresponding frontend pages are not implemented yet. Common has no dedicated frontend page; it defines API contracts that every future page and frontend API client must consume.

Integration should therefore proceed in this order:

1. Implement Common guards, decorators, response interceptor, exception filter, and validation behavior.
2. Verify Swagger and API responses for representative routes from each module.
3. Implement frontend auth context, protected route handling, error pages, and shared API utilities from specs 007, 008, 025, and 026.
4. Wire page-specific API calls after their owning backend modules expose stable contracts.
5. Verify role redirects, form validation messages, and global error states against real backend responses.

### 4.2 Frontend-Visible Contracts

Frontend API clients should rely on these Common contracts:

```typescript
export interface ApiSuccess<T> {
  statusCode: number;
  data: T;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

Auth and role behavior:

- `401` means the frontend should clear or refresh auth state according to AuthModule rules, then redirect to login when recovery fails.
- `403` means the user is authenticated but not allowed; protected routes should render or redirect to the forbidden page.
- Public pages must not require an access token for doctors, clinic config, working hours, holidays, or slot lookup endpoints.
- Staff-only pages must use the same role names as the backend: `ADMIN`, `RECEPTIONIST`, `DOCTOR`, `PATIENT`.

Validation behavior:

- Form-level validation can show `message` when it is a string.
- Field/error-summary components can show each item when `message` is an array.
- Unknown-field errors from `forbidNonWhitelisted` should be treated as frontend/backend contract mismatches and fixed in the frontend request shape.

### 4.3 Frontend Integration Acceptance Criteria

- [ ] Frontend API client unwraps successful responses from `data` consistently.
- [ ] Frontend API client preserves `statusCode`, `message`, `error`, `timestamp`, and `path` for error handling.
- [ ] Protected routes map backend roles exactly without local aliases.
- [ ] Public pages can call public endpoints without sending an access token.
- [ ] Authenticated pages attach `Authorization: Bearer <access-token>` to REST calls.
- [ ] Forms display validation errors returned by the backend without depending on non-standard error shapes.
- [ ] `401`, `403`, `404`, and `500` responses route to the planned error/login states from specs 008 and 025.
- [ ] Booking API calls include `Idempotency-Key` when required by AppointmentsModule.
- [ ] Frontend build and backend `pnpm test` / `pnpm test:e2e` pass once corresponding pages are implemented.

---

## Edge Cases

- A route is accidentally missing both `@Public()` and auth guards: treat as a security defect and add guard coverage.
- A route has `@Roles()` but no authenticated user: return `401`, not `403`, when auth is missing.
- A controller returns an already wrapped response: avoid double wrapping.
- A controller streams CSV or files: bypass response wrapping if needed to preserve content type and body.
- Validation receives extra fields: reject with `400` because non-whitelisted fields are forbidden.
- Validation receives transformed query params: ensure numeric and boolean query fields are transformed before DTO validation.
- Service throws a raw unexpected error: return generic `500` while logging internal detail server-side.
- Public route uses `@CurrentUser()` optionally: return `undefined` without crashing.
- Frontend expects a different error shape: update frontend API utilities rather than changing module-specific controllers.

---

## Acceptance Criteria

- [ ] Common decorators are implemented: `@Roles()`, `@CurrentUser()`, `@Public()`, and `@IdempotencyKey()`.
- [ ] `JwtAuthGuard` enforces private route authentication and respects `@Public()` metadata.
- [ ] `RolesGuard` enforces route role metadata and returns stable forbidden behavior.
- [ ] Global validation rejects invalid and non-whitelisted request input.
- [ ] REST success responses use the standard `{ statusCode, data }` envelope.
- [ ] REST error responses use the standard `{ statusCode, message, error, timestamp, path }` shape.
- [ ] Unit tests cover guards, decorators, interceptor, and exception filter behavior.
- [ ] E2E tests cover public/private route access, role denial, validation, response wrapping, and standard error payloads.
- [ ] Frontend integration remains contract-first until the corresponding frontend pages and shared API utilities are implemented.
