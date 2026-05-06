# Spec: Login Page

**Route**: `/login`  
**Component**: `LoginPage`  
**Auth**: Public — redirect authenticated users to their role's home  
**File**: `frontend/src/features/auth/pages/LoginPage.tsx`

---

## 1. Purpose

Allows existing users (any role) to authenticate. On success the user is redirected to their role-appropriate home page. On failure a contextual error message is shown inline.

---

## 2. Layout

Full-page centered card layout (no sidebar, no authenticated navbar).

```
┌─────────────────────────────────────────────────┐
│  [Logo + Clinic Name]          [EN | AR]         │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │  Welcome Back                             │   │
│  │  Sign in to your account                 │   │
│  │                                           │   │
│  │  Email address          [_____________]   │   │
│  │  Password               [_____________]   │   │
│  │                   [Forgot password?]      │   │
│  │                                           │   │
│  │  [          Sign In          ]            │   │
│  │                                           │   │
│  │  Don't have an account? Register          │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

- Page background: `bg-muted/30`.
- Card: `shadcn Card` — max-width `420px`, centered vertically and horizontally.
- Logo above the card (links to `/`).
- `LanguageSwitcher` in the top-right corner of the page.

---

## 3. Form Fields

| Field | Type | Validation | Notes |
|---|---|---|---|
| `email` | `<input type="email">` | Required, valid email format | Lowercase trim on blur |
| `password` | `<input type="password">` | Required, min 1 char (server validates) | Toggle show/hide password eye icon |

Uses `react-hook-form` + `zod` resolver.

```typescript
// Schema
const loginSchema = z.object({
  email: z.string().email('auth.errors.invalidEmail'),
  password: z.string().min(1, 'auth.errors.passwordRequired'),
});
```

---

## 4. Behaviour

### 4.1 Submit flow

1. User submits → `POST /auth/login` with `{ email, password }`.
2. On **200**: server returns `{ data: { accessToken, user } }`.
   - Store `accessToken` in memory (axios default header) or `localStorage` per `lib/api.ts` strategy.
   - Update `AuthContext` with the returned `user` object.
   - Redirect based on role:
     - `PATIENT` → `/book`
     - `DOCTOR` → `/doctor/queue`
     - `RECEPTIONIST` → `/staff/queue`
     - `ADMIN` → `/admin/dashboard`
3. On **401**: show inline error banner: `"Invalid email or password"`.
4. On **403** (account disabled): show `"Your account has been disabled. Contact support."`.
5. On network error: show `"Something went wrong. Please try again."`.
6. While pending: disable submit button, show spinner inside button.

### 4.2 Already authenticated

If `AuthContext.isAuthenticated === true` on mount, redirect immediately to role home (same logic as post-login).

### 4.3 Redirect after login

If user arrived at `/login?redirect=/appointments`, after login redirect to `/appointments` instead of role home. Validate that the redirect path starts with `/` to prevent open-redirect attacks.

### 4.4 Forgot password link

`"Forgot password?"` → navigate to `/forgot-password`.

### 4.5 Register link

`"Don't have an account? Register"` → navigate to `/register`.

---

## 5. Error Display

- Field-level errors (zod): shown below the relevant input in red text.
- API errors: shown in a shadcn `Alert` (variant `destructive`) above the submit button.
- Error clears when the user modifies any field after a failed attempt.

---

## 6. Component Tree

```
LoginPage
├── LanguageSwitcher (top-right)
├── Logo (links to /)
└── Card
    ├── CardHeader (title + subtitle)
    ├── CardContent
    │   └── LoginForm
    │       ├── FormField (email)
    │       ├── FormField (password + show/hide toggle)
    │       ├── "Forgot password?" link
    │       ├── ErrorAlert (API error)
    │       └── SubmitButton (with spinner)
    └── CardFooter
        └── "Don't have an account? Register" link
```

---

## 7. File Layout

```
frontend/src/features/auth/
├── pages/
│   └── LoginPage.tsx
├── components/
│   └── LoginForm.tsx        # form only — reusable if needed
├── hooks/
│   └── useLogin.ts          # useMutation wrapping POST /auth/login
└── api/
    └── auth-api.ts          # loginUser(email, password) → { accessToken, user }
```

---

## 8. Routing

```tsx
// app/router.tsx
{ path: '/login', element: <RootLayout><LoginPage /></RootLayout> }
```

`RootLayout` provides the HTML shell. The login page manages its own minimal header (logo + language switcher); the authenticated app nav is not rendered.

---

## 9. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "auth": {
    "login": {
      "title": "Welcome Back",
      "subtitle": "Sign in to your account",
      "email": "Email address",
      "password": "Password",
      "forgotPassword": "Forgot password?",
      "submit": "Sign In",
      "noAccount": "Don't have an account?",
      "register": "Register",
      "showPassword": "Show password",
      "hidePassword": "Hide password"
    },
    "errors": {
      "invalidEmail": "Please enter a valid email address",
      "passwordRequired": "Password is required",
      "invalidCredentials": "Invalid email or password",
      "accountDisabled": "Your account has been disabled. Contact support.",
      "networkError": "Something went wrong. Please try again."
    }
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "auth": {
    "login": {
      "title": "مرحباً بعودتك",
      "subtitle": "سجّل الدخول إلى حسابك",
      "email": "البريد الإلكتروني",
      "password": "كلمة المرور",
      "forgotPassword": "نسيت كلمة المرور؟",
      "submit": "تسجيل الدخول",
      "noAccount": "ليس لديك حساب؟",
      "register": "إنشاء حساب",
      "showPassword": "إظهار كلمة المرور",
      "hidePassword": "إخفاء كلمة المرور"
    },
    "errors": {
      "invalidEmail": "يرجى إدخال بريد إلكتروني صحيح",
      "passwordRequired": "كلمة المرور مطلوبة",
      "invalidCredentials": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
      "accountDisabled": "تم تعطيل حسابك. يرجى التواصل مع الدعم.",
      "networkError": "حدث خطأ ما. يرجى المحاولة مرة أخرى."
    }
  }
}
```

---

## 10. Accessibility

- `<form>` has `aria-label="Login form"`.
- Each input has an associated `<label>` (not just placeholder).
- Show/hide password button has `aria-label` that updates (`"Show password"` / `"Hide password"`).
- Error `Alert` has `role="alert"` so screen readers announce it.
- Submit button `disabled` state communicated via `aria-busy="true"` while loading.

---

## 11. Acceptance Criteria

- [ ] Unauthenticated users can reach `/login` from the navbar and landing page.
- [ ] Submitting valid credentials redirects to the correct role home.
- [ ] Submitting wrong credentials shows the inline error alert without a page reload.
- [ ] "Forgot password?" navigates to `/forgot-password`.
- [ ] "Register" navigates to `/register`.
- [ ] Password field has a working show/hide toggle.
- [ ] Already-authenticated users are redirected away on mount.
- [ ] `?redirect=` param is honored post-login (safe paths only).
- [ ] All strings render in Arabic with RTL layout when language is `ar`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
