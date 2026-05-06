# Spec: Error Pages

**Routes**: `/403`, `*`  
**Components**: `ForbiddenPage`, `NotFoundPage`  
**Auth**: Public route components; content adapts when a user is authenticated  
**Files**:  
- `frontend/src/features/common/pages/ForbiddenPage.tsx`
- `frontend/src/features/common/pages/NotFoundPage.tsx`
- `frontend/src/features/common/components/ErrorPageShell.tsx`

---

## 1. Purpose

Provides clear, bilingual, accessible recovery screens when a user reaches a route they cannot access or a route that does not exist.

1. `/403` explains that the authenticated user does not have permission for the attempted area.
2. `*` catches unmatched routes and renders a helpful 404 page.
3. Both pages provide safe navigation back to the correct area without leaking protected route details.
4. Both pages work in English and Arabic with correct LTR/RTL layout.

---

## 2. Routing

In `app/router.tsx`:

```tsx
{ path: '/403', element: <RootLayout><ForbiddenPage /></RootLayout> }
{ path: '*', element: <RootLayout><NotFoundPage /></RootLayout> }
```

Rules:

| Route | Trigger | Notes |
|---|---|---|
| `/403` | `ProtectedRoute` role mismatch | Use `replace` navigation from guard to avoid trapping user in browser back loop |
| `*` | No route match | Last route in router config |

`ForbiddenPage` must not require a successful auth query to render, because users can manually visit `/403`. It may read optional auth state to choose the best CTA.

---

## 3. Shared Layout

Both pages use a shared `ErrorPageShell` presentational component.

```
┌──────────────────────────────────────────────────────┐
│ [LanguageSwitcher]                                   │
│                                                      │
│        [status badge: 403 / 404]                     │
│        Large heading                                 │
│        Short explanatory text                        │
│                                                      │
│        [Primary CTA] [Secondary CTA]                 │
│                                                      │
│        Small help text / support hint                │
└──────────────────────────────────────────────────────┘
```

- Desktop: centered max-width panel, generous vertical spacing, calm clinic visual style.
- Mobile: full viewport height, stacked actions, no horizontal page scroll.
- Use shadcn `Button`, `Card`, `Alert`, and `Separator` primitives.
- Use lucide icons such as `ShieldAlert`, `SearchX`, `Home`, and `ArrowLeft`/`ArrowRight` where useful.
- Direction-aware icons must flip in RTL where they imply direction.

---

## 4. `ErrorPageShell`

### Props

```typescript
interface ErrorPageAction {
  label: string;
  to?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

interface ErrorPageShellProps {
  statusCode: '403' | '404';
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  primaryAction: ErrorPageAction;
  secondaryAction?: ErrorPageAction;
  supportText?: string;
}
```

### Behavior

- Renders a landmark `<main>` with `min-h-screen` and centered content.
- Primary action uses `<Link>` when `to` is provided, otherwise a button.
- Secondary action supports `navigate(-1)` for back navigation.
- If a back action would leave the SPA or history length is unavailable, fall back to the computed safe home route.
- Keeps the language switcher available so a user can recover in their preferred language.

---

## 5. `ForbiddenPage`

### Purpose

Shown when role authorization fails. Primary source is `ProtectedRoute` redirecting to `/403` after `useAuth()` confirms the user is authenticated but their role is not allowed.

### Content

| Element | English | Arabic |
|---|---|---|
| Status badge | `403` | `403` |
| Eyebrow | `Access restricted` | `الوصول مقيد` |
| Title | `You do not have permission to view this page.` | `ليست لديك صلاحية لعرض هذه الصفحة.` |
| Description | `Your account is signed in, but this area is limited to specific clinic roles.` | `تم تسجيل دخولك، لكن هذه المنطقة مخصصة لأدوار محددة في العيادة.` |
| Primary CTA | `Go to my workspace` | `الانتقال إلى مساحة العمل` |
| Secondary CTA | `Go back` | `الرجوع` |
| Support text | `If you think this is a mistake, contact the clinic administrator.` | `إذا كنت تعتقد أن هذا خطأ، تواصل مع مدير العيادة.` |

### Safe Workspace Route

If authenticated, choose the primary CTA destination by role:

| Role | Destination |
|---|---|
| `ADMIN` | `/admin/dashboard` |
| `RECEPTIONIST` | `/staff/queue` |
| `DOCTOR` | `/doctor/queue` |
| `PATIENT` | `/book` |

If unauthenticated or auth state is unknown, use `/login` as the primary CTA and label it `Log in`.

### Security Rules

- Do not render the required role for the denied route unless it is explicitly passed by a trusted route guard.
- Do not include raw backend error objects or route metadata in the UI.
- Do not attempt to refetch protected page data from this screen.
- Do not auto-redirect after a delay; users should remain in control.

---

## 6. `NotFoundPage`

### Purpose

Shown for unmatched routes. It should help users recover without making assumptions about what they intended.

### Content

| Element | English | Arabic |
|---|---|---|
| Status badge | `404` | `404` |
| Eyebrow | `Page not found` | `الصفحة غير موجودة` |
| Title | `We could not find that page.` | `لم نتمكن من العثور على هذه الصفحة.` |
| Description | `The link may be outdated, moved, or typed incorrectly.` | `قد يكون الرابط قديماً أو تم نقله أو تمت كتابته بشكل غير صحيح.` |
| Primary CTA | `Go home` or `Go to my workspace` | `الانتقال للرئيسية` or `الانتقال إلى مساحة العمل` |
| Secondary CTA | `Go back` | `الرجوع` |
| Support text | `Check the address or use the navigation to continue.` | `تحقق من العنوان أو استخدم التنقل للمتابعة.` |

### Destination Rules

- Authenticated users: primary CTA uses the same safe workspace route map as `ForbiddenPage`.
- Unauthenticated users: primary CTA goes to `/`.
- If the missing path starts with a known protected prefix such as `/admin`, `/doctor`, or `/staff`, do not show special role-specific copy unless the user is authenticated.

---

## 7. Component Tree

```text
ForbiddenPage
└── ErrorPageShell
    ├── LanguageSwitcher
    ├── status badge
    ├── title/content
    └── action buttons

NotFoundPage
└── ErrorPageShell
    ├── LanguageSwitcher
    ├── status badge
    ├── title/content
    └── action buttons
```

---

## 8. File Layout

```text
frontend/src/features/common/
├── components/
│   └── ErrorPageShell.tsx
└── pages/
    ├── ForbiddenPage.tsx
    └── NotFoundPage.tsx
```

If the implementation keeps page-like components under `features/common/components/`, use the same component contracts and export names, but prefer the `pages/` folder for route elements.

---

## 9. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "errors": {
    "forbidden": {
      "eyebrow": "Access restricted",
      "title": "You do not have permission to view this page.",
      "description": "Your account is signed in, but this area is limited to specific clinic roles.",
      "primaryAuthenticated": "Go to my workspace",
      "primaryGuest": "Log in",
      "secondary": "Go back",
      "support": "If you think this is a mistake, contact the clinic administrator."
    },
    "notFound": {
      "eyebrow": "Page not found",
      "title": "We could not find that page.",
      "description": "The link may be outdated, moved, or typed incorrectly.",
      "primaryAuthenticated": "Go to my workspace",
      "primaryGuest": "Go home",
      "secondary": "Go back",
      "support": "Check the address or use the navigation to continue."
    }
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "errors": {
    "forbidden": {
      "eyebrow": "الوصول مقيد",
      "title": "ليست لديك صلاحية لعرض هذه الصفحة.",
      "description": "تم تسجيل دخولك، لكن هذه المنطقة مخصصة لأدوار محددة في العيادة.",
      "primaryAuthenticated": "الانتقال إلى مساحة العمل",
      "primaryGuest": "تسجيل الدخول",
      "secondary": "الرجوع",
      "support": "إذا كنت تعتقد أن هذا خطأ، تواصل مع مدير العيادة."
    },
    "notFound": {
      "eyebrow": "الصفحة غير موجودة",
      "title": "لم نتمكن من العثور على هذه الصفحة.",
      "description": "قد يكون الرابط قديماً أو تم نقله أو تمت كتابته بشكل غير صحيح.",
      "primaryAuthenticated": "الانتقال إلى مساحة العمل",
      "primaryGuest": "الانتقال للرئيسية",
      "secondary": "الرجوع",
      "support": "تحقق من العنوان أو استخدم التنقل للمتابعة."
    }
  }
}
```

---

## 10. Accessibility

- The visible status code must not be the only description; include a clear heading.
- Page title should update through route/page metadata where the app supports it.
- Primary heading uses a single `<h1>`.
- Action buttons have descriptive labels, not only icons.
- The back action must be keyboard reachable and should not rely on pointer gestures.
- Color contrast must pass WCAG AA in light and dark themes.
- RTL direction must be inherited from `<html dir>` and not hardcoded per page.

---

## 11. Testing

Component tests with React Testing Library:

| Test | Expected Result |
|---|---|
| Render `/403` as authenticated patient | Shows forbidden copy and primary CTA to `/book` |
| Render `/403` as unauthenticated user | Shows login CTA and no protected route details |
| Render unknown path | Shows 404 copy and home/workspace CTA |
| Click secondary back action | Calls navigate back or fallback route |
| Switch to Arabic | Arabic strings render and layout respects `dir="rtl"` |
| Keyboard navigation | Primary and secondary actions are focusable in order |

---

## 12. Acceptance Criteria

- [ ] `ProtectedRoute` redirects role mismatches to `/403`.
- [ ] `/403` renders without crashing for authenticated and unauthenticated users.
- [ ] Wildcard route renders `NotFoundPage` for unknown paths.
- [ ] Authenticated users get a primary CTA to the correct role workspace.
- [ ] Guest users get safe public/login CTAs.
- [ ] Pages do not leak required roles, backend error payloads, or protected data.
- [ ] English and Arabic strings are present for all visible text.
- [ ] Mobile layout has no horizontal scroll.
- [ ] No TypeScript errors; `pnpm build` succeeds after implementation.
