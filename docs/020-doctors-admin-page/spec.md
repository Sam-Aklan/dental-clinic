# Spec: Doctors Admin Page

**Route**: `/admin/settings/doctors`  
**Component**: `DoctorsAdminPage`  
**Auth**: ADMIN  
**File**: `frontend/src/features/admin/pages/DoctorsAdminPage.tsx`

---

## 1. Purpose

Allows administrators to manage doctor directory profiles and doctor-specific schedule overrides. Doctor profiles affect patient booking selection, staff queue grouping, utilization analytics, and available slot generation.

---

## 2. Layout

Uses `AdminLayout`. The page combines a searchable doctor directory with an editable detail panel.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [AdminLayout sidebar/header]                                         │
│                                                                      │
│ Doctors                                           [Add Doctor]        │
│ Manage doctor profiles and schedule overrides.                       │
│                                                                      │
│ [Search doctors] [Specialization] [Status] [Reset]                   │
│                                                                      │
│ ┌─────────────────────────────┐ ┌────────────────────────────────┐  │
│ │ Doctor List                 │ │ Doctor Details                 │  │
│ │ Dr. Sara  Orthodontics      │ │ [Profile tab] [Overrides tab]  │  │
│ │ Dr. Omar  General Dentistry │ │ Form / override calendar       │  │
│ └─────────────────────────────┘ └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

- Desktop: list/detail split view.
- Mobile: doctor list first; selecting a doctor navigates within the page to a full-width detail panel.
- Use shared `DataTable` or card list, shadcn `Dialog`, `Sheet`, `Tabs`, `Form`, `Select`, `Switch`, `Calendar`, and `Alert` primitives.

---

## 3. Filters and URL State

| Param | Purpose |
|---|---|
| `q` | Search by doctor name or specialization |
| `specialization` | Optional specialization filter |
| `status` | `active`, `inactive`, or all if backend exposes status |
| `doctorId` | Selected doctor detail panel |
| `tab` | `profile` or `overrides` |
| `page` | Directory page |

Selecting a doctor writes `doctorId` to the URL. On refresh, reload that doctor if present.

---

## 4. Doctor Directory

Data source: `GET /doctors`.

| Column / Field | Notes |
|---|---|
| Doctor | Avatar/initials plus `Dr. First Last` |
| Specialization | Plain text or `Not set` |
| Default availability | Derived from clinic working hours unless backend returns summary |
| Status | Active/inactive if backend exposes it |
| Actions | Edit profile, manage overrides |

The public `GET /doctors` endpoint may not expose admin-only fields. If admin-only metadata is required, add/consume an admin-capable response from the same endpoint rather than creating duplicate local models.

---

## 5. Create/Edit Doctor Profile

Use `DoctorProfileForm` in a dialog for create and in the detail panel for edit.

| Field | Validation | Notes |
|---|---|---|
| First name | required, max 80 | Required for linked user/profile |
| Last name | required, max 80 | Required for linked user/profile |
| Email | valid email | Required on create; may be read-only after create if backend requires |
| Phone | optional phone | Reuse phone validation helper |
| Specialization | optional, max 120 | Shown in booking directory |
| Bio | optional, max 1000 | Public profile if supported |
| Active | boolean | Use only if backend exposes doctor/user status |

Create via `POST /doctors`. Edit via `PATCH /doctors/:id`.

---

## 6. Schedule Overrides

Data source: `GET /doctors/:id/schedule-overrides`.

Overrides are per-doctor exceptions to normal clinic working hours.

| Field | Validation | Notes |
|---|---|---|
| Date | required clinic date | Single date override |
| Unavailable all day | boolean | Sends null hours if selected |
| Start time | required if available | `HH:mm` |
| End time | required if available | after start |
| Reason | optional max 250 | Admin context |

Create via `POST /doctors/:id/schedule-overrides`. Delete via `DELETE /doctors/:id/schedule-overrides/:overrideId`.

Rules:

| Rule | Behavior |
|---|---|
| Past override dates | Disable creation for past dates unless backend explicitly allows |
| Overlapping overrides | Show backend conflict message and refetch overrides |
| Removing override | Confirm before delete |
| Slot impact | Invalidate selected doctor's slots, appointments, waitlist offers, and analytics |

---

## 7. Data Models

```typescript
interface DoctorDTO {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  specialization: string | null;
  bio?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CreateDoctorDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  specialization?: string | null;
  bio?: string | null;
}

interface UpdateDoctorDTO {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  specialization?: string | null;
  bio?: string | null;
  isActive?: boolean;
}

interface ScheduleOverrideDTO {
  id: string;
  doctorId: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  isUnavailable: boolean;
  reason?: string | null;
  createdAt: string;
}

interface CreateScheduleOverrideDTO {
  date: string;
  startTime: string | null;
  endTime: string | null;
  isUnavailable: boolean;
  reason?: string | null;
}
```

---

## 8. Hooks and API Layer

```typescript
// features/admin/api/admin-api.ts or features/booking/api/doctors-api.ts
export async function getDoctors(params?: DoctorFilters): Promise<PaginatedResponse<DoctorDTO> | DoctorDTO[]>;
export async function getDoctor(id: string): Promise<DoctorDTO>;
export async function createDoctor(payload: CreateDoctorDTO): Promise<DoctorDTO>;
export async function updateDoctor(id: string, payload: UpdateDoctorDTO): Promise<DoctorDTO>;
export async function getScheduleOverrides(doctorId: string): Promise<ScheduleOverrideDTO[]>;
export async function createScheduleOverride(doctorId: string, payload: CreateScheduleOverrideDTO): Promise<ScheduleOverrideDTO>;
export async function deleteScheduleOverride(doctorId: string, overrideId: string): Promise<void>;
```

```typescript
export function useDoctorScheduleOverrides(doctorId?: string) {
  return useQuery({
    queryKey: ['doctors', doctorId, 'schedule-overrides'],
    queryFn: () => getScheduleOverrides(doctorId!),
    enabled: !!doctorId,
  });
}
```

Mutations invalidate `['doctors']`, selected doctor detail, selected doctor's overrides, `['slots']`, and admin analytics queries.

---

## 9. Loading and Error States

| State | UI |
|---|---|
| Directory initial load | List/table skeleton |
| No doctors | Empty state with `Add Doctor` CTA |
| Selected doctor loading | Detail panel skeleton |
| Create/edit mutation pending | Disable form submit and show spinner |
| Override conflict | Inline alert in override form |
| Delete pending | Disable only the affected override row |
| Backend lacks admin fields | Render available fields and hide unsupported controls |

---

## 10. Routing

```tsx
{
  path: '/admin/settings/doctors',
  element: (
    <ProtectedRoute roles={['ADMIN']}>
      <AdminLayout>
        <DoctorsAdminPage />
      </AdminLayout>
    </ProtectedRoute>
  ),
}
```

---

## 11. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "doctorsAdmin": {
    "title": "Doctors",
    "subtitle": "Manage doctor profiles and schedule overrides.",
    "addDoctor": "Add Doctor",
    "searchPlaceholder": "Search doctors",
    "specialization": "Specialization",
    "status": "Status",
    "profile": "Profile",
    "overrides": "Overrides",
    "firstName": "First name",
    "lastName": "Last name",
    "email": "Email",
    "phone": "Phone",
    "bio": "Bio",
    "active": "Active",
    "saveDoctor": "Save doctor",
    "addOverride": "Add override",
    "unavailableAllDay": "Unavailable all day",
    "reason": "Reason",
    "deleteOverride": "Delete override",
    "doctorSaved": "Doctor saved.",
    "overrideSaved": "Schedule override saved."
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "doctorsAdmin": {
    "title": "الأطباء",
    "subtitle": "إدارة ملفات الأطباء واستثناءات الجداول.",
    "addDoctor": "إضافة طبيب",
    "searchPlaceholder": "ابحث عن الأطباء",
    "specialization": "التخصص",
    "status": "الحالة",
    "profile": "الملف",
    "overrides": "الاستثناءات",
    "firstName": "الاسم الأول",
    "lastName": "اسم العائلة",
    "email": "البريد الإلكتروني",
    "phone": "الهاتف",
    "bio": "نبذة",
    "active": "نشط",
    "saveDoctor": "حفظ الطبيب",
    "addOverride": "إضافة استثناء",
    "unavailableAllDay": "غير متاح طوال اليوم",
    "reason": "السبب",
    "deleteOverride": "حذف الاستثناء",
    "doctorSaved": "تم حفظ الطبيب.",
    "overrideSaved": "تم حفظ استثناء الجدول."
  }
}
```

---

## 12. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/doctors` | Doctor directory |
| GET | `/doctors/:id` | Selected doctor detail |
| POST | `/doctors` | Create doctor and linked user |
| PATCH | `/doctors/:id` | Update doctor profile |
| GET | `/doctors/:id/schedule-overrides` | Load doctor overrides |
| POST | `/doctors/:id/schedule-overrides` | Create schedule override |
| DELETE | `/doctors/:id/schedule-overrides/:overrideId` | Delete schedule override |

---

## 13. Accessibility

- Doctor list rows/cards are keyboard selectable and expose selected state.
- Form fields have labels and translated validation errors.
- Schedule override date and time inputs are reachable by keyboard.
- Delete override confirmation returns focus to the deleted row's section or the override list.
- Mobile detail panel has a clear back button to the list.

---

## 14. Acceptance Criteria

- [ ] Admin can load `/admin/settings/doctors`; non-admin roles redirect to `/403`.
- [ ] Doctor directory supports search/filter and selected doctor URL persistence.
- [ ] Admin can create a doctor through `POST /doctors`.
- [ ] Admin can update doctor profile fields through `PATCH /doctors/:id`.
- [ ] Admin can add and delete schedule overrides for a selected doctor.
- [ ] Override mutations invalidate doctor slots and analytics queries.
- [ ] Backend conflict/validation errors are displayed without losing form state.
- [ ] Mobile layout remains usable without horizontal scrolling.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds once doctor admin endpoints exist.
