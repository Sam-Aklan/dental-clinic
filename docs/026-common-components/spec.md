# Spec: Common Components, Layouts, and Utility Hooks

**Type**: Shared frontend foundation  
**Scope**: Common shell components, role layouts, language direction, loading, toasts, pagination, and runtime error handling  
**Auth**: Mixed; components must work before, during, and after auth state resolution  
**Files**: `frontend/src/features/common/**`

---

## 1. Purpose

Defines the reusable UI foundation used by all pages in the dental clinic SPA.

1. Provides consistent navigation shells for public, patient, doctor, receptionist, and admin areas.
2. Centralizes bilingual EN/AR switching and RTL direction handling.
3. Provides common loading, toast, pagination, and runtime error handling patterns.
4. Keeps shared components small, accessible, and independent from feature-specific business logic.

This spec covers the common components listed in `FRONTEND_PLAN.md`: `Header`, `Sidebar`, `LanguageSwitcher`, `LoadingSpinner`, and `ErrorBoundary`. Error-page route components are specified separately in `specs/025-error-pages/spec.md`.

---

## 2. File Layout

```text
frontend/src/features/common/
├── components/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── LanguageSwitcher.tsx
│   ├── LoadingSpinner.tsx
│   ├── ErrorBoundary.tsx
│   └── ErrorPageShell.tsx
├── hooks/
│   ├── useDirection.ts
│   ├── useToast.ts
│   └── usePagination.ts
├── layouts/
│   ├── RootLayout.tsx
│   ├── PatientLayout.tsx
│   ├── DoctorLayout.tsx
│   ├── ReceptionistLayout.tsx
│   └── AdminLayout.tsx
└── navigation.ts
```

`navigation.ts` contains role-specific nav config so `Sidebar` and layouts do not duplicate labels, paths, or icons.

---

## 3. Design and Technical Rules

- Use TypeScript strict types for all props and exported hooks.
- Use shadcn/ui primitives where they already exist: `Button`, `DropdownMenu`, `Sheet`, `Avatar`, `Separator`, `Tooltip`, `ScrollArea`, `Skeleton`, and `Badge`.
- Use lucide-react icons for navigation and actions.
- Use `cn()` from `utils/classnames.ts` for conditional classes.
- Use Tailwind logical utilities where available; otherwise use CSS logical properties in `globals.css`.
- Shared components must not import feature-specific APIs, feature-specific hooks, or page components.
- Shared components may import `useAuth()` only where user identity or logout is part of the shell.
- All visible strings must use `react-i18next` keys.

---

## 4. Navigation Model

### Types

```typescript
type Role = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'PATIENT';

interface NavItem {
  labelKey: string;
  to: string;
  icon: LucideIcon;
  roles?: Role[];
  exact?: boolean;
}

interface NavSection {
  labelKey?: string;
  items: NavItem[];
}
```

### Role Navigation

| Layout | Items |
|---|---|
| `PatientLayout` | Book Appointment `/book`, My Appointments `/appointments`, Waitlist `/waitlist`, Profile `/me` |
| `DoctorLayout` | My Queue `/doctor/queue`, Today's Schedule `/doctor/today`, Profile `/me` |
| `ReceptionistLayout` | Queue `/staff/queue`, Appointments `/staff/appointments`, Patients `/staff/patients`, Walk-In Booking `/staff/walkin`, Profile `/me` |
| `AdminLayout` | Dashboard `/admin/dashboard`, Clinic Settings `/admin/settings/clinic`, Doctors `/admin/settings/doctors`, Users `/admin/settings/users`, Audit Log `/admin/audit`, Profile `/me` |

Admins may access receptionist routes through route permissions, but `AdminLayout` should keep admin navigation focused on admin tasks. If an admin visits `/staff/*`, render the receptionist shell for that route.

---

## 5. `Header`

### Purpose

Top application bar used by authenticated layouts. It provides page context, mobile sidebar access, language switching, and the user menu.

### Props

```typescript
interface HeaderProps {
  title?: string;
  subtitle?: string;
  showSidebarTrigger?: boolean;
  onSidebarOpen?: () => void;
  actions?: ReactNode;
}
```

### Content

- Left/start side: sidebar trigger on mobile, page title, optional subtitle.
- Right/end side: optional page actions, `LanguageSwitcher`, user avatar/menu.
- User menu items: Profile, role label, Logout.
- Logout calls `useAuth().logout()` and navigates to `/login` on success.

### Behavior

- Sticky at top inside authenticated app shells.
- Uses `border-block-end` and backdrop blur for visual separation.
- Does not duplicate page-specific buttons that belong inside pages, except through the `actions` slot.
- During auth loading, show skeleton avatar/menu rather than rendering stale user data.

---

## 6. `Sidebar`

### Purpose

Role-specific primary navigation used by authenticated layouts.

### Props

```typescript
interface SidebarProps {
  sections: NavSection[];
  collapsed?: boolean;
  onNavigate?: () => void;
}
```

### Behavior

- Highlights the active item using `useLocation()`.
- Desktop: fixed inline-start side rail with scrollable nav body.
- Mobile: rendered inside shadcn `Sheet`; sheet side is `left` for LTR and `right` for RTL.
- Collapsed desktop mode is optional for first implementation; if omitted, keep a stable 16rem width.
- Active item matching uses exact matching when `exact` is true; otherwise prefix matching.
- Navigation links close the mobile sheet through `onNavigate`.

### Visual Rules

- Clinic logo and role workspace label at top.
- Nav sections separated with `Separator` where labels exist.
- Icons use consistent size and color; directional icons flip in RTL.
- The current route uses both color and a visible left/right border indicator.

---

## 7. `LanguageSwitcher`

### Purpose

Switches the app between English LTR and Arabic RTL.

### Props

```typescript
type LanguageCode = 'en' | 'ar';

interface LanguageSwitcherProps {
  variant?: 'segmented' | 'dropdown' | 'compact';
  showLabel?: boolean;
}
```

### Behavior

- Calls `i18n.changeLanguage(language)`.
- Persists selection in `localStorage` under `language`.
- Updates `document.documentElement.lang` to `en` or `ar`.
- Updates `document.documentElement.dir` to `ltr` or `rtl`.
- Updates any local direction state through `useDirection()`.
- Does not require auth; must work on public and error pages.

### Variants

| Variant | Usage |
|---|---|
| `segmented` | Header and landing navbar desktop |
| `dropdown` | Narrow sidebars or crowded headers |
| `compact` | Mobile sheets and error pages |

---

## 8. `LoadingSpinner`

### Purpose

Reusable loading indicator for route guards, page sections, buttons, and inline async states.

### Props

```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  fullPage?: boolean;
  overlay?: boolean;
  className?: string;
}
```

### Behavior

- `fullPage` renders a centered spinner in a `min-h-screen` container.
- `overlay` renders over the nearest positioned parent with a translucent background.
- `label` renders visually and is also exposed through `aria-live="polite"`.
- If no label is provided, use localized `common.loading` for screen readers.
- Button-level usage should prefer a small spinner with no layout shift.

---

## 9. `ErrorBoundary`

### Purpose

Catches render-time errors in the React tree and shows a recoverable fallback instead of a blank app.

### Implementation Requirement

Use a class component error boundary or `react-error-boundary`. If no dependency is already installed, implement the class component directly to avoid adding a dependency.

### Props

```typescript
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  resetKeys?: unknown[];
}
```

### Fallback UI

- Heading: `Something went wrong.`
- Description: `The page failed to load. You can try again or return to a safe page.`
- Primary action: Try again, which resets the boundary.
- Secondary action: Go home/workspace.
- Technical details are hidden by default and only shown in development mode.

### Placement

Wrap the app below providers but above route rendering:

```tsx
<AppProviders>
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>
</AppProviders>
```

Do not use `ErrorBoundary` to handle expected API errors; pages and React Query states should render local error states for those.

---

## 10. Layout Components

### `RootLayout`

Public shell for landing, auth pages, lobby queue, and error pages.

- Renders an `<Outlet />` or `children` without authenticated sidebar.
- Applies global direction classes from `useDirection()`.
- May include a minimal top-right `LanguageSwitcher` only for pages that do not provide their own navigation.
- Does not call protected APIs.

### Authenticated Layout Base

`PatientLayout`, `DoctorLayout`, `ReceptionistLayout`, and `AdminLayout` share the same structure:

```text
AuthenticatedLayout
├── Sidebar
├── mobile Sidebar Sheet
├── Header
└── main content outlet
```

Common behavior:

- Requires `useAuth()` user data and assumes route is already protected by `ProtectedRoute`.
- Uses role-specific `NavSection[]` from `navigation.ts`.
- Provides skip link to main content.
- Main content has responsive padding and `min-h-screen`.
- Mobile sidebar state lives in the layout, not in `Sidebar`.

---

## 11. Utility Hooks

### `useDirection`

```typescript
type Direction = 'ltr' | 'rtl';

interface UseDirectionResult {
  direction: Direction;
  language: 'en' | 'ar';
  isRtl: boolean;
  setLanguage: (language: 'en' | 'ar') => Promise<void>;
}
```

Responsibilities:

- Derive direction from current i18n language.
- Keep `<html lang>` and `<html dir>` synchronized.
- Persist language to `localStorage`.
- Return helpers used by layouts and direction-aware components.

### `useToast`

```typescript
interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

interface UseToastResult {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
}
```

Responsibilities:

- Wrap the selected toast implementation, preferably `sonner` if installed.
- Keep toast calls consistent across features.
- Use localized strings at call sites; the hook should not translate unknown message keys.
- Render toasts in the app provider once, not per page.

### `usePagination`

```typescript
interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  total?: number;
}

interface UsePaginationResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  offset: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  reset: () => void;
}
```

Responsibilities:

- Clamp page to `1..totalPages` when total changes.
- Reset to page 1 when page size changes.
- Expose `offset` for API params where needed.
- Leave URL synchronization to page-level code unless a page explicitly wraps it.

---

## 12. i18n Keys

### English additions to `i18n/en.json`

```json
{
  "common": {
    "loading": "Loading...",
    "tryAgain": "Try again",
    "goHome": "Go home",
    "goBack": "Go back",
    "openNavigation": "Open navigation",
    "closeNavigation": "Close navigation",
    "profile": "Profile",
    "logout": "Logout",
    "language": "Language",
    "english": "English",
    "arabic": "Arabic",
    "somethingWentWrong": "Something went wrong.",
    "pageFailed": "The page failed to load. You can try again or return to a safe page."
  },
  "nav": {
    "workspace": "Workspace",
    "book": "Book Appointment",
    "appointments": "My Appointments",
    "waitlist": "Waitlist",
    "myQueue": "My Queue",
    "doctorToday": "Today's Schedule",
    "staffQueue": "Queue",
    "staffAppointments": "Appointments",
    "patients": "Patients",
    "walkIn": "Walk-In Booking",
    "adminDashboard": "Dashboard",
    "clinicSettings": "Clinic Settings",
    "doctors": "Doctors",
    "users": "Users",
    "auditLog": "Audit Log"
  }
}
```

### Arabic additions to `i18n/ar.json`

```json
{
  "common": {
    "loading": "جاري التحميل...",
    "tryAgain": "حاول مرة أخرى",
    "goHome": "الانتقال للرئيسية",
    "goBack": "الرجوع",
    "openNavigation": "فتح التنقل",
    "closeNavigation": "إغلاق التنقل",
    "profile": "الملف الشخصي",
    "logout": "تسجيل الخروج",
    "language": "اللغة",
    "english": "الإنجليزية",
    "arabic": "العربية",
    "somethingWentWrong": "حدث خطأ ما.",
    "pageFailed": "فشل تحميل الصفحة. يمكنك المحاولة مرة أخرى أو العودة إلى صفحة آمنة."
  },
  "nav": {
    "workspace": "مساحة العمل",
    "book": "حجز موعد",
    "appointments": "مواعيدي",
    "waitlist": "قائمة الانتظار",
    "myQueue": "قائمتي",
    "doctorToday": "جدول اليوم",
    "staffQueue": "الطابور",
    "staffAppointments": "المواعيد",
    "patients": "المرضى",
    "walkIn": "حجز زيارة مباشرة",
    "adminDashboard": "لوحة التحكم",
    "clinicSettings": "إعدادات العيادة",
    "doctors": "الأطباء",
    "users": "المستخدمون",
    "auditLog": "سجل التدقيق"
  }
}
```

---

## 13. Accessibility

- Header and sidebar use semantic `<header>`, `<nav>`, and `<main>` landmarks.
- Provide a visible skip link that jumps to `#main-content`.
- Mobile sidebar trigger has an accessible label and focus returns to the trigger after close.
- Active nav item uses `aria-current="page"`.
- Loading states expose `role="status"` or `aria-live="polite"`.
- Error boundary fallback uses a single `<h1>` or `<h2>` depending on placement.
- Language switcher buttons expose selected state with `aria-pressed` or menu checked state.
- Toasts must be announced through the selected toast library's accessible region.

---

## 14. Testing

Unit/component tests:

| Target | Expected Coverage |
|---|---|
| `LanguageSwitcher` | Changes i18n language, localStorage, `<html lang>`, and `<html dir>` |
| `useDirection` | Returns `rtl` for Arabic and `ltr` for English |
| `LoadingSpinner` | Renders full-page and inline variants with accessible label |
| `Sidebar` | Highlights active route and closes mobile sheet on navigation |
| `Header` | Shows user menu, language switcher, and calls logout |
| `ErrorBoundary` | Catches child render error and resets on Try again |
| `usePagination` | Clamps page, computes `totalPages`, computes `offset` |
| Layouts | Render correct nav items per role and main content outlet |

---

## 15. Acceptance Criteria

- [ ] All authenticated layouts render `Header`, `Sidebar`, and main content with role-specific navigation.
- [ ] `RootLayout` supports public pages without calling protected APIs.
- [ ] Mobile navigation opens from the correct side in LTR and RTL.
- [ ] `LanguageSwitcher` updates i18n, `localStorage`, `<html lang>`, and `<html dir>` immediately.
- [ ] `useDirection` keeps app direction synchronized on initial load and after language changes.
- [ ] `LoadingSpinner` supports inline, overlay, and full-page use cases.
- [ ] `ErrorBoundary` prevents a blank app after render errors and offers retry/home actions.
- [ ] `useToast` provides consistent success/error/info/warning helpers.
- [ ] `usePagination` handles page, page size, total pages, reset, and offset without URL coupling.
- [ ] Common components do not import feature-specific APIs or page components.
- [ ] English and Arabic keys exist for all common shell strings.
- [ ] No TypeScript errors; `pnpm build` succeeds after implementation.
