# Test Specification: Audit Log Page

Source: `docs/022-audit-log-page/spec.md`

Vitest scaffold: `dashboard/src/test/audit-log/audit-log.specification.test.ts`

## Scope

These specifications cover the administrator audit log page for `/admin/audit`: route access, default clinic-date filtering, API filter serialization, URL state, audit table rendering, payload details and redaction, pagination, sorting, refresh behavior, loading and error recovery, Arabic/RTL behavior, mobile usability, and accessibility.

## Test Groups

| Group | IDs | Coverage |
| --- | --- | --- |
| Route and access | AL-T001 - AL-T006 | ADMIN-only route, forbidden behavior, AdminLayout shell, page heading, refresh action |
| Default loading and API contract | AL-T007 - AL-T014 | `GET /audit`, last-7-days date range, page size, query keys, keep-previous-data, manual refresh |
| Filters and URL state | AL-T015 - AL-T028 | Date range, actor, action, target type, target ID, pagination, sorting, reset, refresh restore |
| Table and mobile rendering | AL-T029 - AL-T039 | Time, actor, action label fallback, target, summary, immutable rows, desktop table, mobile cards |
| Payload details and redaction | AL-T040 - AL-T052 | Details sheet/dialog, actor/action/target/timestamp metadata, JSON formatting, sensitive-key redaction, malformed and large payload handling |
| Loading, empty, and error states | AL-T053 - AL-T062 | Skeletons, subtle refetch indicators, empty range, endpoint errors, retry, forbidden redirect |
| i18n, RTL, accessibility | AL-T063 - AL-T074 | English/Arabic strings, RTL layout, accessible labels, focus management, keyboard operation, pagination announcements |

## Vitest Specifications

### Route and access

- **AL-T001**: Renders `/admin/audit` for an administrator and shows the Audit Log title, subtitle, filters, table area, and Refresh action.
- **AL-T002**: Redirects or blocks PATIENT users with the existing forbidden state and without requesting audit data.
- **AL-T003**: Redirects or blocks DOCTOR users with the existing forbidden state and without requesting audit data.
- **AL-T004**: Redirects or blocks RECEPTIONIST users with the existing forbidden state and without requesting audit data.
- **AL-T005**: Redirects unauthenticated users according to the existing protected-route behavior.
- **AL-T006**: Uses the admin layout shell around the page content and keeps the route file limited to guard/layout composition.

### Default loading and API contract

- **AL-T007**: Requests audit rows from `GET /audit` on initial render.
- **AL-T008**: Sends default `from` and `to` filters for the last 7 days in the clinic timezone when URL dates are absent.
- **AL-T009**: Sends `page=1`, `pageSize=50`, `sortBy=createdAt`, and `sortDir=desc` by default unless the route convention omits default values.
- **AL-T010**: Builds audit query keys from every server-affecting filter, page, page size, sort field, and sort direction.
- **AL-T011**: Keeps previous audit data visible while filter, page, or sorting requests are refetching.
- **AL-T012**: Shows an initial table skeleton while the first audit request is loading.
- **AL-T013**: The Refresh action refetches the current audit query without clearing filters or URL params.
- **AL-T014**: Disables or marks the Refresh action as pending while the manual refetch is in progress.

### Filters and URL state

- **AL-T015**: Applying a date range serializes `from` and `to` to URL search params and sends them to `GET /audit`.
- **AL-T016**: Changing date range resets `page` to 1 while preserving other active filters.
- **AL-T017**: Filtering by actor ID serializes `actorId` and sends the exact actor ID to the API.
- **AL-T018**: Filtering by actor search text serializes `actorName` only when backend support is enabled or implemented.
- **AL-T019**: Selecting one or more actions serializes `action` as comma-separated raw action keys.
- **AL-T020**: Selecting one or more target types serializes `targetType` as comma-separated values when multiple target types are supported.
- **AL-T021**: Entering a target ID serializes `targetId` and sends the exact target ID to the API.
- **AL-T022**: Empty, all-value, or unsupported filter values are omitted from outgoing audit requests.
- **AL-T023**: Reset filters restores the default date range, clears optional filters, clears sort overrides if route convention requires it, and returns to page 1.
- **AL-T024**: Pagination writes `page` to URL search params and preserves active filters.
- **AL-T025**: Sorting by Time writes `sortBy=createdAt` and the selected `sortDir` to URL search params.
- **AL-T026**: Sorting by Actor, Action, or Target Type writes the backend-supported sort keys and selected direction.
- **AL-T027**: Restores date range, filters, pagination, and sorting from URL search params on refresh.
- **AL-T028**: Ignores invalid URL sort direction, page, or date values by falling back to safe defaults.

### Table and mobile rendering

- **AL-T029**: Renders Time in the clinic timezone with localized formatting and keeps the ISO value available in details.
- **AL-T030**: Renders Actor as full name plus role when actor data exists.
- **AL-T031**: Falls back to actor ID when actor name fields are missing.
- **AL-T032**: Renders a system or unknown actor fallback when `actor` and `actorId` are null.
- **AL-T033**: Renders known action keys with localized labels and keeps the raw machine key available.
- **AL-T034**: Falls back to the raw action key when no known action label exists.
- **AL-T035**: Renders Target as entity type badge plus shortened target ID when target ID exists.
- **AL-T036**: Renders a target fallback when `targetId` is null.
- **AL-T037**: Renders a human-readable summary derived from payload without exposing redacted sensitive values.
- **AL-T038**: Does not render edit, delete, retry-mutation, or row mutation actions because audit rows are immutable.
- **AL-T039**: Renders mobile audit cards with labeled time, actor, action, target, summary, and View details controls without horizontal page scrolling.

### Payload details and redaction

- **AL-T040**: Opens the payload details sheet or dialog from a row View details action.
- **AL-T041**: Details view shows full actor name, role, and ID when actor data exists.
- **AL-T042**: Details view shows raw action key and localized action label.
- **AL-T043**: Details view shows target entity type and target ID.
- **AL-T044**: Details view shows both ISO timestamp and localized timestamp display.
- **AL-T045**: Pretty-prints object payload JSON with stable indentation.
- **AL-T046**: Renders null payload as a safe empty or no-payload state.
- **AL-T047**: Redacts sensitive keys named `password`, `token`, `refreshToken`, `accessToken`, `authorization`, and `secret` before rendering.
- **AL-T048**: Redacts sensitive keys recursively inside nested objects and arrays.
- **AL-T049**: Redacts sensitive keys case-insensitively so variants such as `Authorization` or `access_token` are not exposed if the helper supports normalization.
- **AL-T050**: Does not mutate the original payload object while producing a redacted display payload.
- **AL-T051**: Safely renders malformed or string payload values without injecting HTML.
- **AL-T052**: Shows a collapsed preview and explicit expand control for payloads over the agreed large-payload threshold.

### Loading, empty, and error states

- **AL-T053**: Shows skeleton rows during the initial request and does not show an empty state until loading completes.
- **AL-T054**: Shows a subtle loading indicator while filter changes refetch with previous data visible.
- **AL-T055**: Shows an empty state with Reset filters when the selected filters return no audit logs.
- **AL-T056**: Keeps the Refresh action available in the empty state.
- **AL-T057**: Shows a table-level alert when `GET /audit` fails.
- **AL-T058**: Retry refetches `GET /audit` with the current filters and URL state.
- **AL-T059**: Handles a failed refresh without clearing the existing rows.
- **AL-T060**: Redirects or renders `/403` for a `403` audit response according to the protected-route behavior.
- **AL-T061**: Shows a recoverable invalid-filter message when URL filters cannot be parsed safely.
- **AL-T062**: Does not expose raw backend stack traces or unsafe HTML in error messages.

### i18n, RTL, accessibility

- **AL-T063**: Renders English audit log labels, actions, empty states, errors, and redaction text from i18n keys.
- **AL-T064**: Renders Arabic audit log labels, actions, empty states, errors, and redaction text from i18n keys.
- **AL-T065**: Applies RTL direction and logical alignment under Arabic language settings.
- **AL-T066**: Provides visible labels for date range, actor, action, target type, and target ID filters.
- **AL-T067**: Details buttons include actor, action, and time in their accessible names.
- **AL-T068**: The payload sheet or dialog traps focus while open.
- **AL-T069**: Closing the payload details view returns focus to the triggering row or card button.
- **AL-T070**: Keyboard users can operate filters, reset, refresh, sorting, pagination, and details view controls.
- **AL-T071**: Pagination controls announce the current page and disabled previous/next states.
- **AL-T072**: JSON payload display uses readable contrast and does not rely on syntax color alone.
- **AL-T073**: Mobile card controls have accessible names that identify the audit event.
- **AL-T074**: The page remains usable on mobile, tablet, and desktop without horizontal page scrolling outside the table strategy.

## Implementation Notes

- Use Vitest with React Testing Library for route/page, component, hook, helper, URL-state, and API contract coverage.
- Keep executable tests under `dashboard/src/test/audit-log` to separate administrator audit history behavior from other admin pages.
- Start with `it.todo` cases while the route and audit log UI are not implemented, then convert each case to executable behavior tests as API actions, query hooks, filters, table rendering, and details UI are added.
- Mock the shared Axios instance or audit feature API layer for contract tests, and verify endpoint path `/audit`, serialized filters, page size, sort params, query keys, and refresh behavior.
- Add focused helper tests for action-label fallback, actor/target display fallbacks, clinic-timezone date defaults, URL parsing, payload summary generation, and recursive sensitive-key redaction once those helpers exist.
- Prefer behavior-level assertions for user flows and avoid testing TanStack Query internals except through observable loading, refresh, and stale-data behavior.
