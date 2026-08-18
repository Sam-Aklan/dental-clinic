# Test Specification: Walk-In Booking Page

Source: `docs/017-walk-in-booking-page/spec.md`

Speckit spec: `specs/001-walk-in-booking-page/spec.md`

Vitest scaffold: `dashboard/src/test/walk-in-booking/walk-in-booking-page.test.tsx`

## Scope

These specifications cover the staff walk-in booking workflow: route access, patient lookup and preselection, doctor/date/time selection, booking summary, confirmation, duplicate-submit protection, conflict recovery, loading and error states, i18n, RTL behavior, and accessibility.

## Test Groups

| Group | IDs | Coverage |
| --- | --- | --- |
| Route and access | WBP-T001 - WBP-T006 | RECEPTIONIST/ADMIN access, forbidden state for other roles, staff shell, page heading |
| Patient lookup | WBP-T007 - WBP-T017 | Search threshold, debounce behavior, result rendering, selection, change action, empty and permission states |
| Preselected context | WBP-T018 - WBP-T024 | Patient, doctor, and date preselection; invalid values; non-blocking warnings |
| Doctor, date, and slots | WBP-T025 - WBP-T036 | Active doctor selection, valid date handling, slot loading, empty slots, exact slot selection |
| Summary and confirmation | WBP-T037 - WBP-T045 | Summary content, validation, staff note length, confirmation dialog, keyboard focus |
| Appointment creation | WBP-T046 - WBP-T055 | Payload, exact selected time preservation, idempotency lifecycle, pending state, success redirect/highlight |
| Error handling | WBP-T056 - WBP-T064 | Slot conflict, validation errors, missing staff booking support, network errors, retry behavior |
| i18n, RTL, accessibility | WBP-T065 - WBP-T076 | English/Arabic strings, RTL layout, alerts/status roles, keyboard operation, mobile layout |

## Vitest Specifications

### Route and access

- **WBP-T001**: Renders the walk-in booking page for a receptionist and shows the title, subtitle, stepper, patient area, booking controls, and summary.
- **WBP-T002**: Renders the same booking capabilities for an administrator.
- **WBP-T003**: Redirects or blocks patient users with the forbidden state.
- **WBP-T004**: Redirects or blocks doctor users with the forbidden state.
- **WBP-T005**: Redirects or blocks unauthenticated users according to the existing protected-route behavior.
- **WBP-T006**: Uses the staff/receptionist layout shell around the page content.

### Patient lookup

- **WBP-T007**: Does not request patient search results before the user enters the minimum search length.
- **WBP-T008**: Requests patient search results after the minimum search length is reached and the debounce delay has elapsed.
- **WBP-T009**: Sends the entered patient search text without dropping phone or email search values.
- **WBP-T010**: Shows skeleton or pending rows while patient search is loading.
- **WBP-T011**: Renders each patient result with name and available phone, email, or date-of-birth details.
- **WBP-T012**: Selects a patient result and shows the selected patient card.
- **WBP-T013**: Updates the booking summary after patient selection.
- **WBP-T014**: Allows changing the selected patient and clears the previous patient from the selected card and summary.
- **WBP-T015**: Shows an empty state when no existing patient matches the search.
- **WBP-T016**: Shows guidance that new-patient intake is unavailable from this page when no creation workflow is supported.
- **WBP-T017**: Shows a permission warning when patient lookup is forbidden and does not render protected patient data.

### Preselected context

- **WBP-T018**: Loads and selects a patient when a valid patient reference is present in the URL state.
- **WBP-T019**: Shows a selected patient skeleton or equivalent loading state while loading a preselected patient.
- **WBP-T020**: Clears the preselected patient and shows a non-blocking warning when the patient cannot be found.
- **WBP-T021**: Preselects a valid doctor when provided in the URL state.
- **WBP-T022**: Preselects a valid non-past date when provided in the URL state.
- **WBP-T023**: Ignores a past date from URL state and falls back to the default valid date.
- **WBP-T024**: Ignores malformed URL state values without blocking manual booking.

### Doctor, date, and slots

- **WBP-T025**: Shows a loading state while the doctor directory is loading.
- **WBP-T026**: Renders only active doctors as selectable booking doctors.
- **WBP-T027**: Selects a doctor and updates the booking summary.
- **WBP-T028**: Requires a non-past date for slot lookup.
- **WBP-T029**: Requests available slots when doctor and date are selected.
- **WBP-T030**: Shows a slot loading state while availability is loading.
- **WBP-T031**: Renders available slot buttons with readable localized time labels.
- **WBP-T032**: Gives slot buttons accessible names that include full date and time context.
- **WBP-T033**: Selects only a slot returned by the availability response.
- **WBP-T034**: Stores the selected slot's exact returned start time for later submission.
- **WBP-T035**: Shows empty availability guidance when no slots are returned.
- **WBP-T036**: Shows a retryable error state when slot loading fails.

### Summary and confirmation

- **WBP-T037**: Shows patient, doctor, selected date/time, clinic timezone, and staff note in the booking summary.
- **WBP-T038**: Keeps the create appointment action disabled until patient, doctor, and slot are selected.
- **WBP-T039**: Shows validation feedback for missing patient, doctor, and slot selections.
- **WBP-T040**: Accepts an optional staff note within the allowed length.
- **WBP-T041**: Rejects staff notes longer than 500 characters and prevents submission.
- **WBP-T042**: Opens a confirmation dialog from the create appointment action.
- **WBP-T043**: Confirmation dialog states that staff is booking on behalf of the selected patient.
- **WBP-T044**: Confirmation dialog displays patient, doctor, and appointment time before submission.
- **WBP-T045**: Keeps dialog focus trapped while open and returns focus to the triggering action after close.

### Appointment creation

- **WBP-T046**: Sends patient, doctor, selected slot start time, and optional staff note when confirming the booking.
- **WBP-T047**: Preserves the exact returned slot start value instead of recalculating it from local date/time values.
- **WBP-T048**: Generates one idempotency key when the confirmation dialog opens.
- **WBP-T049**: Reuses the same idempotency key while the same booking confirmation remains pending.
- **WBP-T050**: Creates a new idempotency key for a later distinct confirmation attempt after the previous attempt resolves or is dismissed.
- **WBP-T051**: Disables confirmation controls and shows pending feedback while booking creation is in progress.
- **WBP-T052**: Prevents duplicate user submits while creation is pending.
- **WBP-T053**: Refreshes staff appointment, queue, analytics, and slot-related cached data after successful creation where those caches exist.
- **WBP-T054**: Shows appointment-created success feedback after successful creation.
- **WBP-T055**: Navigates to the staff appointment list with the created appointment highlighted after success.

### Error handling

- **WBP-T056**: On booking conflict, shows the slot-taken message, preserves patient/doctor/date/note state, clears or invalidates the selected slot, and refreshes availability.
- **WBP-T057**: On server validation failure for unsupported staff patient booking, shows the server validation message and keeps form state.
- **WBP-T058**: On network error during creation, keeps the confirmation flow recoverable and shows inline error feedback.
- **WBP-T059**: On doctor directory failure, shows an error alert with retry.
- **WBP-T060**: On patient lookup failure unrelated to permissions, shows recoverable error feedback.
- **WBP-T061**: On preselected patient load failure, clears selection and keeps the rest of the page usable.
- **WBP-T062**: Does not lose selected patient, doctor, date, or note after recoverable booking errors.
- **WBP-T063**: Allows retry after a recoverable creation failure without requiring a full page reload.
- **WBP-T064**: Displays mutation errors using alert semantics.

### i18n, RTL, accessibility

- **WBP-T065**: Renders English labels, validation messages, errors, and success feedback for the walk-in workflow.
- **WBP-T066**: Renders Arabic labels, validation messages, errors, and success feedback for the walk-in workflow.
- **WBP-T067**: Applies RTL direction and logical alignment under Arabic language settings.
- **WBP-T068**: Keeps the mobile layout usable without horizontal scrolling.
- **WBP-T069**: Keeps the stepper descriptive and does not trap focus or prevent keyboard access to later disabled controls.
- **WBP-T070**: Allows patient search results to be navigated and selected by keyboard.
- **WBP-T071**: Provides selected patient identity in readable text, not visual styling alone.
- **WBP-T072**: Announces loading or busy states where user action is blocked.
- **WBP-T073**: Announces success feedback using status semantics.
- **WBP-T074**: Does not rely on color alone for validation, conflict, or disabled states.
- **WBP-T075**: Provides accessible names for primary actions that distinguish create, confirm, cancel, retry, and change-patient actions.
- **WBP-T076**: Preserves logical focus order through patient lookup, doctor/date controls, slot selection, summary, and confirmation.

## Implementation Notes

- Use Vitest with React Testing Library for page, component, hook, and interaction coverage.
- Keep executable tests under `dashboard/src/test/walk-in-booking` to keep the staff walk-in flow separate from patient booking tests.
- Start with `it.todo` cases if the route or page is not implemented yet, then convert each case to executable behavior tests as the page, API actions, hooks, and route guard are implemented.
- Use fake timers for debounced patient search and stable idempotency-key lifecycle tests.
- Mock the shared HTTP client or service layer for contract-level tests and avoid asserting on internal data-fetching library behavior except for observable refresh outcomes.
- Prefer behavior-level assertions for user flows; API/action tests should still verify endpoint paths, request payloads, exact selected slot time preservation, and idempotency headers because these are contract requirements.
