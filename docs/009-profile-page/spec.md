# Spec: Profile Page

**Route**: `/me`  
**Component**: `ProfilePage`  
**Auth**: Any authenticated role (ADMIN, RECEPTIONIST, DOCTOR, PATIENT)  
**File**: `frontend/src/features/profile/pages/ProfilePage.tsx`

---

## 1. Purpose

Allows any authenticated user to view and update their own profile information, change their password, and set their language preference. The page is reachable from the nav of every role-specific layout.

---

## 2. Layout

Uses the role-appropriate layout shell (passed as a wrapper in the router). The page content is a single-column form card layout.

```
┌─────────────────────────────────────────────────────────────────┐
│  [Role Layout sidebar/header]                                    │
│                                                                   │
│  Profile Settings                                                 │
│  ──────────────────────────────────────────────────────────────  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Personal Information                                    │    │
│  │  ─────────────────────                                   │    │
│  │  First name    [_________________________]               │    │
│  │  Last name     [_________________________]               │    │
│  │  Email         user@example.com  (read-only)             │    │
│  │  Phone         [_________________________]               │    │
│  │  Date of birth [_________________________]               │    │
│  │  Language      [English ▼]                               │    │
│  │                                                          │    │
│  │                              [   Save Changes   ]        │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Change Password                                         │    │
│  │  ─────────────────────                                   │    │
│  │  Current password  [_________________________]           │    │
│  │  New password      [_________________________]           │    │
│  │  Confirm password  [_________________________]           │    │
│  │                                                          │    │
│  │                              [  Update Password  ]       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

- Two separate shadcn `Card` sections stacked vertically.
- Max content width: `640px`, left-aligned within the layout.

---

## 3. Personal Information Form

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `firstName` | text | Yes | Pre-filled from `user.firstName` |
| `lastName` | text | Yes | Pre-filled from `user.lastName` |
| `email` | text | — | Read-only; shown as static text, not an input |
| `phoneNumber` | tel | No | Pre-filled from `patientProfile.phoneNumber` (PATIENT only); hidden for other roles unless backend returns it |
| `dateOfBirth` | date | No | Pre-filled from `patientProfile.dateOfBirth` (PATIENT only) |
| `preferredLocale` | select | Yes | `EN` or `AR`; pre-filled from `user.preferredLocale` |

**Note on role fields**: Non-patient roles (DOCTOR, RECEPTIONIST, ADMIN) do not have a `patientProfile`. The phone and DOB fields are shown only if the user's profile includes them (i.e. hide conditionally based on whether the data exists in the response from `GET /users/me`).

### Zod schema

```typescript
const profileSchema = z.object({
  firstName: z.string().min(1, 'profile.errors.firstNameRequired').max(100),
  lastName: z.string().min(1, 'profile.errors.lastNameRequired').max(100),
  phoneNumber: z.string().optional().refine(
    v => !v || /^[+\d\s\-()]{7,20}$/.test(v),
    'profile.errors.invalidPhone'
  ),
  dateOfBirth: z.string().optional().refine(
    v => !v || (dayjs(v).isValid() && dayjs(v).isBefore(dayjs())),
    'profile.errors.invalidDOB'
  ),
  preferredLocale: z.enum(['EN', 'AR']),
});
```

### Submit flow

1. `PATCH /users/me` with updated fields.
2. On **200**: show success toast `"Profile updated successfully."`, call `AuthContext.refreshUser()` to sync name in the nav.
3. If `preferredLocale` changed: call `i18n.changeLanguage(locale)` + update `localStorage` + `<html lang/dir>`.
4. On **400**: show field errors.
5. On network error: show generic error alert.

---

## 4. Change Password Form

### Fields

| Field | Type | Validation |
|---|---|---|
| `currentPassword` | password | Required |
| `newPassword` | password | Required, min 8 chars, must differ from `currentPassword` |
| `confirmPassword` | password | Must match `newPassword` |

All three fields have show/hide toggles.

### Zod schema

```typescript
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'profile.errors.currentPasswordRequired'),
  newPassword: z.string().min(8, 'profile.errors.passwordTooShort'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'profile.errors.passwordMismatch',
  path: ['confirmPassword'],
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'profile.errors.passwordSameAsCurrent',
  path: ['newPassword'],
});
```

### Submit flow

1. `PATCH /users/me/password` with `{ currentPassword, newPassword }`.
2. On **200**: show success toast `"Password changed successfully."`. Clear and reset the form.
3. On **401** / `current_password_incorrect`: show inline error on `currentPassword` field: `"Incorrect current password."`.
4. On **400**: show field errors.
5. While pending: disable all fields and button, show spinner.

---

## 5. Data Loading

On mount, call `GET /users/me` to get the full profile (including `patientProfile` if applicable).

```typescript
// features/profile/hooks/useProfile.ts
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => getUserProfile(),   // GET /users/me
  });
}
```

While loading: show a skeleton loader inside each card (3–4 skeleton rows per card).  
On error: show an error state with a "Retry" button.

`GET /users/me` returns:

```typescript
interface UserProfileDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  preferredLocale: Locale;
  isActive: boolean;
  patientProfile?: {
    phoneNumber: string | null;
    dateOfBirth: string | null;    // ISO date
  };
  doctorProfile?: {
    licenseNumber: string;
    specialization: string;
    bio: string | null;
  };
}
```

---

## 6. Language Preference Behaviour

When the user saves a new `preferredLocale`:
1. The PATCH request updates the server record.
2. On success, the frontend immediately calls `i18n.changeLanguage('ar' | 'en')`.
3. Updates `localStorage.setItem('language', lang)`.
4. Sets `document.documentElement.lang` and `document.documentElement.dir`.
5. The UI re-renders in the new language — including the profile page itself.

The `LanguageSwitcher` in the nav and the profile form's language dropdown should stay in sync (both reflect the current `i18n.language`).

---

## 7. Component Tree

```
ProfilePage
├── PageHeader ("Profile Settings")
├── ProfileCard (Personal Information)
│   ├── [loading] Skeleton (3 rows)
│   ├── [error]   ErrorAlert + RetryButton
│   └── [data]    ProfileForm
│       ├── FormField(firstName)
│       ├── FormField(lastName)
│       ├── ReadOnlyEmail
│       ├── FormField(phoneNumber)       [if applicable]
│       ├── FormField(dateOfBirth)       [if applicable]
│       ├── FormField(preferredLocale — Select)
│       ├── ErrorAlert
│       └── SaveButton
└── PasswordCard (Change Password)
    └── ChangePasswordForm
        ├── FormField(currentPassword + show/hide)
        ├── FormField(newPassword + show/hide)
        ├── FormField(confirmPassword + show/hide)
        ├── ErrorAlert
        └── UpdatePasswordButton
```

---

## 8. File Layout

```
frontend/src/features/profile/
├── pages/
│   └── ProfilePage.tsx
├── components/
│   ├── ProfileForm.tsx           # personal info form
│   └── ChangePasswordForm.tsx    # change password form
├── hooks/
│   ├── useProfile.ts             # useQuery for GET /users/me
│   ├── useUpdateProfile.ts       # useMutation for PATCH /users/me
│   └── useChangePassword.ts      # useMutation for PATCH /users/me/password
└── api/
    └── users-api.ts              # getUserProfile(), updateProfile(), changePassword()
```

---

## 9. Routing

```tsx
// Any authenticated role; each uses their own layout
{ path: '/me', element: (
  <ProtectedRoute>
    <RoleAwareLayout>
      <ProfilePage />
    </RoleAwareLayout>
  </ProtectedRoute>
) }
```

`RoleAwareLayout` is a helper that picks the right layout based on `user.role`:
```typescript
function RoleAwareLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  switch (user?.role) {
    case 'PATIENT':      return <PatientLayout>{children}</PatientLayout>;
    case 'DOCTOR':       return <DoctorLayout>{children}</DoctorLayout>;
    case 'RECEPTIONIST': return <ReceptionistLayout>{children}</ReceptionistLayout>;
    case 'ADMIN':        return <AdminLayout>{children}</AdminLayout>;
    default:             return <>{children}</>;
  }
}
```

Alternatively each role's layout section in the router wraps `/me` individually — either approach is acceptable.

---

## 10. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "profile": {
    "title": "Profile Settings",
    "personalInfo": {
      "sectionTitle": "Personal Information",
      "firstName": "First name",
      "lastName": "Last name",
      "email": "Email address",
      "phoneNumber": "Phone number",
      "dateOfBirth": "Date of birth",
      "preferredLocale": "Preferred language",
      "localeEn": "English",
      "localeAr": "Arabic",
      "save": "Save Changes",
      "saveSuccess": "Profile updated successfully."
    },
    "changePassword": {
      "sectionTitle": "Change Password",
      "currentPassword": "Current password",
      "newPassword": "New password",
      "confirmPassword": "Confirm new password",
      "submit": "Update Password",
      "successToast": "Password changed successfully."
    },
    "errors": {
      "firstNameRequired": "First name is required",
      "lastNameRequired": "Last name is required",
      "invalidPhone": "Please enter a valid phone number",
      "invalidDOB": "Please enter a valid past date",
      "currentPasswordRequired": "Current password is required",
      "passwordTooShort": "Password must be at least 8 characters",
      "passwordMismatch": "Passwords do not match",
      "passwordSameAsCurrent": "New password must differ from the current password",
      "incorrectCurrentPassword": "Incorrect current password"
    }
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "profile": {
    "title": "إعدادات الملف الشخصي",
    "personalInfo": {
      "sectionTitle": "المعلومات الشخصية",
      "firstName": "الاسم الأول",
      "lastName": "اسم العائلة",
      "email": "البريد الإلكتروني",
      "phoneNumber": "رقم الهاتف",
      "dateOfBirth": "تاريخ الميلاد",
      "preferredLocale": "اللغة المفضلة",
      "localeEn": "الإنجليزية",
      "localeAr": "العربية",
      "save": "حفظ التغييرات",
      "saveSuccess": "تم تحديث الملف الشخصي بنجاح."
    },
    "changePassword": {
      "sectionTitle": "تغيير كلمة المرور",
      "currentPassword": "كلمة المرور الحالية",
      "newPassword": "كلمة المرور الجديدة",
      "confirmPassword": "تأكيد كلمة المرور الجديدة",
      "submit": "تحديث كلمة المرور",
      "successToast": "تم تغيير كلمة المرور بنجاح."
    },
    "errors": {
      "firstNameRequired": "الاسم الأول مطلوب",
      "lastNameRequired": "اسم العائلة مطلوب",
      "invalidPhone": "يرجى إدخال رقم هاتف صحيح",
      "invalidDOB": "يرجى إدخال تاريخ صحيح في الماضي",
      "currentPasswordRequired": "كلمة المرور الحالية مطلوبة",
      "passwordTooShort": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
      "passwordMismatch": "كلمتا المرور غير متطابقتين",
      "passwordSameAsCurrent": "يجب أن تختلف كلمة المرور الجديدة عن الحالية",
      "incorrectCurrentPassword": "كلمة المرور الحالية غير صحيحة"
    }
  }
}
```

---

## 11. API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/users/me` | Load profile data |
| PATCH | `/users/me` | Update personal info + language |
| PATCH | `/users/me/password` | Change password |

---

## 12. Accessibility

- Both forms have `aria-label` attributes.
- Read-only email displayed in a `<p>` with `aria-label="Email address"`.
- Success toasts use `role="status"`.
- Error alerts use `role="alert"`.
- All password fields have show/hide toggles with updating `aria-label`.
- Language selector is a proper `<select>` (not a custom dropdown) for screen-reader compatibility.

---

## 13. Acceptance Criteria

- [ ] Page loads profile data from `GET /users/me`; form is pre-filled.
- [ ] Skeleton shown while data is loading.
- [ ] Saving personal info sends `PATCH /users/me` and shows success toast.
- [ ] After saving, `AuthContext` user is refreshed (name in nav updates if changed).
- [ ] Changing `preferredLocale` to Arabic immediately switches the UI to RTL Arabic.
- [ ] Email field is read-only and cannot be submitted.
- [ ] Phone and DOB fields only appear for PATIENT role (or when backend returns them).
- [ ] Submitting change-password with wrong `currentPassword` shows error on that field.
- [ ] Password mismatch error shown on `confirmPassword` without submitting.
- [ ] Submitting same password as current shows error on `newPassword`.
- [ ] All three password fields have working show/hide toggles.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
