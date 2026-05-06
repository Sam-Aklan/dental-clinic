# Spec: Reset Password Page

**Route**: `/reset-password?token=<token>`  
**Component**: `ResetPasswordPage`  
**Auth**: Public  
**File**: `frontend/src/features/auth/pages/ResetPasswordPage.tsx`

---

## 1. Purpose

Allows users to set a new password after clicking the emailed reset link. The page reads the one-time token from the URL query string, validates it server-side on load, and presents a new-password form. On success, redirects to `/login` with a success toast.

---

## 2. Layout

Same centered card shell as `LoginPage` / `ForgotPasswordPage`.

### State A — Validating token (on mount)

```
│  ┌───────────────────────────────────────────┐   │
│  │  🔄  Validating your link…               │   │
│  │  (spinner)                                │   │
│  └───────────────────────────────────────────┘   │
```

### State B — Valid token: Password form

```
│  ┌───────────────────────────────────────────┐   │
│  │  Set New Password                         │   │
│  │  Choose a strong password for your        │   │
│  │  account.                                 │   │
│  │                                           │   │
│  │  New password       [__________________]  │   │
│  │  Confirm password   [__________________]  │   │
│  │                                           │   │
│  │  [       Save New Password       ]        │   │
│  └───────────────────────────────────────────┘   │
```

### State C — Invalid / expired token

```
│  ┌───────────────────────────────────────────┐   │
│  │  ⚠️  Link Expired or Invalid              │   │
│  │  This reset link has expired or already   │   │
│  │  been used.                               │   │
│  │                                           │   │
│  │  [    Request a new reset link    ]       │   │
│  └───────────────────────────────────────────┘   │
```

### State D — Success

```
│  ┌───────────────────────────────────────────┐   │
│  │  ✅  Password Updated!                    │   │
│  │  Your password has been changed. You      │   │
│  │  will be redirected to sign in…           │   │
│  │  (auto-redirects after 2 seconds)         │   │
│  └───────────────────────────────────────────┘   │
```

---

## 3. Token Handling

1. On mount, read `token` from `new URLSearchParams(location.search).get('token')`.
2. If no token in URL → immediately show **State C** (invalid/expired).
3. If token present → show **State A** (validating) while calling `GET /auth/reset-password/validate?token=<token>`.
   - **200**: transition to **State B** (valid).
   - **400/404/410**: transition to **State C** (invalid/expired).
4. Do not expose the token validation status in a way that allows enumeration of valid tokens.

> **Note**: If the backend does not provide a separate validate endpoint, skip the pre-validation and surface token errors only on form submit (go directly to State B from State A, then handle 400 in submit flow).

---

## 4. Form Fields (State B only)

| Field | Type | Validation |
|---|---|---|
| `password` | password | Required, min 8 chars |
| `confirmPassword` | password | Must match `password` |

```typescript
const resetPasswordSchema = z.object({
  password: z.string().min(8, 'auth.errors.passwordTooShort'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'auth.errors.passwordMismatch',
  path: ['confirmPassword'],
});
```

Both fields have show/hide password toggles.

---

## 5. Behaviour

### 5.1 Submit flow (State B)

1. User submits → `POST /auth/reset-password` with `{ token, password }`.
2. On **200**: transition to **State D** (success). Auto-redirect to `/login` after 2 seconds. Fire a success toast: `"Password updated successfully. Please sign in."`.
3. On **400** (`token_expired` / `token_used`): transition to **State C** (invalid/expired). 
4. On **400** (validation error): show field-level error alert.
5. On network error: show inline error alert, stay in State B.
6. While pending: disable fields and button, show spinner.

### 5.2 "Request a new reset link" button (State C)

Navigates to `/forgot-password`.

### 5.3 Auto-redirect (State D)

Use `setTimeout(2000)` → `navigate('/login')`. No manual user action needed (but provide a `"Sign in now"` link as a fallback).

---

## 6. Component Tree

```
ResetPasswordPage
├── LanguageSwitcher
├── Logo
└── Card
    ├── CardHeader
    └── CardContent
        ├── [State A] ValidatingSpinner
        ├── [State B] ResetPasswordForm
        │   ├── FormField(password + show/hide)
        │   ├── FormField(confirmPassword + show/hide)
        │   ├── ErrorAlert
        │   └── SubmitButton
        ├── [State C] InvalidTokenMessage
        │   └── "Request new link" button → /forgot-password
        └── [State D] SuccessMessage
            ├── CheckCircleIcon
            ├── Description + redirect countdown
            └── "Sign in now" link → /login
```

---

## 7. File Layout

```
frontend/src/features/auth/
├── pages/
│   └── ResetPasswordPage.tsx
├── hooks/
│   └── useResetPassword.ts   # useMutation wrapping POST /auth/reset-password
└── api/
    └── auth-api.ts           # resetPassword(token, password) → void
                              # validateResetToken(token) → void (optional)
```

---

## 8. Routing

```tsx
{ path: '/reset-password', element: <RootLayout><ResetPasswordPage /></RootLayout> }
```

Token is in the query string, not the path, so no route param needed.

---

## 9. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "auth": {
    "resetPassword": {
      "validating": "Validating your link…",
      "title": "Set New Password",
      "subtitle": "Choose a strong password for your account.",
      "password": "New password",
      "confirmPassword": "Confirm password",
      "submit": "Save New Password",
      "invalidTitle": "Link Expired or Invalid",
      "invalidMessage": "This reset link has expired or has already been used.",
      "requestNewLink": "Request a new reset link",
      "successTitle": "Password Updated!",
      "successMessage": "Your password has been changed. You will be redirected to sign in…",
      "signInNow": "Sign in now",
      "successToast": "Password updated successfully. Please sign in."
    }
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "auth": {
    "resetPassword": {
      "validating": "جارٍ التحقق من الرابط…",
      "title": "تعيين كلمة مرور جديدة",
      "subtitle": "اختر كلمة مرور قوية لحسابك.",
      "password": "كلمة المرور الجديدة",
      "confirmPassword": "تأكيد كلمة المرور",
      "submit": "حفظ كلمة المرور الجديدة",
      "invalidTitle": "الرابط منتهي الصلاحية أو غير صالح",
      "invalidMessage": "انتهت صلاحية رابط إعادة التعيين أو تم استخدامه بالفعل.",
      "requestNewLink": "طلب رابط إعادة تعيين جديد",
      "successTitle": "تم تحديث كلمة المرور!",
      "successMessage": "تم تغيير كلمة مرورك. سيتم تحويلك إلى صفحة تسجيل الدخول…",
      "signInNow": "تسجيل الدخول الآن",
      "successToast": "تم تحديث كلمة المرور بنجاح. يرجى تسجيل الدخول."
    }
  }
}
```

---

## 10. Security Notes

- The `token` is passed from URL to the POST body — never stored in `localStorage` or `sessionStorage`.
- After a successful reset, all refresh tokens for the user are invalidated server-side; the user must log in fresh.
- Do not pre-fill any field from URL parameters.

---

## 11. Accessibility

- State transitions replace card content in place — use `aria-live="polite"` on the card content area so screen readers announce state changes.
- Spinner in State A has `role="status"` and `aria-label` with the validating text.
- State C and D messages use `role="alert"`.
- Password fields have show/hide toggles with updating `aria-label`.

---

## 12. Acceptance Criteria

- [ ] Navigating to `/reset-password` with no `?token=` shows State C immediately.
- [ ] Valid token shows State B password form.
- [ ] Invalid/expired token from server shows State C.
- [ ] Password mismatch shown on `confirmPassword` without submitting.
- [ ] Successful submit shows State D and redirects to `/login` after 2s.
- [ ] Token-expired error from submit transitions to State C.
- [ ] `"Request a new reset link"` navigates to `/forgot-password`.
- [ ] `"Sign in now"` in State D navigates to `/login`.
- [ ] Both password fields have working show/hide toggles.
- [ ] All strings render in Arabic with RTL layout.
- [ ] No TypeScript errors; `pnpm build` succeeds.
