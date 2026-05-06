# Spec: Auth Context, useAuth Hook & auth-api Layer

**Type**: Infrastructure (no route — used by every page)  
**Files**:
- `frontend/src/features/auth/contexts/AuthContext.tsx`
- `frontend/src/features/auth/hooks/useAuth.ts`
- `frontend/src/features/auth/api/auth-api.ts`
- `frontend/src/lib/api.ts` (axios instance + auto-refresh interceptor)

---

## 1. Purpose

Provide the global authentication state and all auth operations to the entire app. Every page that needs to know "who is logged in" or needs to perform login/logout/register consumes this layer. The axios interceptor ensures expired access tokens are transparently refreshed on any API call.

---

## 2. Data Shape

### 2.1 User type (`types/domain.ts`)

```typescript
export type Role = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'PATIENT';
export type Locale = 'EN' | 'AR';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  preferredLocale: Locale;
  isActive: boolean;
}
```

### 2.2 AuthContext value type

```typescript
interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;           // true while initial /auth/me call is in flight
  isAuthenticated: boolean;     // derived: !!user

  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;  // re-fetch /auth/me (e.g. after profile update)
}
```

---

## 3. AuthContext (`AuthContext.tsx`)

### 3.1 State

```typescript
const [user, setUser] = useState<AuthUser | null>(null);
const [isLoading, setIsLoading] = useState(true);
```

`isLoading` starts `true` so `ProtectedRoute` can wait before making a redirect decision.

### 3.2 Initial auth check (on mount)

```typescript
useEffect(() => {
  getCurrentUser()           // GET /auth/me
    .then(setUser)
    .catch(() => setUser(null))
    .finally(() => setIsLoading(false));
}, []);
```

- If the request succeeds: user is authenticated; set `user`.
- If 401: user is not authenticated; `user = null`.
- The HTTP-only refresh cookie is sent automatically by the browser; the axios interceptor (see §5) retries once before propagating the 401.

### 3.3 `login(email, password)`

```typescript
async function login(email: string, password: string) {
  const { user } = await loginUser(email, password);  // POST /auth/login
  setUser(user);
  // access token is stored in memory by auth-api (see §4)
}
```

### 3.4 `register(payload)`

```typescript
async function register(payload: RegisterPayload) {
  const { user } = await registerUser(payload);  // POST /auth/register
  setUser(user);
}
```

### 3.5 `logout()`

```typescript
async function logout() {
  await logoutUser();        // POST /auth/logout — clears server-side refresh token + cookie
  setUser(null);
  clearAccessToken();        // wipe in-memory token
}
```

### 3.6 `refreshUser()`

```typescript
async function refreshUser() {
  const updated = await getCurrentUser();
  setUser(updated);
}
```

Called after a profile update to keep `AuthContext` in sync without forcing re-login.

### 3.7 Provider

```tsx
export function AuthProvider({ children }: { children: ReactNode }) {
  // ... state and functions above ...
  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

`AuthProvider` is mounted in `app/providers.tsx`, wrapping the entire router.

---

## 4. auth-api.ts

Pure async functions — no React hooks. Each one calls the axios instance from `lib/api.ts`.

```typescript
// POST /auth/login
export async function loginUser(email: string, password: string): Promise<{ user: AuthUser }> {
  const { data } = await api.post<ApiResponse<LoginResponseDTO>>('/auth/login', { email, password });
  setAccessToken(data.data.accessToken);  // store in memory
  return { user: data.data.user };
}

// POST /auth/register
export async function registerUser(payload: RegisterPayload): Promise<{ user: AuthUser }> {
  const { data } = await api.post<ApiResponse<LoginResponseDTO>>('/auth/register', payload);
  setAccessToken(data.data.accessToken);
  return { user: data.data.user };
}

// POST /auth/logout
export async function logoutUser(): Promise<void> {
  await api.post('/auth/logout');
}

// GET /auth/me
export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await api.get<ApiResponse<AuthUser>>('/auth/me');
  return data.data;
}

// POST /auth/forgot-password
export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

// POST /auth/reset-password
export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password });
}
```

### Token storage strategy

Access tokens are stored **in memory only** (a module-level variable), not in `localStorage`, to reduce XSS exposure.

```typescript
// lib/api.ts (or auth-api.ts — pick one location and keep it there)
let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export function clearAccessToken() {
  setAccessToken(null);
}
```

> **Trade-off**: Storing in memory means the token is lost on page refresh, so `GET /auth/me` relies on the HTTP-only refresh cookie to re-issue a new access token on app load. This is the intended flow.

---

## 5. axios instance & auto-refresh interceptor (`lib/api.ts`)

```typescript
import axios from 'axios';
import { setAccessToken } from './tokenStore';  // or co-located

export const api = axios.create({
  baseURL: '/api',       // proxied to http://localhost:3000/api by Vite
  withCredentials: true, // send HTTP-only refresh cookie on every request
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Only handle 401; avoid infinite loop by checking _retry flag
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh attempts on the refresh endpoint itself (prevents loop)
    if (originalRequest.url === '/auth/refresh') {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue all requests that arrive while a refresh is in flight
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const { data } = await api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
      const newToken = data.data.accessToken;
      setAccessToken(newToken);
      processQueue(null, newToken);
      originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      setAccessToken(null);
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
```

Key behaviours:
- `withCredentials: true` ensures the HTTP-only refresh cookie is sent automatically.
- Queue pattern prevents multiple simultaneous 401s from each triggering a separate refresh call.
- If the refresh itself fails (cookie expired/revoked), redirect to `/login`.

---

## 6. useAuth hook (`hooks/useAuth.ts`)

```typescript
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

A thin wrapper that adds a dev-time guard. All consuming components import `useAuth`, never `AuthContext` directly.

---

## 7. Provider placement (`app/providers.tsx`)

```tsx
export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

`AuthProvider` sits inside `QueryClientProvider` so auth mutations can use React Query if needed later, but `AuthContext` itself uses plain `useState` (not React Query) to avoid circular dependencies with the axios interceptor.

---

## 8. Language preference sync

After login/register, if `user.preferredLocale` differs from the current i18n language, sync them:

```typescript
// Inside AuthProvider, after setUser():
if (user.preferredLocale) {
  const lang = user.preferredLocale.toLowerCase(); // 'EN' → 'en'
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}
```

---

## 9. TypeScript types (`types/api.ts`)

```typescript
export interface ApiResponse<T> {
  data: T;
  statusCode: number;
}

export interface LoginResponseDTO {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  dateOfBirth?: string;  // YYYY-MM-DD
}
```

---

## 10. File Layout Summary

```
frontend/src/
├── features/auth/
│   ├── contexts/
│   │   └── AuthContext.tsx        # AuthProvider + AuthContext
│   ├── hooks/
│   │   └── useAuth.ts             # thin useContext wrapper
│   └── api/
│       └── auth-api.ts            # loginUser, registerUser, logoutUser, getCurrentUser, …
├── lib/
│   └── api.ts                     # axios instance + refresh interceptor + token helpers
└── types/
    ├── api.ts                     # ApiResponse<T>, LoginResponseDTO, RegisterPayload
    └── domain.ts                  # AuthUser, Role, Locale
```

---

## 11. Acceptance Criteria

- [ ] On app load, `AuthProvider` calls `GET /auth/me`; `isLoading` is `true` until response.
- [ ] If `/auth/me` succeeds, `user` is set and `isAuthenticated === true`.
- [ ] If `/auth/me` returns 401, `user === null` and `isAuthenticated === false`.
- [ ] `login()` calls `POST /auth/login`, sets `user`, stores access token in memory.
- [ ] `logout()` calls `POST /auth/logout`, clears `user` and access token.
- [ ] A 401 response from any endpoint triggers one silent refresh attempt; the original request is retried automatically.
- [ ] If refresh fails, user is redirected to `/login` and access token is cleared.
- [ ] Concurrent 401s queue up; only one refresh call is made.
- [ ] After login/register, `i18n` language syncs to `user.preferredLocale`.
- [ ] `useAuth()` throws a clear error if called outside `AuthProvider`.
- [ ] No TypeScript errors; `pnpm build` succeeds.
