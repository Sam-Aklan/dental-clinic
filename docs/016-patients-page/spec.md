# Spec: Patients Page

**Route**: `/staff/patients`  
**Component**: `PatientsPage`  
**Auth**: RECEPTIONIST and ADMIN  
**File**: `frontend/src/features/staff/pages/PatientsPage.tsx`

---

## 1. Purpose

Allows receptionist staff to find patients quickly, verify contact/profile details, review appointment history, and start a booking flow on behalf of a selected patient. This page supports front-desk calls and in-person intake.

---

## 2. Backend Contract Note

`FRONTEND_PLAN.md` requires patient search, but `BACKEND_PLAN.md` currently lists user listing as admin-only. Implementation needs one of these backend contracts before this page can be completed:

| Preferred contract | Alternative |
|---|---|
| Allow `RECEPTIONIST` on `GET /users?role=PATIENT` and `GET /users/:id` for patient records | Add dedicated `GET /patients` and `GET /patients/:id` endpoints |

The frontend spec below assumes the preferred contract unless backend implementation chooses the dedicated patients endpoint.

---

## 3. Layout

Uses `ReceptionistLayout`. The page is split into a searchable patient list and a detail panel.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [ReceptionistLayout sidebar/header]                                  │
│                                                                      │
│ Patients                                              [New Walk-in]  │
│ Search patients and review appointment history.                      │
│                                                                      │
│ [Search name, phone, email________________] [Status] [Reset]         │
│                                                                      │
│ ┌──────────────────────────────┐ ┌────────────────────────────────┐ │
│ │ Patient Results              │ │ Patient Details                │ │
│ │ Sara Ali                     │ │ Sara Ali                       │ │
│ │ +964... sara@example.com     │ │ Phone, email, DOB              │ │
│ │                              │ │ [Book for Patient]             │ │
│ │ Ahmed Hassan                 │ │                                │ │
│ │ +964...                      │ │ Appointment History            │ │
│ └──────────────────────────────┘ └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

- Desktop: master/detail two-column layout.
- Mobile: result list first; selecting a patient navigates/focuses to detail card below.
- Use shadcn `Card`, `Input`, `Button`, `Badge`, `Tabs`, `Skeleton`, and shared `DataTable` for history.

---

## 4. Search and Selection Flow

1. User enters at least 2 characters in search input.
2. Debounce by 300ms and call patient search endpoint.
3. Results list shows name, phone, email, DOB when available.
4. Selecting a patient sets `patientId` in query params and loads patient details/history.
5. `Book for Patient` links to `/staff/walkin?patientId=<id>`.
6. Appointment history tab supports status/date filters.

Do not query all patients on initial page load unless backend pagination and authorization are in place. Show an instructional empty state instead.

---

## 5. Query Params

| Param | Purpose |
|---|---|
| `q` | Search string |
| `patientId` | Selected patient |
| `status` | Appointment history status filter |
| `from` | History start date |
| `to` | History end date |
| `page` | Results page or history page depending active panel |

---

## 6. Data Models

```typescript
interface StaffPatientSearchDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  isActive: boolean;
  lastAppointmentAt: string | null;
  nextAppointmentAt: string | null;
}

interface StaffPatientDetailDTO extends StaffPatientSearchDTO {
  languagePreference: 'en' | 'ar' | null;
  createdAt: string;
  notes?: string | null;
}

interface PatientHistoryAppointmentDTO {
  id: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
}
```

---

## 7. Components

### `PatientSearchPanel`

| Element | Behavior |
|---|---|
| Search input | Debounced search by name, phone, or email |
| Status filter | Active/inactive if backend exposes `isActive` filter |
| Result card | Selects patient and updates query params |
| Empty state | `Search by name, phone, or email to find a patient.` |

### `PatientDetailsPanel`

| Element | Behavior |
|---|---|
| Identity block | Name, phone, email, DOB, language |
| Appointment summary | Last appointment and next appointment badges |
| `Book for Patient` | Navigates to walk-in booking with patient prefilled |
| `Edit profile` | Optional future action; only render if API supports receptionist updates |

### `PatientAppointmentHistoryTable`

Shows prior and upcoming appointments for selected patient.

| Column | Notes |
|---|---|
| Date/time | Clinic timezone |
| Doctor | Doctor name and specialization |
| Status | Shared `StatusBadge` |
| Duration | Minutes between start/end |
| Actions | `View in appointments` link to `/staff/appointments?patientName=<name>` |

---

## 8. Hooks and API Layer

```typescript
// features/staff/api/patients-api.ts
export async function searchPatients(params: {
  q: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<StaffPatientSearchDTO>>;

export async function getStaffPatient(patientId: string): Promise<StaffPatientDetailDTO>;

export async function getPatientAppointmentHistory(params: {
  patientId: string;
  from?: string;
  to?: string;
  status?: AppointmentStatus[];
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<PatientHistoryAppointmentDTO>>;
```

```typescript
export function usePatientSearch(filters: PatientSearchFilters) {
  return useQuery({
    queryKey: ['staff', 'patients', filters],
    queryFn: () => searchPatients(filters),
    enabled: filters.q.trim().length >= 2,
    placeholderData: keepPreviousData,
  });
}
```

If backend uses `GET /users`, the API layer maps `role=PATIENT` and unwraps the returned user/profile shape into the DTOs above.

---

## 9. Loading and Error States

| State | UI |
|---|---|
| Empty initial state | Instructional card, no request made |
| Search loading | Result skeletons |
| No results | `No patients found.` with `Create walk-in patient` CTA if supported |
| Patient detail loading | Detail skeleton |
| Detail `404` | Clear `patientId`, toast, refetch search |
| Search forbidden `403` | Error alert explaining backend permission requirement |
| History loading | Table skeleton rows |

---

## 10. Routing

```tsx
{
  path: '/staff/patients',
  element: (
    <ProtectedRoute roles={['RECEPTIONIST', 'ADMIN']}>
      <ReceptionistLayout>
        <PatientsPage />
      </ReceptionistLayout>
    </ProtectedRoute>
  ),
}
```

Optional future detail route:

```tsx
{
  path: '/staff/patients/:patientId',
  element: <PatientsPage />,
}
```

Do not add the detail route unless the UX needs shareable patient profile URLs.

---

## 11. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "staffPatients": {
    "title": "Patients",
    "subtitle": "Search patients and review appointment history.",
    "newWalkIn": "New Walk-in",
    "searchPlaceholder": "Search name, phone, or email",
    "status": "Status",
    "reset": "Reset",
    "results": "Patient Results",
    "details": "Patient Details",
    "appointmentHistory": "Appointment History",
    "bookForPatient": "Book for Patient",
    "lastAppointment": "Last appointment",
    "nextAppointment": "Next appointment",
    "noAppointment": "No appointment",
    "initialEmpty": "Search by name, phone, or email to find a patient.",
    "noResults": "No patients found.",
    "permissionRequired": "Receptionist patient search needs backend permission before this page can load data."
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "staffPatients": {
    "title": "المرضى",
    "subtitle": "ابحث عن المرضى وراجع سجل المواعيد.",
    "newWalkIn": "زيارة مباشرة جديدة",
    "searchPlaceholder": "ابحث بالاسم أو الهاتف أو البريد الإلكتروني",
    "status": "الحالة",
    "reset": "إعادة ضبط",
    "results": "نتائج المرضى",
    "details": "تفاصيل المريض",
    "appointmentHistory": "سجل المواعيد",
    "bookForPatient": "حجز لهذا المريض",
    "lastAppointment": "آخر موعد",
    "nextAppointment": "الموعد القادم",
    "noAppointment": "لا يوجد موعد",
    "initialEmpty": "ابحث بالاسم أو الهاتف أو البريد الإلكتروني للعثور على مريض.",
    "noResults": "لم يتم العثور على مرضى.",
    "permissionRequired": "يحتاج بحث المرضى لموظف الاستقبال إلى صلاحية من الخلفية قبل تحميل البيانات."
  }
}
```

---

## 12. API Endpoints Used

Preferred contract:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/users?role=PATIENT` | Search/list patient users; receptionist access required |
| GET | `/users/:id` | Load selected patient details; receptionist access required |
| GET | `/appointments` | Selected patient's appointment history using `patientId` or patient filter |

Alternative contract:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/patients` | Search/list patients |
| GET | `/patients/:id` | Load selected patient details |
| GET | `/patients/:id/appointments` | Load appointment history |

---

## 13. Accessibility

- Search input has visible label and result count announced with `aria-live="polite"`.
- Result cards are buttons with selected state exposed via `aria-pressed` or `aria-selected`.
- Patient detail panel heading includes patient name.
- Appointment history filters have labels and keyboard-accessible reset.
- Patient contact links use clear accessible labels.

---

## 14. Acceptance Criteria

- [ ] Receptionist/admin can load `/staff/patients`; other roles redirect to `/403`.
- [ ] Initial page does not fetch all patients; it prompts staff to search.
- [ ] Searching 2+ characters queries the patient search endpoint with debounce.
- [ ] Selecting a patient loads details and persists `patientId` in URL query params.
- [ ] Appointment history loads for the selected patient and supports filters/pagination.
- [ ] `Book for Patient` opens `/staff/walkin?patientId=<id>`.
- [ ] Backend `403` patient-search permission gap is shown clearly if not implemented yet.
- [ ] Mobile layout allows search results and details to be used without horizontal scrolling.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds once backend contract exists.
