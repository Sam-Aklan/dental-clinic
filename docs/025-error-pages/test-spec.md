# Test Specification: Error Pages

Source: `docs/025-error-pages/spec.md`

Vitest scaffold: `dashboard/src/test/error-pages/error-pages.specification.test.ts`

## Scope

These specifications cover the public recovery pages for forbidden and unmatched routes: `/403` rendering, wildcard 404 rendering, protected-route role mismatch redirects, safe role-based destinations, guest destinations, shared error-page shell behavior, bilingual English/Arabic content, RTL direction handling, mobile usability, keyboard access, and security constraints that prevent route or backend detail leakage.

## Test Groups

| Group | IDs | Coverage |
| --- | --- | --- |
| Routing and guards | EP-T001 - EP-T008 | `/403`, wildcard route, route ordering, role-mismatch redirect with replace, public render behavior |
| Shared shell behavior | EP-T009 - EP-T018 | Landmark, status badge, heading, description, language switcher, shadcn composition, primary/secondary actions, safe back fallback |
| Forbidden page behavior | EP-T019 - EP-T031 | 403 copy, authenticated role workspace CTA, guest login CTA, security/no-leak rules |
| Not found page behavior | EP-T032 - EP-T042 | 404 copy, authenticated workspace CTA, guest home CTA, protected-prefix neutrality |
| i18n, RTL, accessibility | EP-T043 - EP-T054 | English/Arabic strings, `dir`, icon direction, focus order, keyboard use, single `h1`, labels, contrast-oriented assertions |
| Responsive and resilience | EP-T055 - EP-T062 | Mobile layout, no horizontal scroll, dark theme compatibility, unknown auth state, no data fetching, no auto redirect |

## Vitest Specifications

### Routing and guards

- **EP-T001**: Renders the `/403` route with the root layout and `ForbiddenPage` without requiring a successful auth query.
- **EP-T002**: Renders the wildcard `*` route with the root layout and `NotFoundPage` for an unmatched URL.
- **EP-T003**: Keeps the wildcard route last so known public and protected routes continue to match before the 404 screen.
- **EP-T004**: Redirects an authenticated role mismatch from `ProtectedRoute` or route guard to `/403`.
- **EP-T005**: Uses replace navigation for role-mismatch redirects to avoid trapping the user in a browser back loop.
- **EP-T006**: Preserves signed-out protected-route behavior by redirecting unauthenticated users to login rather than `/403`.
- **EP-T007**: Allows a user to manually visit `/403` while signed out and receive a safe login CTA.
- **EP-T008**: Keeps error route files limited to route composition, layout composition, and page component rendering.

### Shared shell behavior

- **EP-T009**: `ErrorPageShell` renders a single `<main>` landmark with full-viewport minimum height and centered content.
- **EP-T010**: Renders the visible status badge for `403` or `404` and does not rely on the status badge as the only explanation.
- **EP-T011**: Renders exactly one primary heading as `<h1>`.
- **EP-T012**: Renders eyebrow, title, description, and optional support text passed through props.
- **EP-T013**: Keeps `LanguageSwitcher` visible and keyboard reachable on both error pages.
- **EP-T014**: Renders the primary action as a TanStack Router `Link` when `to` is provided.
- **EP-T015**: Renders the primary action as a button and calls `onClick` when `to` is absent.
- **EP-T016**: Renders the secondary action when provided and omits it cleanly when absent.
- **EP-T017**: The secondary back action calls `navigate(-1)` when SPA history is available.
- **EP-T018**: The secondary back action falls back to the computed safe home/workspace route when history length is unavailable or unsafe.

### Forbidden page behavior

- **EP-T019**: Renders English forbidden copy: `Access restricted`, the permission heading, role-limited description, back CTA, and administrator support hint.
- **EP-T020**: Renders Arabic forbidden copy from i18n keys under Arabic language settings.
- **EP-T021**: Uses `/admin/dashboard` as the primary CTA destination for authenticated `ADMIN` users.
- **EP-T022**: Uses `/staff/queue` as the primary CTA destination for authenticated `RECEPTIONIST` users.
- **EP-T023**: Uses `/doctor/queue` as the primary CTA destination for authenticated `DOCTOR` users.
- **EP-T024**: Uses `/book` as the primary CTA destination for authenticated `PATIENT` users.
- **EP-T025**: Uses `/login` as the primary CTA destination when the user is unauthenticated.
- **EP-T026**: Labels the guest forbidden primary CTA as `Log in` in English and `تسجيل الدخول` in Arabic.
- **EP-T027**: Treats unknown or loading auth state as guest-safe and does not crash while auth state is unresolved.
- **EP-T028**: Does not render the required role for the denied route unless a trusted guard explicitly supplies it.
- **EP-T029**: Does not render raw backend error objects, stack traces, route metadata, or protected route details.
- **EP-T030**: Does not refetch or request protected page data from the forbidden page.
- **EP-T031**: Does not auto-redirect after a delay; the user remains in control of recovery navigation.

### Not found page behavior

- **EP-T032**: Renders English 404 copy: `Page not found`, the not-found heading, outdated-link description, back CTA, and navigation support hint.
- **EP-T033**: Renders Arabic 404 copy from i18n keys under Arabic language settings.
- **EP-T034**: Uses the authenticated user's safe workspace route as the primary CTA destination.
- **EP-T035**: Uses `/` as the primary CTA destination for unauthenticated users.
- **EP-T036**: Labels the guest 404 primary CTA as `Go home` in English and `الانتقال للرئيسية` in Arabic.
- **EP-T037**: Labels the authenticated 404 primary CTA as `Go to my workspace` in English and `الانتقال إلى مساحة العمل` in Arabic.
- **EP-T038**: Does not show role-specific copy for missing `/admin/*`, `/doctor/*`, or `/staff/*` paths when the user is unauthenticated.
- **EP-T039**: Does not expose protected route names, required roles, or backend route metadata for unmatched protected-looking paths.
- **EP-T040**: Supports direct browser entry of an unknown path and renders the same safe 404 UI.
- **EP-T041**: Preserves the current language when rendering the 404 page after navigation.
- **EP-T042**: Does not attempt to infer the user's intended destination beyond the safe home/workspace CTA.

### i18n, RTL, accessibility

- **EP-T043**: Adds and uses all English i18n keys under `errors.forbidden` and `errors.notFound`.
- **EP-T044**: Adds and uses all Arabic i18n keys under `errors.forbidden` and `errors.notFound`.
- **EP-T045**: Updates `<html lang>` and `<html dir>` through the existing language infrastructure when switching languages.
- **EP-T046**: Inherits RTL direction from `<html dir>` rather than hardcoding direction per page.
- **EP-T047**: Flips direction-implying arrow icons in RTL while keeping non-directional icons unchanged.
- **EP-T048**: Provides descriptive accessible names for primary and secondary actions.
- **EP-T049**: Keeps primary and secondary actions focusable in visual order with keyboard navigation.
- **EP-T050**: Allows keyboard users to activate primary, secondary, and language-switcher controls.
- **EP-T051**: Does not render icon-only action buttons for recovery actions.
- **EP-T052**: Ensures visible text, badges, alerts, and action states do not rely on color alone.
- **EP-T053**: Keeps support text readable and associated with the page content without replacing the main heading.
- **EP-T054**: Updates page title or route metadata for 403 and 404 where the app supports document titles.

### Responsive and resilience

- **EP-T055**: Renders desktop layout as a centered max-width panel with calm clinic styling and generous spacing.
- **EP-T056**: Renders mobile layout as a full-viewport recovery screen with stacked actions.
- **EP-T057**: Does not create horizontal page scroll on mobile in LTR or RTL.
- **EP-T058**: Uses shadcn `Button`, `Card`, `Alert`, and `Separator` primitives or approved shared wrappers around them.
- **EP-T059**: Uses semantic theme tokens so light and dark themes both remain readable.
- **EP-T060**: Handles missing optional `secondaryAction` and `supportText` props without rendering empty containers.
- **EP-T061**: Safely handles unknown user roles by falling back to guest-safe navigation.
- **EP-T062**: Keeps both pages free of server-state requests, mutation controls, and sensitive persisted-data writes.

## Implementation Notes

- Use Vitest with React Testing Library for route/page rendering, shared shell behavior, action navigation, language switching, keyboard operation, and responsive class/DOM assertions.
- Keep executable tests under `dashboard/src/test/error-pages` to separate global recovery behavior from auth-guard and layout tests.
- Start with `it.todo` cases while the new error pages are not fully implemented, then convert each case to behavior tests as routes, `ErrorPageShell`, `ForbiddenPage`, `NotFoundPage`, i18n keys, and guard redirects are added.
- Mock `@tanstack/react-router` `Link`, `useNavigate`, and router location/history state where needed; do not introduce React Router APIs.
- Mock the existing auth hook/store to verify role-based CTA destinations for `ADMIN`, `RECEPTIONIST`, `DOCTOR`, `PATIENT`, guest, unknown, and loading states.
- Prefer behavior-level assertions for user-visible copy, safe destinations, navigation calls, focusability, and security non-leakage rather than implementation details of shadcn primitives.
