# Spec: Users Admin Page

**Route**: `/admin/settings/users`  
**Component**: `UsersAdminPage`  
**Auth**: ADMIN  
**File**: `frontend/src/features/admin/pages/UsersAdminPage.tsx`

---

## 1. Purpose

Allows administrators to list, create, edit, disable, and assign roles to clinic users. This page is the primary RBAC management UI and must be conservative around destructive actions.

---

## 2. Layout

Uses `AdminLayout`. The page is table-first with create/edit dialogs.

```
┌──────────────────────────────────────────────────────────────────────┐
│ [AdminLayout sidebar/header]                                         │
│                                                                      │
│ Users                                             [Create User]       │
│ Manage user accounts, roles, and account status.                     │
│                                                                      │
│ [Search] [Role] [Status] [Language] [Reset]                          │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐   │
│ │ Name | Email | Phone | Role | Status | Language | Created | ... │   │
│ └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

- Desktop: full `DataTable` with sticky action column.
- Mobile: stacked user cards with action menu.
- Use `DataTable`, shadcn `Dialog`, `DropdownMenu`, `Badge`, `Form`, `Select`, `AlertDialog`, and `Skeleton` primitives.

---

## 3. Filters and URL State

| Param | Purpose |
|---|---|
| `q` | Search by name, email, or phone |
| `role` | Comma-separated roles |
| `status` | `active`, `disabled`, or all |
| `language` | `en`, `ar`, or all |
| `page` | Current table page |
| `sortBy` | `name`, `email`, `role`, `createdAt` |
| `sortDir` | `asc` or `desc` |

Filters and pagination sync to query params. Search updates with debounce and `replace` navigation.

---

## 4. Table Columns

Data source: `GET /users`.

| Column | Sortable | Filterable | Notes |
|---|---|---|---|
| Name | Yes | Text search | First + last name |
| Email | Yes | Text search | Lowercase display |
| Phone | No | Text search | Optional |
| Role | Yes | Multi-select | `PATIENT`, `DOCTOR`, `RECEPTIONIST`, `ADMIN` |
| Status | Yes | Dropdown | Active/disabled if backend exposes flag |
| Language | No | Dropdown | `en` / `ar` |
| Created | Yes | No | Localized date |
| Actions | No | No | Edit, Disable |

Pagination: 20 rows per page.

---

## 5. Create/Edit User Form

Use `UserForm` for both create and edit. Create happens in a dialog; edit can be dialog or side sheet.

| Field | Create | Edit | Validation |
|---|---|---|---|
| First name | required | editable | required, max 80 |
| Last name | required | editable | required, max 80 |
| Email | required | usually read-only unless backend allows | valid email |
| Phone | optional | editable | phone helper |
| Role | required | editable | one role enum |
| Language preference | optional | editable | `en` or `ar` |
| Temporary password | required if backend does not email invite | hidden on edit | min 8 |

Submit create via `POST /users`. Submit edit via `PATCH /users/:id`.

Role assignment rules:

| Rule | Behavior |
|---|---|
| Current admin edits self | Do not allow disabling self; warn before role change if backend allows it |
| Last admin risk | If backend returns conflict, show blocking alert |
| Doctor role | Prefer `/doctors` page for doctor profile creation; if creating user as DOCTOR here, show note that doctor profile may need setup |
| Disabled user | Keep visible in table when status filter includes disabled |

---

## 6. Disable User Flow

Endpoint: `PATCH /users/:id/disable`.

Use `AlertDialog` with:

- User name and email.
- Warning that disabled users cannot sign in.
- Optional reason field if backend accepts one.
- Confirm button requiring explicit click, no optimistic removal.

On success, invalidate `['users']`, auth/me if disabling current user is possible, and audit log queries.

---

## 7. Data Models

```typescript
type UserRole = 'PATIENT' | 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN';

interface AdminUserDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  languagePreference: 'en' | 'ar';
  isDisabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  languagePreference?: 'en' | 'ar';
  password?: string;
}

interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  role?: UserRole;
  languagePreference?: 'en' | 'ar';
}
```

---

## 8. Hooks and API Layer

```typescript
// features/admin/api/admin-api.ts or features/profile/api/users-api.ts
export async function getUsers(params: UserFilters): Promise<PaginatedResponse<AdminUserDTO>>;
export async function getUser(id: string): Promise<AdminUserDTO>;
export async function createUser(payload: CreateUserDTO): Promise<AdminUserDTO>;
export async function updateUser(id: string, payload: UpdateUserDTO): Promise<AdminUserDTO>;
export async function disableUser(id: string): Promise<AdminUserDTO>;
```

```typescript
export function useUsers(filters: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => getUsers(filters),
    placeholderData: keepPreviousData,
  });
}
```

Mutations invalidate `['users']`, selected user detail, and `['audit']` queries.

---

## 9. Loading and Error States

| State | UI |
|---|---|
| Initial load | Table skeleton rows |
| Empty users | Empty table state; keep Create User CTA |
| Filter no results | Empty state with Reset filters |
| Create/edit pending | Disable dialog submit and show spinner |
| Email conflict `409` | Inline email field error if backend identifies field |
| Disable pending | Disable only target row action |
| Disable self blocked | Error alert explaining current admin cannot be disabled |

---

## 10. Routing

```tsx
{
  path: '/admin/settings/users',
  element: (
    <ProtectedRoute roles={['ADMIN']}>
      <AdminLayout>
        <UsersAdminPage />
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
  "usersAdmin": {
    "title": "Users",
    "subtitle": "Manage user accounts, roles, and account status.",
    "createUser": "Create User",
    "searchPlaceholder": "Search name, email, or phone",
    "role": "Role",
    "status": "Status",
    "language": "Language",
    "active": "Active",
    "disabled": "Disabled",
    "firstName": "First name",
    "lastName": "Last name",
    "email": "Email",
    "phone": "Phone",
    "temporaryPassword": "Temporary password",
    "saveUser": "Save user",
    "editUser": "Edit user",
    "disableUser": "Disable user",
    "disableConfirmTitle": "Disable this user?",
    "disableConfirmDescription": "Disabled users cannot sign in until re-enabled by an administrator.",
    "userSaved": "User saved.",
    "userDisabled": "User disabled."
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "usersAdmin": {
    "title": "المستخدمون",
    "subtitle": "إدارة حسابات المستخدمين والأدوار وحالة الحساب.",
    "createUser": "إنشاء مستخدم",
    "searchPlaceholder": "ابحث بالاسم أو البريد أو الهاتف",
    "role": "الدور",
    "status": "الحالة",
    "language": "اللغة",
    "active": "نشط",
    "disabled": "معطل",
    "firstName": "الاسم الأول",
    "lastName": "اسم العائلة",
    "email": "البريد الإلكتروني",
    "phone": "الهاتف",
    "temporaryPassword": "كلمة مرور مؤقتة",
    "saveUser": "حفظ المستخدم",
    "editUser": "تعديل المستخدم",
    "disableUser": "تعطيل المستخدم",
    "disableConfirmTitle": "تعطيل هذا المستخدم؟",
    "disableConfirmDescription": "لا يمكن للمستخدمين المعطلين تسجيل الدخول حتى يعيد المدير تفعيلهم.",
    "userSaved": "تم حفظ المستخدم.",
    "userDisabled": "تم تعطيل المستخدم."
  }
}
```

---

## 12. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/users` | List/filter users |
| POST | `/users` | Create user with role |
| GET | `/users/:id` | Load user detail |
| PATCH | `/users/:id` | Update profile fields, role, language |
| PATCH | `/users/:id/disable` | Disable user |

---

## 13. Accessibility

- Table has clear column headers and action buttons with user-specific labels.
- Create/edit dialogs focus first invalid field on validation failure.
- Role and status badges do not rely on color alone.
- Disable confirmation includes the user's name/email in visible text.
- Toast success/failure messages use accessible status semantics.

---

## 14. Acceptance Criteria

- [ ] Admin can load `/admin/settings/users`; non-admin roles redirect to `/403`.
- [ ] User table supports search, role/status/language filters, sorting, and pagination.
- [ ] Admin can create a user with a valid role.
- [ ] Admin can edit user profile fields and role where backend allows.
- [ ] Admin can disable a user only after confirmation.
- [ ] Current admin self-disable is blocked in the UI or handled by backend error display.
- [ ] Email conflicts and validation errors stay in the dialog and preserve entered values.
- [ ] Mobile layout remains usable without horizontal scrolling.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds once users admin endpoints exist.
