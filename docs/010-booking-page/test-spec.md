# Test Specification: Booking Page

Source: `docs/010-booking-page/spec.md`

Vitest scaffold: `dashboard/src/test/booking/booking-page.test.ts`

## Scope

These specifications cover the patient booking flow for `/book`: route access, doctor selection, date and slot selection, confirmation, appointment creation, error handling, loading states, i18n, RTL behavior, and accessibility.

## Test Groups

| Group | IDs | Coverage |
| --- | --- | --- |
| Route and access | BP-T001 - BP-T007 | PATIENT-only access, patient layout, booking stepper, query param preselection |
| Doctor selection | BP-T008 - BP-T015 | Doctor directory query, loading, filtering, selection state, empty and error states |
| Date and slots | BP-T016 - BP-T027 | Clinic date defaults, disabled past dates/slots, slots query, grouping, waitlist link, slot errors |
| Summary and confirmation | BP-T028 - BP-T033 | Summary completeness, disabled confirm state, modal content, focus handling, pending state |
| Appointment creation | BP-T034 - BP-T040 | POST payload, backend slot ISO preservation, idempotency header lifecycle, invalidation, redirect |
| Error handling | BP-T041 - BP-T045 | 409 conflict, 400 validation, 401 interceptor behavior, network errors and preserved selections |
| i18n, RTL, accessibility | BP-T046 - BP-T051 | English and Arabic strings, RTL layout, alert/status roles, keyboard access |

## Implementation Notes

- The current route is still a placeholder, so the Vitest file uses `it.todo` specifications to avoid failing the existing suite before implementation exists.
- Convert each `it.todo` to an executable test as the booking page, API actions, hooks, and route guard are implemented.
- Keep executable tests under `dashboard/src/test/booking` and follow the same provider/mocking style used by existing profile and auth tests.
- Prefer behavior tests over internal implementation tests. API action tests should still verify endpoint paths, payloads, query keys, and the `Idempotency-Key` header because these are contract-level requirements.
