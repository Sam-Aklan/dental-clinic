<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles:
- template principle 1 -> I. Spec-Driven Delivery
- template principle 2 -> II. Contract-First Full-Stack Integration
- template principle 3 -> III. Verification Is Mandatory
- template principle 4 -> IV. Minimal, Modular Ownership
- template principle 5 -> V. React and NestJS Best Practices
Added sections:
- Engineering Standards
- Delivery Workflow
Removed sections:
- None
Templates requiring updates:
- ✅ updated .specify/templates/plan-template.md
- ✅ updated .specify/templates/spec-template.md
- ✅ updated .specify/templates/tasks-template.md
- ✅ validated .specify/templates/commands/*.md (no files present)
Follow-up TODOs:
- None
-->
# Dental Clinic Scheduling & Queue Management Constitution

## Core Principles

### I. Spec-Driven Delivery
Every meaningful feature or module change MUST start from an explicit spec, plan, or
approved task definition that states scope, user value, API impact, and acceptance
criteria. Implementations MUST stay aligned with `plan.md`, the relevant feature spec
under `docs/` or `specs/`, and the more specific module or page plan when one exists.
Unspecified behavior MUST be clarified or recorded as an assumption before it becomes
code. Rationale: this project spans a React dashboard and a NestJS backend; contract
drift is expensive and specification discipline is the primary guardrail.

### II. Contract-First Full-Stack Integration
Backend endpoints, DTOs, auth rules, error shapes, and response envelopes MUST be
treated as stable integration contracts. Frontend data models, hooks, forms, and query
keys MUST be derived from those contracts rather than inferred ad hoc. Any backend
contract change MUST update the consuming frontend specification, tests, and typed
client code in the same delivery stream. Rationale: this product depends on tight React
and NestJS coordination across booking, queue, analytics, and admin workflows.

### III. Verification Is Mandatory
Changes MUST include verification proportional to the risk of the change. Business-rule,
DTO, contract, and state-transition changes MUST add or update automated tests.
Feature completion is not valid until the relevant build, type-check, and targeted test
commands pass, or an explicit blocker is recorded. Manual-only validation is insufficient
for contract, security, or workflow changes. Rationale: scheduling, role-based access,
and clinic operations are sensitive to regressions that are often invisible in code review.

### IV. Minimal, Modular Ownership
Code MUST remain within the owning layer and module boundary: controllers manage HTTP,
services own business rules, Prisma owns persistence access, React routes stay thin, and
UI components focus on presentation while hooks and lib modules own data logic. Changes
MUST prefer the smallest correct implementation, avoid speculative abstractions, and not
introduce cross-module shortcuts that bypass established boundaries. Rationale: the codebase
already separates backend modules and frontend feature folders; preserving that structure
keeps delivery fast and maintainable.

### V. React and NestJS Best Practices
Frontend work MUST use the established stack: React + TypeScript + Vite, TanStack Router,
TanStack Query, Zustand, Axios, React Hook Form, Zod, Tailwind, and shadcn/ui.
Backend work MUST use NestJS patterns with DTO validation, guards, Swagger metadata,
transaction-safe service logic, and Prisma schema discipline. New code MUST preserve
responsive behavior, RTL/i18n support, accessibility, and typed APIs. Rationale: the
project explicitly targets production-grade React and NestJS integration, not generic CRUD.

## Engineering Standards

- API responses MUST preserve the documented `{ statusCode, data }` success envelope and
  the documented error shape unless a spec explicitly defines an exception.
- Authentication, authorization, and ownership checks MUST be enforced in the owning
  backend module and reflected in frontend route guards and UI affordances.
- Dates, times, locales, and queue/scheduling calculations MUST respect the clinic
  timezone and bilingual EN/AR requirements documented in `plan.md`.
- Frontend forms MUST use typed schemas and MUST not ship fields or assumptions that are
  inconsistent with the matching NestJS DTO contract.
- Boilerplate or starter-template documentation that conflicts with this constitution,
  `plan.md`, or feature specs MUST be replaced or treated as non-authoritative.

## Delivery Workflow

- Plans MUST include a Constitution Check that confirms spec alignment, contract impact,
  verification scope, module ownership, and React/NestJS best-practice compliance.
- Specs MUST document user scenarios, edge cases, functional requirements, contract or
  integration impact, and measurable success criteria.
- Tasks MUST include explicit verification work for affected stories and MUST identify
  the concrete files or modules being changed.
- Implementation MUST proceed in vertical slices where feasible so that backend contract,
  frontend integration, and verification remain synchronized.
- Any constitution violation MUST be documented in the implementation plan with a clear
  justification and a rejected simpler alternative.

## Governance

This constitution overrides conflicting local habits and starter-template guidance.
Feature plans, specs, tasks, code reviews, and completion summaries MUST explicitly check
for compliance with these principles.

Amendments MUST update this file and any affected Spec Kit templates in the same change.
When governance meaning changes materially, the version MUST increase by semantic intent:
MAJOR for incompatible principle removals or redefinitions, MINOR for new principles or
substantive new obligations, and PATCH for clarifications or wording-only refinements.

Compliance review is required at three points: during planning through the Constitution
Check, during implementation through file- and module-level review, and at completion
through verification results. Runtime development guidance in `AGENTS.md`,
`backend/AGENTS.md`, and `dashboard/AGENTS.md` MUST remain consistent with this
constitution and may be more specific, but never less strict.

**Version**: 1.0.0 | **Ratified**: 2026-05-17 | **Last Amended**: 2026-05-17
