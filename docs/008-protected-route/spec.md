# Spec: ProtectedRoute Component

**Type**: Component (no route — wraps route elements in the router)  
**File**: `frontend/src/features/auth/components/ProtectedRoute.tsx`

---

## 1. Purpose

A route guard component that:
1. Waits for the auth check to complete before making any decision.
2. Redirects unauthenticated users to `/login` (preserving the attempted path as `?redirect=`).
3. Redirects authenticated users whose role is not in the allowed set to `/403`.
4. Renders `children` only when auth is confirmed and role matches.

Every protected route in `app/router.tsx` is wrapped with this component.

---

## 2. Props

```typescript
interface ProtectedRouteProps {
  roles?: Role[];          // allowed roles; omit to allow any authenticated user
  children: ReactNode;
}
```

- `roles` omitted → any authenticated user can access.
- `roles={['ADMIN']}` → only ADMIN; all others go to `/403`.
- `roles={['ADMIN', 'RECEPTIONIST']}` → either role is allowed.

---

## 3. Logic

```
isLoading === true
  → render <LoadingSpinner fullPage />   (auth check in progress)

isLoading === false && !isAuthenticated
  → <Navigate to={`/login?redirect=${currentPath}`} replace />

isLoading === false && isAuthenticated && roles provided && user.role not in roles
  → <Navigate to="/403" replace />

isLoading === false && isAuthenticated && (no roles or role matches)
  → render children
```

Implemented as:

```tsx
export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullPage />;
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
```

---

## 4. Usage in `app/router.tsx`

```tsx
// Any authenticated user
{ path: '/me', element: <ProtectedRoute><PatientLayout><ProfilePage /></PatientLayout></ProtectedRoute> }

// Patient only
{ path: '/book', element: <ProtectedRoute roles={['PATIENT']}><PatientLayout><BookingPage /></PatientLayout></ProtectedRoute> }

// Doctor only
{ path: '/doctor/queue', element: <ProtectedRoute roles={['DOCTOR']}><DoctorLayout><DoctorQueuePage /></DoctorLayout></ProtectedRoute> }

// Receptionist OR Admin
{ path: '/staff/queue', element: <ProtectedRoute roles={['RECEPTIONIST','ADMIN']}><ReceptionistLayout><StaffQueuePage /></ReceptionistLayout></ProtectedRoute> }

// Admin only
{ path: '/admin/dashboard', element: <ProtectedRoute roles={['ADMIN']}><AdminLayout><AdminDashboardPage /></AdminLayout></ProtectedRoute> }
```

The layout shell is placed **inside** `ProtectedRoute`, not outside. This ensures the layout (which may render user-specific nav items) only mounts after auth is confirmed.

---

## 5. `LoadingSpinner` (full-page variant)

When `ProtectedRoute` is in the loading state it renders a centred spinner that fills the viewport. This prevents a flash of the login page on app load when the user actually has a valid session.

```tsx
// Used as: <LoadingSpinner fullPage />
// Already planned in features/common/components/LoadingSpinner.tsx
// fullPage prop → fixed overlay, centered, full-screen
```

---

## 6. Redirect path encoding

The `redirect` param is URL-encoded:
```
/login?redirect=%2Fdoctor%2Fqueue
```

`LoginPage` decodes it after successful login and validates it starts with `/` before navigating. This prevents open-redirect attacks (spec covered in 002-login-page).

---

## 7. Role enum alignment

The `Role` type used in `roles` prop must stay in sync with the backend `Role` enum. Both use the same strings: `'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'PATIENT'` (defined in `types/domain.ts`).

---

## 8. File Layout

```
frontend/src/features/auth/components/
└── ProtectedRoute.tsx
```

No sub-components. Depends on:
- `useAuth` (from `features/auth/hooks/useAuth.ts`)
- `LoadingSpinner` (from `features/common/components/LoadingSpinner.tsx`)
- `Navigate`, `useLocation` from `react-router-dom`

---

## 9. Acceptance Criteria

- [ ] Accessing a protected route while `isLoading === true` shows the full-page spinner (no redirect).
- [ ] Accessing a protected route while unauthenticated redirects to `/login?redirect=<path>`.
- [ ] After logging in, the `?redirect` path is navigated to automatically.
- [ ] Accessing a role-restricted route with the wrong role redirects to `/403`.
- [ ] Accessing a role-restricted route with the correct role renders the page.
- [ ] Accessing a route with no `roles` prop while authenticated renders the page for any role.
- [ ] No flash of redirect happens when a valid session is present on app load.
- [ ] No TypeScript errors; `pnpm build` succeeds.
