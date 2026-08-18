# Implementation Plan: Analytics Module

**Branch**: `035-analytics-module` | **Date**: 2026-05-16 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-analytics-module/spec.md`

## Summary

Implement `backend/src/analytics/` as a read-only NestJS module exposing 14 endpoints under `/api/analytics` for role-scoped clinic dashboards. The service aggregates Prisma data (appointments, doctors, waitlist, patients) using Luxon for clinic-timezone date math, fills zero-count buckets in application code, and returns the standard `{ statusCode, data }` envelope. No schema changes are required; no audit events are written.

## Technical Context

**Language/Version**: TypeScript strict mode on NestJS 10
**Primary Dependencies**: NestJS 10, Prisma, PostgreSQL, Passport JWT, Swagger/OpenAPI, Jest, Luxon
**Storage**: PostgreSQL via Prisma (read-only; no new migrations required)
**Testing**: Jest unit tests (`analytics.service.spec.ts`, DTO specs) and NestJS e2e (`test/analytics.e2e-spec.ts`)
**Target Platform**: Node.js backend service
**Project Type**: Backend REST module — no BullMQ workers, no Socket.IO gateways
**Performance Goals**: Analytics reads should return within 500ms p95 for typical single-clinic data volumes
**Constraints**: Read-only; no Prisma writes; no audit log writes; max range 366 days for clinic-level reports
**Scale/Scope**: Single clinic instance; tens of doctors; hundreds to low thousands of patients and appointments

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Contract-First NestJS Modules**: Module at `backend/src/analytics/`. Controller (`analytics.controller.ts`) handles transport, guard wiring, and Swagger decorators only. Service (`analytics.service.ts`) owns all aggregation business rules. DTOs in `analytics/dto/` define query params and response shapes. `PrismaService` is injected into `AnalyticsService` only — the controller does not touch Prisma. `AnalyticsModule` imports `PrismaModule`. No BullMQ processors or Socket.IO gateways. No cross-module side effects (reads from other modules' tables directly via Prisma). **PASS**.

- **Security and Authorization by Default**: Every endpoint uses `JwtAuthGuard` + `RolesGuard`. No public routes. Patient role denied all 14 endpoints. Doctor endpoints verify `doctorProfileId` on `AuthenticatedUser` and return `403` when the profile is missing. Aggregate chart payloads never expose patient names or IDs; only `/follow-ups` exposes `patientName` (staff and doctor roles only). Read-only — no state mutation. No audit events written (spec explicitly permits this). No secrets, PII, or tokens in logs or response payloads. **PASS**.

- **Data Consistency and Idempotent Workflows**: Zero mutations — no transactions, no idempotency keys. UTC timestamps stored and queried via Prisma; clinic-timezone date boundaries computed in application code using Luxon (same pattern as `SlotGeneratorService`). No BullMQ or Socket.IO side effects. **PASS**.

- **Testable Boundaries and Required Coverage**: Unit tests for service aggregation logic with mocked `PrismaService`; DTO validation unit tests covering reject/pass cases; e2e tests with deterministic seeded clinic data covering auth, RBAC, date math, zero-fill, and follow-up scoping. Time is controlled via injected `DateTime.now()` override for clinic-local today tests. Resources closed after e2e. **PASS**.

- **Observability and Operational Readiness**: Swagger `@ApiTags('analytics')` on controller; all endpoints documented with `@ApiOperation`, `@ApiResponse` (200, 400, 401, 403). Standard `{ statusCode, data }` envelope via existing `TransformInterceptor`. No new environment variables required (reads `ClinicConfig.timeZone` from DB). No migrations needed. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/001-analytics-module/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── analytics-api.md # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   ├── analytics.controller.ts
│   │   ├── analytics.service.ts
│   │   ├── analytics.service.spec.ts
│   │   ├── analytics.types.ts
│   │   └── dto/
│   │       ├── index.ts
│   │       ├── date-range-query.dto.ts
│   │       ├── bucketed-range-query.dto.ts
│   │       ├── cancellation-trends-query.dto.ts
│   │       ├── follow-ups-query.dto.ts
│   │       ├── my-stats-query.dto.ts
│   │       ├── my-trends-query.dto.ts
│   │       ├── appointment-trend-response.dto.ts
│   │       ├── status-distribution-response.dto.ts
│   │       ├── doctor-utilization-response.dto.ts
│   │       ├── appointments-by-weekday-response.dto.ts
│   │       ├── cancellation-trend-response.dto.ts
│   │       ├── kpi-summary-response.dto.ts
│   │       ├── follow-up-response.dto.ts
│   │       ├── waitlist-summary-response.dto.ts
│   │       ├── today-summary-response.dto.ts
│   │       ├── today-by-doctor-response.dto.ts
│   │       ├── doctor-stats-response.dto.ts
│   │       ├── my-trend-response.dto.ts
│   │       └── hourly-load-response.dto.ts
│   ├── app.module.ts      ← add AnalyticsModule import
│   └── [other existing modules unchanged]
└── test/
    └── analytics.e2e-spec.ts
```

**Structure Decision**: Single NestJS module (`backend/src/analytics`) following the same pattern as `appointments`, `waitlist`, and `doctors` modules. Frontend implementation is explicitly excluded per spec; this plan covers the backend contract-first delivery only.

## Complexity Tracking

> No constitution violations to justify.
