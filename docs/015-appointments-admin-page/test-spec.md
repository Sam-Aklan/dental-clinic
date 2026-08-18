# Test Specification: Appointments Admin Page

Source: `docs/015-appointments-admin-page/spec.md`

Vitest scaffold: `dashboard/src/test/appointments-admin/appointments-admin-page.test.tsx`

## Scope

These specifications cover the receptionist and administrator appointment management page for `/staff/appointments`: route access, tabs, filters, URL state, appointment table/card rendering, staff cancellation, rescheduling, no-show marking, waitlist removal, CSV export, loading and error states, Arabic/RTL behavior, and accessibility.

## Test Groups

| Group | IDs | Coverage |
| --- | --- | --- |
| Route and access | AAP-T001 - AAP-T006 | RECEPTIONIST/ADMIN access, forbidden redirect for other roles, staff layout, page heading, action buttons |
| Tabs and default queries | AAP-T007 - AAP-T013 | Today, Upcoming, Waitlist tabs, default date ranges, appointment vs waitlist data source behavior |
| Filters and URL state | AAP-T014 - AAP-T024 | Date range, doctor, status, patient search, reset, pagination, sorting, refresh persistence |
| Appointment rendering | AAP-T025 - AAP-T033 | Desktop table, mobile cards, status badge, doctor and patient labels, phone link, booked-by and created columns |
| Staff cancellation | AAP-T034 - AAP-T041 | Required reason, 24-hour override, DELETE payload behavior, pending state, success refresh, 403 and 404 handling |
| Rescheduling | AAP-T042 - AAP-T052 | Default doctor, slot fetching, slot picker, PATCH payload, row highlight, 409 conflict recovery, not-found recovery |
| Mark no-show | AAP-T053 - AAP-T058 | Confirmation dialog, status update payload, pending state, success toast, invalidation |
| Waitlist management | AAP-T059 - AAP-T066 | Active waitlist rows, hidden status filters, available window formatting, relative age, remove entry action |
| CSV export | AAP-T067 - AAP-T072 | Current filters passed to export, disabled pending state, blob download, empty-filter export, error feedback |
| i18n, RTL, accessibility | AAP-T073 - AAP-T084 | English and Arabic copy, RTL direction, semantic table/cards, dialog focus, keyboard access, aria-busy export |

## Vitest Specifications

### Route and access

- **AAP-T001**: Renders `/staff/appointments` for a receptionist and shows the staff appointments title, subtitle, Today tab, Walk-in Booking action, and Export action.
- **AAP-T002**: Renders `/staff/appointments` for an administrator with the same management capabilities as a receptionist.
- **AAP-T003**: Redirects or blocks PATIENT users with the forbidden state.
- **AAP-T004**: Redirects or blocks DOCTOR users with the forbidden state.
- **AAP-T005**: Uses the receptionist staff shell/navigation context for the page.
- **AAP-T006**: Keeps route file behavior limited to composing the page and route guard behavior.

### Tabs and default queries

- **AAP-T007**: Loads the Today tab by default when no `tab` query param is present.
- **AAP-T008**: Requests today's appointment data with the same clinic date shown in the UI.
- **AAP-T009**: Switching to Upcoming defaults from today through seven days ahead.
- **AAP-T010**: Switching to Waitlist loads active waitlist entries instead of appointment rows.
- **AAP-T011**: Preserves selected tab in query params.
- **AAP-T012**: Ignores appointment status filters on the Waitlist tab.
- **AAP-T013**: Shows tab-specific empty states for appointments and waitlist entries.

### Filters and URL state

- **AAP-T014**: Applies a date range filter on Upcoming and updates the query params.
- **AAP-T015**: Applies one or more doctor filters and serializes them consistently.
- **AAP-T016**: Applies multiple appointment statuses and serializes them consistently.
- **AAP-T017**: Applies patient name search and preserves the text after refresh.
- **AAP-T018**: Resets filters to defaults for the active tab.
- **AAP-T019**: Advances pagination and stores the page in query params.
- **AAP-T020**: Sorts by start time ascending and descending.
- **AAP-T021**: Sorts by doctor, status, and created time where supported.
- **AAP-T022**: Keeps previous appointment data visible while filtered data is refetching.
- **AAP-T023**: Restores all filter, sort, pagination, and tab state from URL query params on initial render.
- **AAP-T024**: Omits unsupported or empty filter values from outgoing requests.

### Appointment rendering

- **AAP-T025**: Renders desktop columns for time, doctor, patient, phone, status, booked by, created, and actions.
- **AAP-T026**: Formats appointment time in the clinic timezone with localized display.
- **AAP-T027**: Renders doctor as `Dr. First Last`.
- **AAP-T028**: Renders patient full name and contact information when available.
- **AAP-T029**: Renders phone numbers as click-to-call links when a phone exists.
- **AAP-T030**: Renders shared status badge text for every appointment status.
- **AAP-T031**: Renders booked-by role values for PATIENT, RECEPTIONIST, and ADMIN.
- **AAP-T032**: Renders mobile appointment cards with labels for every critical field.
- **AAP-T033**: Shows skeleton rows during initial appointment loading.

### Staff cancellation

- **AAP-T034**: Opens a confirmation dialog from the Cancel action with the selected patient and appointment context.
- **AAP-T035**: Requires a cancellation reason before enabling confirmation.
- **AAP-T036**: Sends staff cancellation for appointments starting within 24 hours without a frontend patient-rule block.
- **AAP-T037**: Passes the required cancellation reason with the cancellation request.
- **AAP-T038**: Disables cancel confirmation while the request is pending.
- **AAP-T039**: On success, closes the dialog, shows success feedback, and refreshes appointment-related data.
- **AAP-T040**: On permission failure, keeps the user on the page and shows a no-permission message.
- **AAP-T041**: On not-found failure, closes the dialog, shows a not-found message, and refetches the list.

### Rescheduling

- **AAP-T042**: Opens a reschedule dialog from the selected appointment row.
- **AAP-T043**: Defaults the doctor select to the appointment's current doctor.
- **AAP-T044**: Fetches available slots when doctor or date changes.
- **AAP-T045**: Shows empty slot guidance when no slots are available for the selected doctor/date.
- **AAP-T046**: Requires a selected slot before enabling submit.
- **AAP-T047**: Sends selected doctor and slot start time when submitting.
- **AAP-T048**: Includes optional reason when provided.
- **AAP-T049**: On success, closes the dialog, shows success feedback, and highlights or refreshes the updated row.
- **AAP-T050**: On slot conflict, shows the slot-taken message and refetches available slots.
- **AAP-T051**: On not-found failure, closes the dialog and refetches appointment data.
- **AAP-T052**: Disables reschedule controls that would submit duplicate pending requests.

### Mark no-show

- **AAP-T053**: Opens a confirmation before marking an appointment as no-show.
- **AAP-T054**: Sends a status update with `NO_SHOW` for the selected appointment.
- **AAP-T055**: Disables confirmation while the status update is pending.
- **AAP-T056**: Shows success feedback after marking no-show.
- **AAP-T057**: Refreshes appointment-related data after success.
- **AAP-T058**: Keeps destructive no-show confirmation accessible by keyboard.

### Waitlist management

- **AAP-T059**: Renders active waitlist rows with position, patient, doctor, available window, since, and actions.
- **AAP-T060**: Formats available windows as `HH:mm - HH:mm` when both bounds exist.
- **AAP-T061**: Displays `Any available time` when no availability bounds exist.
- **AAP-T062**: Displays relative created time in the current language.
- **AAP-T063**: Hides appointment status filter controls on Waitlist.
- **AAP-T064**: Opens remove-entry confirmation for a waitlist row.
- **AAP-T065**: Deletes the selected waitlist entry and refreshes waitlist data on success.
- **AAP-T066**: Handles waitlist removal failure without removing the row from the displayed list.

### CSV export

- **AAP-T067**: Sends current appointment filters to the CSV export request.
- **AAP-T068**: Includes `format=csv` in the export request contract.
- **AAP-T069**: Disables the export button while export is pending.
- **AAP-T070**: Announces export pending state with `aria-busy`.
- **AAP-T071**: Initiates a file download from the returned blob.
- **AAP-T072**: Shows export failure feedback without clearing the current filters.

### i18n, RTL, accessibility

- **AAP-T073**: Renders English staff appointment labels and messages.
- **AAP-T074**: Renders Arabic staff appointment labels and messages.
- **AAP-T075**: Applies RTL direction for Arabic rendering.
- **AAP-T076**: Provides semantic table markup on desktop.
- **AAP-T077**: Provides labeled card fields on mobile.
- **AAP-T078**: Gives row action buttons accessible names that include patient or appointment context.
- **AAP-T079**: Traps focus inside cancel and reschedule dialogs.
- **AAP-T080**: Returns focus to the triggering action after dialog close.
- **AAP-T081**: Allows keyboard users to switch tabs, operate filters, open action menus, and confirm dialogs.
- **AAP-T082**: Does not rely on color alone for destructive actions or status state.
- **AAP-T083**: Announces loading and empty states to assistive technology where appropriate.
- **AAP-T084**: Maintains readable labels and logical alignment under both LTR and RTL layouts.

## Implementation Notes

- Use Vitest with React Testing Library for page, hook, and interaction coverage.
- Keep executable tests under `dashboard/src/test/appointments-admin` to avoid mixing this staff feature with patient appointment tests under `dashboard/src/test/appointments`.
- Start with `it.todo` cases while the route is still a placeholder, then convert each case to executable tests as API actions, query hooks, components, and dialogs are implemented.
- Mock the shared Axios instance for API contract tests and avoid testing TanStack Query internals directly.
- Prefer behavior-level assertions for user flows; API action tests should still verify endpoint paths, serialized filters, request payloads, and blob export handling.
