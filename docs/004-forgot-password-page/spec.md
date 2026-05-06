# Spec: Forgot Password Page

**Route**: `/forgot-password`  
**Component**: `ForgotPasswordPage`  
**Auth**: Public  
**File**: `frontend/src/features/auth/pages/ForgotPasswordPage.tsx`

---

## 1. Purpose

Allows users who have forgotten their password to request a reset link sent to their email. The page has two visual states: the **input state** (email form) and the **success state** (confirmation message). No account existence is revealed to prevent email enumeration.

---

## 2. Layout

Full-page centered card layout — same shell as `LoginPage` (logo, language switcher, centered card).

### State A — Input form

```
┌─────────────────────────────────────────────────┐
│  [Logo]                        [EN | AR]         │
│                                                   │
│  ┌───────────────────────────────────────────┐   │
│  │  Forgot Password?                         │   │
│  │  Enter your email and we'll send a reset  │   │
│  │  link if an account exists.               │   │
│  │                                           │   │
│  │  Email address  [_____________________]   │   │
│  │                                           │   │
│  │  [      Send Reset Link      ]            │   │
│  │                                           │   │
│  │  ← Back to sign in                        │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### State B — Success confirmation

```
│  ┌───────────────────────────────────────────┐   │
│  │  📧  Check Your Email                     │   │
│  │                                           │   │
│  │  If an account exists for               │   │
│  │  user@example.com, a reset link has       │   │
│  │  been sent. Check your spam folder too.   │   │
│  │                                           │   │
│  │  [      Send Again      ]    (countdown)  │   │
│  │                                           │   │
│  │  ← Back to sign in                        │   │
│  └───────────────────────────────────────────┘   │
```

Card max-width `420px`. Only the card content changes; the surrounding shell stays constant.

---

## 3. Form Fields

| Field | Type | Validation |
|---|---|---|
| `email` | `<input type="email">` | Required, valid email format |

```typescript
const forgotPasswordSchema = z.object({
  email: z.string().email('auth.errors.invalidEmail'),
});
```

---

## 4. Behaviour

### 4.1 Submit flow

1. User submits → `POST /auth/forgot-password` with `{ email }`.
2. Response is always **200** regardless of whether the email exists (prevents enumeration).
3. Transition to **State B** (success), display the submitted email in the message.
4. On network error: show inline error alert, stay in State A.
5. While pending: disable field and button, show spinner.

### 4.2 "Send Again" cooldown

- On entering State B, start a 60-second cooldown.
- Button shows `"Send Again (60s)"`, counts down each second.
- Once countdown reaches 0 the button becomes enabled: `"Send Again"`.
- Clicking "Send Again" submits the same email again and restarts the countdown.

### 4.3 Email display in State B

Truncate the email if longer than 40 characters for layout safety; show full email in `title` attribute.

### 4.4 Back to sign in

`"← Back to sign in"` → `/login`. Available in both states. Arrow direction flips in RTL (`→` in RTL).

---

## 5. Component Tree

```
ForgotPasswordPage
├── LanguageSwitcher
├── Logo
└── Card
    ├── CardHeader
    └── CardContent
        ├── [State A] ForgotPasswordForm
        │   ├── FormField(email)
        │   ├── ErrorAlert
        │   ├── SubmitButton
        │   └── BackToSignInLink
        └── [State B] SuccessMessage
            ├── MailIcon
            ├── Title + description (with email)
            ├── SendAgainButton (with countdown)
            └── BackToSignInLink
```

---

## 6. File Layout

```
frontend/src/features/auth/
├── pages/
│   └── ForgotPasswordPage.tsx
├── hooks/
│   └── useForgotPassword.ts   # useMutation wrapping POST /auth/forgot-password
└── api/
    └── auth-api.ts            # forgotPassword(email) → void
```

---

## 7. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "auth": {
    "forgotPassword": {
      "title": "Forgot Password?",
      "subtitle": "Enter your email and we'll send a reset link if an account exists.",
      "email": "Email address",
      "submit": "Send Reset Link",
      "backToSignIn": "Back to sign in",
      "successTitle": "Check Your Email",
      "successMessage": "If an account exists for {{email}}, a reset link has been sent. Check your spam folder too.",
      "sendAgain": "Send Again",
      "sendAgainCooldown": "Send Again ({{seconds}}s)"
    }
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "auth": {
    "forgotPassword": {
      "title": "نسيت كلمة المرور؟",
      "subtitle": "أدخل بريدك الإلكتروني وسنرسل رابط إعادة تعيين إذا كان الحساب موجوداً.",
      "email": "البريد الإلكتروني",
      "submit": "إرسال رابط الاستعادة",
      "backToSignIn": "العودة إلى تسجيل الدخول",
      "successTitle": "تحقق من بريدك الإلكتروني",
      "successMessage": "إذا كان هناك حساب مرتبط بـ {{email}}، فقد تم إرسال رابط إعادة التعيين. تحقق من مجلد الرسائل المزعجة أيضاً.",
      "sendAgain": "إرسال مرة أخرى",
      "sendAgainCooldown": "إرسال مرة أخرى ({{seconds}}ث)"
    }
  }
}
```

---

## 8. Security Notes

- Never reveal whether the email exists in the response or the UI.
- The success message uses neutral phrasing: `"If an account exists for …"`.
- The 60-second cooldown prevents rapid re-submission from the UI (backend has its own rate limiting).

---

## 9. Accessibility

- `<form>` has `aria-label="Forgot password form"`.
- State B replaces the form in the DOM; use `role="status"` on the success message so screen readers announce it.
- Countdown timer uses `aria-live="polite"` on the button label so updates are announced non-intrusively.
- Back link uses visible text, not just an icon.

---

## 10. Acceptance Criteria

- [ ] Submitting any email (valid or not) transitions to State B without revealing account existence.
- [ ] State B displays the submitted email address.
- [ ] "Send Again" button starts disabled with a 60s countdown, then becomes active.
- [ ] Clicking "Send Again" re-submits and resets the countdown.
- [ ] Network error shows inline alert and stays in State A.
- [ ] "Back to sign in" navigates to `/login` from both states.
- [ ] All strings render in Arabic with RTL layout (`←` becomes `→` in RTL).
- [ ] No TypeScript errors; `pnpm build` succeeds.
