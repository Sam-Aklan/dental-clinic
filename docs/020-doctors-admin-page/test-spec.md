# Test Specification: Doctors Admin Page

Source: `docs/020-doctors-admin-page/spec.md`

Vitest scaffold: `dashboard/src/test/doctors-admin/doctors-admin-page.test.tsx`

## Scope

These specifications cover the administrator doctor management page for `/admin/settings/doctors`: route access, directory loading, filters and URL state, selected doctor persistence, create/edit profile flows, schedule override management, cache invalidation, loading and error states, Arabic/RTL behavior, mobile usability, and accessibility.

## Test Groups

| Group | IDs | Coverage |
| --- | --- | --- |
| Route and access | DAP-T001 - DAP-T006 | ADMIN-only route, forbidden behavior, AdminLayout shell, page heading, add action |
| Directory loading and filters | DAP-T007 - DAP-T018 | Doctor list request, search, specialization/status filters, pagination, reset, empty states |
| URL state and selection | DAP-T019 - DAP-T028 | `doctorId`, `tab`, refresh restore, invalid selection handling, mobile detail navigation |
| Directory rendering | DAP-T029 - DAP-T037 | Doctor identity, specialization, default availability, status, actions, desktop split view, mobile cards |
| Create doctor profile | DAP-T038 - DAP-T048 | Dialog behavior, validation, payload, pending state, success, conflicts, unsupported fields |
| Edit doctor profile | DAP-T049 - DAP-T058 | Detail profile form, PATCH payload, read-only email, active status, pending and error states |
| Schedule overrides | DAP-T059 - DAP-T073 | Override tab, loading, calendar/date validation, unavailable all day, time validation, create/delete, conflicts |
| Cache invalidation and recovery | DAP-T074 - DAP-T081 | Doctors, overrides, slots, appointments, waitlist offers, analytics refresh, recoverable failures |
| i18n, RTL, accessibility | DAP-T082 - DAP-T094 | English/Arabic strings, RTL layout, labels, keyboard selection, focus management, responsive layout |

## Vitest Specifications

### Route and access

- **DAP-T001**: Renders `/admin/settings/doctors` for an administrator and shows the Doctors title, subtitle, filters, directory area, details area, and Add Doctor action.
- **DAP-T002**: Redirects or blocks PATIENT users with the forbidden state.
- **DAP-T003**: Redirects or blocks DOCTOR users with the forbidden state.
- **DAP-T004**: Redirects or blocks RECEPTIONIST users with the forbidden state.
- **DAP-T005**: Redirects unauthenticated users according to the existing protected-route behavior.
- **DAP-T006**: Uses the admin layout shell around the page content and keeps route files limited to route composition and guards.

### Directory loading and filters

- **DAP-T007**: Requests the doctor directory from `GET /doctors` on initial render.
- **DAP-T008**: Shows list or table skeleton content while the initial doctor directory request is loading.
- **DAP-T009**: Renders an empty state with an Add Doctor CTA when no doctors exist.
- **DAP-T010**: Shows a filtered empty state with a Reset action when filters produce no results.
- **DAP-T011**: Searches doctors by entered name text and sends `q` to the directory request.
- **DAP-T012**: Searches doctors by specialization text when the backend supports combined search.
- **DAP-T013**: Applies the specialization filter and serializes it to the URL.
- **DAP-T014**: Applies active and inactive status filters only when status is supported by the backend response.
- **DAP-T015**: Omits unsupported, empty, or all-status filter values from outgoing requests.
- **DAP-T016**: Resets search, specialization, status, and page query params to defaults.
- **DAP-T017**: Advances directory pagination and stores `page` in query params.
- **DAP-T018**: Keeps previous directory data visible while filtered or paginated data is refetching.

### URL state and selection

- **DAP-T019**: Selecting a doctor writes `doctorId` to the URL search params.
- **DAP-T020**: Loads the selected doctor detail from `GET /doctors/:id` when `doctorId` is present on refresh.
- **DAP-T021**: Selects the first available doctor or shows the detail empty state when no `doctorId` is present.
- **DAP-T022**: Clears or replaces an invalid `doctorId` when the selected doctor cannot be found and keeps the directory usable.
- **DAP-T023**: Defaults the details panel to the Profile tab when no `tab` query param is present.
- **DAP-T024**: Switching to the Overrides tab writes `tab=overrides` to the URL.
- **DAP-T025**: Switching back to Profile writes `tab=profile` or removes the tab param according to the route convention.
- **DAP-T026**: Restores search, filters, page, selected doctor, and tab from URL query params on initial render.
- **DAP-T027**: On mobile, selecting a doctor navigates within the page to a full-width details panel.
- **DAP-T028**: On mobile, the detail back action returns to the doctor list without losing filters.

### Directory rendering

- **DAP-T029**: Renders doctor identity as initials/avatar plus `Dr. First Last`.
- **DAP-T030**: Renders specialization text or `Not set` when specialization is null.
- **DAP-T031**: Renders default availability from backend summary when available.
- **DAP-T032**: Falls back to clinic working-hours-derived availability when no backend summary exists.
- **DAP-T033**: Renders active or inactive status badges only when status exists in the response.
- **DAP-T034**: Hides unsupported admin-only controls when the backend response lacks the required admin fields.
- **DAP-T035**: Provides row actions for editing profile and managing overrides.
- **DAP-T036**: Renders the desktop list/detail split view without horizontal overflow.
- **DAP-T037**: Renders mobile doctor cards with labels for identity, specialization, status, and actions.

### Create doctor profile

- **DAP-T038**: Opens the create doctor dialog from the Add Doctor action.
- **DAP-T039**: Requires first name, last name, and valid email before submit.
- **DAP-T040**: Enforces first name and last name maximum length of 80 characters.
- **DAP-T041**: Validates optional phone using the shared phone validation helper.
- **DAP-T042**: Enforces specialization maximum length of 120 characters.
- **DAP-T043**: Enforces bio maximum length of 1000 characters.
- **DAP-T044**: Sends `POST /doctors` with first name, last name, email, phone, specialization, and bio values.
- **DAP-T045**: Normalizes optional empty phone, specialization, and bio values to the agreed null or omitted payload shape.
- **DAP-T046**: Disables submit and shows pending feedback while create is in progress.
- **DAP-T047**: On success, closes the dialog, shows doctor-saved feedback, refreshes the directory, and selects or highlights the created doctor.
- **DAP-T048**: On email conflict or backend validation failure, shows inline or alert feedback without losing form state.

### Edit doctor profile

- **DAP-T049**: Renders the selected doctor's profile fields in the detail panel.
- **DAP-T050**: Keeps email read-only after creation when the backend contract requires immutable email.
- **DAP-T051**: Allows editing first name, last name, phone, specialization, and bio.
- **DAP-T052**: Shows the Active switch only when `isActive` exists in the backend response.
- **DAP-T053**: Applies the same field validation rules used by create for editable fields.
- **DAP-T054**: Sends `PATCH /doctors/:id` with only changed editable profile fields when submitting.
- **DAP-T055**: Includes `isActive` in the patch payload only when the backend exposes status.
- **DAP-T056**: Disables the profile submit action and shows pending feedback while update is in progress.
- **DAP-T057**: On success, shows doctor-saved feedback and refreshes directory and selected doctor detail data.
- **DAP-T058**: On validation failure, shows backend field or form errors without clearing unsaved edits.

### Schedule overrides

- **DAP-T059**: Loads schedule overrides from `GET /doctors/:id/schedule-overrides` only when a doctor is selected.
- **DAP-T060**: Shows override skeleton content while selected doctor overrides are loading.
- **DAP-T061**: Shows an empty override state with Add Override guidance when no overrides exist.
- **DAP-T062**: Opens the override form from the Add Override action on the Overrides tab.
- **DAP-T063**: Requires a clinic date before an override can be submitted.
- **DAP-T064**: Disables creation for past dates unless the backend contract explicitly allows them.
- **DAP-T065**: When Unavailable all day is selected, sends null `startTime` and `endTime` with `isUnavailable: true`.
- **DAP-T066**: When the doctor remains available for custom hours, requires `startTime` and `endTime` in `HH:mm` format.
- **DAP-T067**: Rejects an end time that is not after the start time.
- **DAP-T068**: Enforces reason maximum length of 250 characters.
- **DAP-T069**: Sends `POST /doctors/:id/schedule-overrides` with date, start time, end time, unavailable flag, and reason.
- **DAP-T070**: On success, shows override-saved feedback, clears the override form, and refreshes the override list.
- **DAP-T071**: On backend overlap or conflict, shows the conflict message inline and refetches overrides.
- **DAP-T072**: Opens a confirmation dialog before deleting an override.
- **DAP-T073**: Sends `DELETE /doctors/:id/schedule-overrides/:overrideId`, disables only the affected row while pending, and removes or refreshes it on success.

### Cache invalidation and recovery

- **DAP-T074**: Create doctor success invalidates the doctor directory query.
- **DAP-T075**: Update doctor success invalidates the doctor directory query and selected doctor detail query.
- **DAP-T076**: Override create success invalidates the selected doctor's override query.
- **DAP-T077**: Override delete success invalidates the selected doctor's override query.
- **DAP-T078**: Override mutations invalidate selected doctor's slots so booking availability reflects the exception.
- **DAP-T079**: Override mutations invalidate appointment, waitlist offer, and admin analytics queries where those caches exist.
- **DAP-T080**: Directory load failure shows a retryable alert without rendering stale admin-only controls as active.
- **DAP-T081**: Selected doctor or override load failure shows a recoverable detail-panel alert while keeping the directory usable.

### i18n, RTL, accessibility

- **DAP-T082**: Renders English doctors admin labels, validation messages, errors, and success feedback.
- **DAP-T083**: Renders Arabic doctors admin labels, validation messages, errors, and success feedback.
- **DAP-T084**: Applies RTL direction and logical alignment under Arabic language settings.
- **DAP-T085**: Keeps the mobile layout usable without horizontal scrolling.
- **DAP-T086**: Provides accessible names for doctor row/card selection actions that include doctor identity.
- **DAP-T087**: Exposes selected doctor state to assistive technology.
- **DAP-T088**: Allows keyboard users to select doctors, switch tabs, operate filters, submit forms, and confirm deletions.
- **DAP-T089**: Provides labels and translated validation errors for every doctor profile field.
- **DAP-T090**: Provides labels for schedule override date, time, unavailable, and reason inputs.
- **DAP-T091**: Traps focus inside create/edit and confirmation dialogs while open.
- **DAP-T092**: Returns focus to the triggering control after create dialog close or delete confirmation close.
- **DAP-T093**: After deleting an override, returns focus to the override list or the nearest stable control.
- **DAP-T094**: Does not rely on color alone for status, conflict, validation, or destructive action states.

## Implementation Notes

- Use Vitest with React Testing Library for route/page, component, hook, schema, and interaction coverage.
- Keep executable tests under `dashboard/src/test/doctors-admin` to separate administrator doctor management from public booking doctor selection.
- Start with `it.todo` cases while the route and doctor admin UI are not implemented, then convert each case to executable behavior tests as API actions, query hooks, forms, tabs, and dialogs are added.
- Mock the shared Axios instance or feature API layer for contract tests, and verify endpoint paths, serialized filters, request payloads, and mutation invalidation behavior.
- Add schema-level tests for doctor profile and schedule override validation once the Zod schemas exist.
- Prefer behavior-level assertions for user flows and avoid testing TanStack Query internals except through observable refresh or invalidation outcomes.
