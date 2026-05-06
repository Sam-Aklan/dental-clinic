# Spec: Register Page (Patient Self-Registration)

**Route**: `/register`  
**Component**: `RegisterPage`  
**Auth**: Public — redirect authenticated users to their role home  
**File**: `frontend/src/features/auth/pages/RegisterPage.tsx`

---

## 1. Purpose

Allows new patients to create an account. Only the `PATIENT` role is self-serve; all other roles are created by an admin. On success the user is logged in automatically and redirected to `/book`.

---

## 2. Layout

Full-page centered card layout (no sidebar, no authenticated navbar).

```
┌─────────────────────────────────────────────────┐
│  [Logo + Clinic Name]          [EN | AR]         │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │  Create Your Account                      │   │
│  │  Book appointments in minutes             │   │
│  │                                           │   │
│  │  First name  [________]  Last name [____] │   │
│  │  Email address          [_______________] │   │
│  │  Password               [_______________] │   │
│  │  Confirm password       [_______________] │   │
│  │  Phone number (optional)[_______________] │   │
│  │  Date of birth (optional)[_____________]  │   │
│  │                                           │   │
│  │  [        Create Account        ]         │   │
│  │                                           │   │
│  │  Already have an account? Sign in         │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

- Card max-width: `480px`, centered.
- First name + Last name on the same row (2-column grid), collapses to 1-column on mobile.
- Page background: `bg-muted/30`.
- Logo above card links to `/`.
- `LanguageSwitcher` top-right.

---

## 3. Form Fields

| Field | Type | Required | Validation |
|---|---|---|---|
| `firstName` | text | Yes | Non-empty, max 100 chars |
| `lastName` | text | Yes | Non-empty, max 100 chars |
| `email` | email | Yes | Valid email format, lowercase trim |
| `password` | password | Yes | Min 8 chars |
| `confirmPassword` | password | Yes | Must match `password` |
| `phoneNumber` | tel | No | If provided: valid phone format (loose — allow `+`, digits, spaces, dashes) |
| `dateOfBirth` | date | No | If provided: must be in the past; user must be ≥ 16 years old |

Uses `react-hook-form` + `zod` resolver.

```typescript
const registerSchema = z.object({
  firstName: z.string().min(1, 'auth.errors.firstNameRequired').max(100),
  lastName: z.string().min(1, 'auth.errors.lastNameRequired').max(100),
  email: z.string().email('auth.errors.invalidEmail'),
  password: z.string().min(8, 'auth.errors.passwordTooShort'),
  confirmPassword: z.string(),
  phoneNumber: z.string().optional().refine(
    v => !v || /^[+\d\s\-()]{7,20}$/.test(v),
    'auth.errors.invalidPhone'
  ),
  dateOfBirth: z.string().optional().refine(
    v => !v || (dayjs(v).isValid() && dayjs(v).isBefore(dayjs()) && dayjs().diff(dayjs(v), 'year') >= 16),
    'auth.errors.invalidDOB'
  ),
}).refine(d => d.password === d.confirmPassword, {
  message: 'auth.errors.passwordMismatch',
  path: ['confirmPassword'],
});
```

---

## 4. Behaviour

### 4.1 Submit flow

1. User submits → `POST /auth/register` with:
   ```json
   {
     "firstName": "...",
     "lastName": "...",
     "email": "...",
     "password": "...",
     "phoneNumber": "...",     // optional
     "dateOfBirth": "YYYY-MM-DD"  // optional
   }
   ```
2. On **201**: server returns `{ data: { accessToken, user } }`.
   - Same session setup as login: store token, update `AuthContext`.
   - Redirect to `/book`.
3. On **409** (email already exists): show inline error `"An account with this email already exists. Sign in instead."`.
4. On **400** (validation): map server field errors to form fields if possible; else show generic error alert.
5. On network error: show generic error alert.
6. While pending: disable all fields and submit button, show spinner.

### 4.2 Already authenticated

Redirect to role home on mount (same as `LoginPage`).

### 4.3 Password strength indicator (optional enhancement)

A simple 3-level bar (weak / fair / strong) based on length + character variety — purely visual, not blocking.

---

## 5. Error Display

- Field-level zod errors: below each input.
- API errors: `Alert` (variant `destructive`) above submit button.
- 409 conflict: include a `"Sign in"` link inline in the alert text → `/login`.

---

## 6. Component Tree

```
RegisterPage
├── LanguageSwitcher (top-right)
├── Logo (links to /)
└── Card
    ├── CardHeader (title + subtitle)
    ├── CardContent
    │   └── RegisterForm
    │       ├── Row: FormField(firstName) + FormField(lastName)
    │       ├── FormField(email)
    │       ├── FormField(password + show/hide toggle)
    │       ├── FormField(confirmPassword + show/hide toggle)
    │       ├── FormField(phoneNumber) [optional label]
    │       ├── FormField(dateOfBirth) [optional label]
    │       ├── ErrorAlert
    │       └── SubmitButton
    └── CardFooter
        └── "Already have an account? Sign in" link
```

---

## 7. File Layout

```
frontend/src/features/auth/
├── pages/
│   └── RegisterPage.tsx
├── components/
│   └── RegisterForm.tsx
├── hooks/
│   └── useRegister.ts       # useMutation wrapping POST /auth/register
└── api/
    └── auth-api.ts          # registerUser(payload) → { accessToken, user }
```

---

## 8. Routing

```tsx
{ path: '/register', element: <RootLayout><RegisterPage /></RootLayout> }
```

---

## 9. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "auth": {
    "register": {
      "title": "Create Your Account",
      "subtitle": "Book appointments in minutes",
      "firstName": "First name",
      "lastName": "Last name",
      "email": "Email address",
      "password": "Password",
      "confirmPassword": "Confirm password",
      "phoneNumber": "Phone number",
      "phoneNumberOptional": "Phone number (optional)",
      "dateOfBirth": "Date of birth",
      "dateOfBirthOptional": "Date of birth (optional)",
      "submit": "Create Account",
      "hasAccount": "Already have an account?",
      "signIn": "Sign in",
      "emailConflict": "An account with this email already exists.",
      "emailConflictAction": "Sign in instead"
    },
    "errors": {
      "firstNameRequired": "First name is required",
      "lastNameRequired": "Last name is required",
      "passwordTooShort": "Password must be at least 8 characters",
      "passwordMismatch": "Passwords do not match",
      "invalidPhone": "Please enter a valid phone number",
      "invalidDOB": "Date of birth must be valid and you must be at least 16 years old"
    }
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "auth": {
    "register": {
      "title": "أنشئ حسابك",
      "subtitle": "احجز مواعيدك في دقائق",
      "firstName": "الاسم الأول",
      "lastName": "اسم العائلة",
      "email": "البريد الإلكتروني",
      "password": "كلمة المرور",
      "confirmPassword": "تأكيد كلمة المرور",
      "phoneNumber": "رقم الهاتف",
      "phoneNumberOptional": "رقم الهاتف (اختياري)",
      "dateOfBirth": "تاريخ الميلاد",
      "dateOfBirthOptional": "تاريخ الميلاد (اختياري)",
      "submit": "إنشاء الحساب",
      "hasAccount": "هل لديك حساب بالفعل؟",
      "signIn": "تسجيل الدخول",
      "emailConflict": "يوجد حساب مرتبط بهذا البريد الإلكتروني.",
      "emailConflictAction": "سجّل الدخول بدلاً من ذلك"
    },
    "errors": {
      "firstNameRequired": "الاسم الأول مطلوب",
      "lastNameRequired": "اسم العائلة مطلوب",
      "passwordTooShort": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
      "passwordMismatch": "كلمتا المرور غير متطابقتين",
      "invalidPhone": "يرجى إدخال رقم هاتف صحيح",
      "invalidDOB": "يرجى إدخال تاريخ ميلاد صحيح ويجب أن يكون عمرك 16 سنة على الأقل"
    }
  }
}
```

---

## 10. Accessibility

- `<form>` has `aria-label="Registration form"`.
- Each input has an associated visible `<label>`.
- Optional fields labelled as `"(optional)"` in the label text (translated).
- Error `Alert` has `role="alert"`.
- `confirmPassword` field's error is announced immediately on blur.
- Submit button `aria-busy="true"` while pending.

---

## 11. Acceptance Criteria

- [ ] Submitting valid data creates an account, sets auth state, and redirects to `/book`.
- [ ] Email already-in-use returns error with inline "Sign in" link.
- [ ] Password mismatch error shown on `confirmPassword` field without submitting.
- [ ] Phone number field accepts international formats; empty is valid.
- [ ] Date of birth empty is valid; a future date or age < 16 shows error.
- [ ] Password fields have working show/hide toggles.
- [ ] Already-authenticated users are redirected away on mount.
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
