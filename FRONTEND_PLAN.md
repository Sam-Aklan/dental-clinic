# Dental Clinic Frontend — Implementation Plan

## Overview

React 19 SPA built with Vite, TypeScript strict, TailwindCSS + shadcn/ui components, react-hook-form + zod for forms, @tanstack/react-query for server state, axios for HTTP (with auto-refresh interceptor), dayjs for dates, react-i18next for bilingual EN/AR support with RTL.

**Stack**: React 19 + Vite + TypeScript strict + TailwindCSS + shadcn/ui + react-i18next + react-hook-form + zod + @tanstack/react-query + axios + dayjs + socket.io-client

**Dev Server**: `http://localhost:5173`  
**API Base URL**: `http://localhost:3000/api` (proxied in vite.config.ts)

---

## Project Structure

```
frontend/src/
├── app/
│   ├── layout.tsx              # RootLayout + app shell
│   ├── router.tsx              # route definitions
│   ├── providers.tsx           # QueryClientProvider, i18next, theme
│   └── app.tsx                 # root component
├── features/
│   ├── auth/
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── api/
│   │   │   └── auth-api.ts
│   │   └── contexts/
│   │       └── AuthContext.tsx
│   ├── booking/
│   │   ├── pages/
│   │   │   ├── BookingPage.tsx
│   │   │   └── MyAppointmentsPage.tsx
│   │   ├── components/
│   │   │   ├── DoctorSelector.tsx
│   │   │   ├── SlotPicker.tsx
│   │   │   └── AppointmentCard.tsx
│   │   ├── hooks/
│   │   │   ├── useAvailableSlots.ts
│   │   │   └── useBookAppointment.ts
│   │   └── api/
│   │       └── appointments-api.ts
│   ├── queue/
│   │   ├── pages/
│   │   │   ├── DoctorQueuePage.tsx
│   │   │   ├── StaffQueuePage.tsx
│   │   │   └── LobbyQueuePage.tsx
│   │   ├── components/
│   │   │   ├── QueueList.tsx
│   │   │   ├── QueueItem.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── hooks/
│   │   │   └── useQueueSocket.ts
│   │   └── api/
│   │       └── queue-api.ts
│   ├── waitlist/
│   │   ├── pages/
│   │   │   ├── MyWaitlistPage.tsx
│   │   │   └── WaitlistOfferPage.tsx
│   │   ├── components/
│   │   │   ├── WaitlistEntryCard.tsx
│   │   │   └── OfferModal.tsx
│   │   ├── hooks/
│   │   │   └── useWaitlist.ts
│   │   └── api/
│   │       └── waitlist-api.ts
│   ├── admin/
│   │   ├── pages/
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── ClinicSettingsPage.tsx
│   │   │   ├── DoctorsManagementPage.tsx
│   │   │   ├── UsersManagementPage.tsx
│   │   │   └── AuditLogPage.tsx
│   │   ├── components/
│   │   │   ├── AnalyticsCards.tsx
│   │   │   ├── TrendsChart.tsx
│   │   │   └── HolidayForm.tsx
│   │   ├── hooks/
│   │   │   └── useAnalytics.ts
│   │   └── api/
│   │       └── admin-api.ts
│   ├── profile/
│   │   ├── pages/
│   │   │   └── ProfilePage.tsx
│   │   ├── components/
│   │   │   ├── ProfileForm.tsx
│   │   │   └── ChangePasswordForm.tsx
│   │   ├── hooks/
│   │   │   └── useProfile.ts
│   │   └── api/
│   │       └── users-api.ts
│   └── common/
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── Sidebar.tsx
│       │   ├── LanguageSwitcher.tsx
│       │   ├── LoadingSpinner.tsx
│       │   ├── ErrorBoundary.tsx
│       │   └── NotFound.tsx
│       ├── hooks/
│       │   ├── useDirection.ts
│       │   ├── useToast.ts
│       │   └── usePagination.ts
│       └── layouts/
│           ├── RootLayout.tsx
│           ├── PatientLayout.tsx
│           ├── DoctorLayout.tsx
│           ├── ReceptionistLayout.tsx
│           └── AdminLayout.tsx
├── lib/
│   ├── api.ts                  # axios instance + interceptors
│   ├── queryClient.ts          # @tanstack/react-query setup
│   ├── i18n.ts                 # react-i18next config
│   ├── date-utils.ts           # dayjs helpers
│   └── socket.ts               # socket.io-client setup
├── types/
│   ├── api.ts                  # DTO types (auto-generated or manual)
│   ├── common.ts               # common types
│   └── domain.ts               # domain models
├── hooks/
│   ├── useApi.ts               # generic query hook wrapper
│   └── useMutation.ts          # generic mutation hook wrapper
├── i18n/
│   ├── en.json                 # English translations
│   └── ar.json                 # Arabic translations
├── styles/
│   ├── globals.css             # Tailwind + custom globals
│   └── animations.css          # custom animations
├── utils/
│   ├── classnames.ts           # cn() helper (clsx + tailwind-merge)
│   ├── format.ts               # formatting helpers
│   └── validation.ts           # form validation schemas (zod)
└── main.tsx                    # entry point
```

---

## Pages by Role

### Public Pages

| Path | Page Component | Description |
|---|---|---|
| `/` | `LandingPage` | Landing page with marketing copy + CTA buttons (register/login). Lobby queue link. |
| `/login` | `LoginPage` | Email + password form. "Forgot password" + "Sign up" links. |
| `/register` | `RegisterPage` | Patient self-registration: name, email, password, phone, DOB. |
| `/forgot-password` | `ForgotPasswordPage` | Email input → "Check your email" message. |
| `/reset-password` | `ResetPasswordPage` | Token from query string + new password form. |
| `/lobby/:doctorId` | `LobbyQueuePage` | Read-only real-time queue (public kiosk token auth). |

### Authenticated Pages (All Roles)

| Path | Page | Description |
|---|---|---|
| `/me` | `ProfilePage` | View + edit own profile, change password, language preference. |

### Patient Pages

| Path | Page | Description |
|---|---|---|
| `/book` | `BookingPage` | Doctor selector → calendar → available slots → confirm booking. |
| `/appointments` | `MyAppointmentsPage` | List upcoming + past appointments; cancel button (24h rule enforced). |
| `/waitlist` | `MyWaitlistPage` | Active waitlist entries; join/leave; edit availability window. |
| `/offers/:offerId` | `WaitlistOfferPage` | Accept or decline a pending offer (emailed link). |

### Doctor Pages

| Path | Page | Description |
|---|---|---|
| `/doctor/queue` | `DoctorQueuePage` | Live queue; status transition buttons (confirm → in-progress → complete); add notes. |
| `/doctor/today` | `DoctorTodayPage` | Today's schedule view; booked slots, no-shows, gaps. |

### Receptionist / Admin Pages

| Path | Page | Description |
|---|---|---|
| `/staff/queue` | `StaffQueuePage` | Multi-doctor queue dashboard; filters by doctor/status. |
| `/staff/appointments` | `AppointmentsAdminPage` | Search/filter appointments; cancel (override 24h rule); reschedule. |
| `/staff/patients` | `PatientsPage` | Search patients; view profile + appointment history. |
| `/staff/walkin` | `WalkInBookingPage` | Book on behalf of patient (override rules). |

### Admin Pages

| Path | Page | Description |
|---|---|---|
| `/admin/dashboard` | `AdminDashboardPage` | Analytics: trends, status distribution, doctor utilization, follow-ups. |
| `/admin/settings/clinic` | `ClinicSettingsPage` | Working hours per weekday, holidays, slot duration, timezone. |
| `/admin/settings/doctors` | `DoctorsAdminPage` | Manage doctor profiles + per-doctor schedule overrides. |
| `/admin/settings/users` | `UsersAdminPage` | List/edit/disable users; assign roles. |
| `/admin/audit` | `AuditLogPage` | Filterable audit-log table. |

### Error Pages

| Path | Component | Reason |
|---|---|---|
| `/403` | `ForbiddenPage` | Role check failed. |
| `*` | `NotFoundPage` | 404. |

---

## Key Components & Hooks

### Auth Context & Hooks

**`AuthContext`**: Holds `user`, `isLoading`, `isAuthenticated`, provides login/logout/refresh methods.

**`useAuth()`**: Returns `{ user, isLoading, isAuthenticated, login, logout, register }`.

**`ProtectedRoute`**: Checks auth + role; redirects to `/login` if unauthenticated or role mismatch.

---

### Layout Shells

Each role gets a dedicated layout with navigation sidebar/header:

- **`RootLayout`** — public pages
- **`PatientLayout`** — patient nav (booking, appointments, waitlist, profile)
- **`DoctorLayout`** — doctor nav (queue, today's schedule)
- **`ReceptionistLayout`** — receptionist nav (queue, appointments, patients, walk-in)
- **`AdminLayout`** — admin nav (dashboard, clinic settings, users, audit)

All layouts include `LanguageSwitcher` + `<html dir>` toggle.

---

### Utility Hooks

**`useDirection()`**: Returns `'ltr'` or `'rtl'` based on current language. Updates `<html dir>`.

**`useToast()`**: Toast notifications (via sonner or custom).

**`usePagination()`**: Handles pagination state (page, pageSize, total).

**`useApi()`**: Generic wrapper around useQuery for GET endpoints (handles loading, error, refetch).

**`useMutation()`**: Generic wrapper around useMutation for POST/PATCH/DELETE (handles loading, error, optimistic updates).

---

### Form Components

All forms use `react-hook-form` + `zod` schemas:

- **`LoginForm`**: email, password
- **`RegisterForm`**: firstName, lastName, email, password, phone, DOB
- **`ChangePasswordForm`**: currentPassword, newPassword, confirmPassword
- **`ProfileForm`**: firstName, lastName, phone, DOB, languagePreference
- **`HolidayForm`**: date, name
- **`WorkingHourForm`**: dayOfWeek, startTime, endTime

---

### Display Components

- **`QueueList` / `QueueItem`**: Real-time queue with status badge
- **`AppointmentCard`**: Appointment summary (doctor, time, status, actions)
- **`WaitlistEntryCard`**: Waitlist summary (doctor, availability window, position)
- **`OfferModal`**: Accept/decline waitlist offer with countdown
- **`StatusBadge`**: Color-coded appointment status
- **`AnalyticsCards`**: KPI cards (total, completed, canceled, etc.)
- **`TrendsChart`**: Chart.js or Recharts showing appointment trends

---

## Dashboards, KPIs & Data Visuals (by Role)

Each role has a dedicated analytics surface. All charts use **Recharts**. All data tables use **@tanstack/react-table** with sorting, pagination, and column filtering built in. Date ranges default to the current calendar month and are controlled by a `DateRangePicker` (dayjs-backed).

---

### Admin Dashboard (`/admin/dashboard`)

#### KPI Cards — row of 6 stat cards at the top

| Card | Metric | Calculation | Colour |
|---|---|---|---|
| Total Appointments | Count for selected period | All statuses except CANCELED | Blue |
| Completed | Count for period | status = COMPLETED | Green |
| Cancellation Rate | % of total | CANCELED / total | Amber |
| No-Show Rate | % of total | NO_SHOW / total | Red |
| Active Patients | Unique patients | ≥1 appointment in last 90 days | Purple |
| Waitlist Size | Current entries | Active WaitlistEntry rows | Teal |

Each card shows: current value, delta vs previous period (↑/↓ %), and a small sparkline.

#### Charts

| Chart | Type | Data | Filters |
|---|---|---|---|
| **Appointment Trends** | Line (multi-series) | Daily/weekly/monthly count split by status (CONFIRMED, COMPLETED, CANCELED) | Date range, bucket (day/week/month) |
| **Status Distribution** | Donut | Count per AppointmentStatus for the period | Date range |
| **Doctor Utilization** | Horizontal bar | Each doctor's utilization % = (CONFIRMED + IN_PROGRESS + COMPLETED) / total_available_slots | Date range |
| **Busiest Days of Week** | Bar | Appointments grouped by weekday (Sun–Sat) | Date range |
| **Cancellation Trend** | Line | Daily cancellation count over time | Date range |

Clicking a bar/slice in any chart applies that filter to the **Appointments data table** below.

#### Data Tables

**1. Appointments Table** — full searchable table of all appointments.

| Column | Sortable | Filterable |
|---|---|---|
| Date & Time | ✅ | Date range picker |
| Doctor | ✅ | Multi-select dropdown |
| Patient name | — | Text search |
| Status | ✅ | Multi-select (status enum) |
| Booked at | ✅ | — |
| Actions | — | — (Cancel button) |

Pagination: 20 rows/page. Export to CSV button.

**2. Follow-ups Table** — patients needing recall.

| Column | Notes |
|---|---|
| Patient name | — |
| Last appointment | Date of most recent COMPLETED |
| Days since | Computed: today − lastAppt |
| Upcoming | Has future CONFIRMED? (Yes/No badge) |
| Action | "Book for them" → walks to Walk-In booking with patient pre-filled |

**3. Waitlist Table**

| Column | Notes |
|---|---|
| Position | In doctor's waitlist |
| Patient name | — |
| Doctor | — |
| Available from/until | HH:MM – HH:MM |
| On waitlist since | createdAt |
| Action | Remove button |

---

### Doctor Dashboard / Today's Schedule (`/doctor/today`)

#### KPI Cards — row of 5 stat cards

| Card | Metric |
|---|---|
| Today's Total | My appointments today (all statuses) |
| Completed | status = COMPLETED today |
| Remaining | CONFIRMED & startsAt > now, today |
| In Session | status = IN_PROGRESS |
| No-Shows | status = NO_SHOW today |

#### Charts

| Chart | Type | Data | Notes |
|---|---|---|---|
| **My Week at a Glance** | Bar | My appointment count per day for the current week | Bars coloured by primary status of that day |
| **My Status Distribution** | Donut | My appointments this month split by status | Same palette as global StatusBadge |
| **My Hourly Load** | Bar | My appointments grouped by hour of day (current month) | Identifies peak session times |

#### Data Tables

**Today's Schedule Table** (primary view on `/doctor/today`)

| Column | Notes |
|---|---|
| Time | startsAt formatted in clinic timezone |
| Patient # | Sequential position number (no name — privacy) |
| Status | StatusBadge component |
| Duration | endsAt − startsAt in minutes |
| Notes | Truncated; expandable |
| Actions | Transition buttons (confirm / start / complete / no-show) |

Rows are sorted by `startsAt` ascending. The currently IN_PROGRESS row is highlighted with a green left border.

**This Week's Appointments Table** (secondary tab on the same page)

| Column | Notes |
|---|---|
| Date | Day label (Mon 5 May) |
| Time | startsAt |
| Patient # | Sequential position |
| Status | StatusBadge |
| Notes | Editable inline |

---

### Receptionist Dashboard — Queue & Appointments (`/staff/queue`, `/staff/appointments`)

#### KPI Cards — banner row of 6 at the top of `/staff/queue`

| Card | Metric |
|---|---|
| Today's Total | All appointments today across all doctors |
| In Session | IN_PROGRESS count right now |
| Waiting | CONFIRMED & startsAt ≤ now + 30min |
| Completed Today | COMPLETED count today |
| Cancellations Today | CANCELED today |
| Pending Confirmation | PENDING status count |

Cards auto-refresh every 30 seconds (or via Socket.IO push).

#### Charts

| Chart | Type | Data | Notes |
|---|---|---|---|
| **Today by Doctor** | Grouped bar | Each doctor — bars for CONFIRMED, IN_PROGRESS, COMPLETED, CANCELED counts today | Clicking a bar filters the appointments table to that doctor |
| **Today's Status Overview** | Donut | Total today split by status | Quick visual of how the day is going |

Both charts use live data (refetch every 60s or triggered by `queue.updated` Socket.IO events).

#### Data Tables

**1. All Appointments Today** (main table on `/staff/appointments` with date defaulting to today)

| Column | Sortable | Filterable |
|---|---|---|
| Time | ✅ | — |
| Doctor | ✅ | Multi-select |
| Patient name | — | Text search |
| Status | ✅ | Multi-select |
| Booked by | — | — |
| Actions | — | Cancel (override 24h) / Reschedule / Mark No-Show |

Inline action buttons trigger confirmation dialogs before acting. After action, both the table row and queue Socket.IO room update immediately.

**2. Upcoming Appointments** (date range picker, defaults today → +7 days)

Same columns as above. Useful for forward planning and calling patients.

**3. Active Waitlist Entries**

| Column | Notes |
|---|---|
| Position | In doctor's queue |
| Patient name | — |
| Doctor | — |
| Available window | HH:MM – HH:MM |
| Since | How long on waitlist |
| Actions | Remove entry |

---

### Shared Components for All Dashboards

| Component | File | Notes |
|---|---|---|
| `KpiCard` | `features/common/components/KpiCard.tsx` | Value, label, delta badge, optional sparkline |
| `Sparkline` | `features/common/components/Sparkline.tsx` | 7-day mini line chart inside KpiCard |
| `DateRangePicker` | `features/common/components/DateRangePicker.tsx` | dayjs-backed start/end date inputs |
| `DataTable` | `features/common/components/DataTable.tsx` | @tanstack/react-table wrapper — sorting, pagination, column filter |
| `TrendsChart` | `features/admin/components/TrendsChart.tsx` | Recharts LineChart with multi-series |
| `DonutChart` | `features/admin/components/DonutChart.tsx` | Recharts PieChart in donut mode |
| `BarChart` | `features/admin/components/BarChart.tsx` | Recharts BarChart (horizontal and vertical variants) |
| `AnalyticsCards` | `features/admin/components/AnalyticsCards.tsx` | Grid of KpiCards — takes array of metric configs |
| `ExportCsvButton` | `features/common/components/ExportCsvButton.tsx` | Triggers server-side CSV or client-side table export |

#### React Query keys for analytics

```typescript
['analytics', 'trends', { from, to, bucket }]
['analytics', 'status-distribution', { from, to }]
['analytics', 'doctor-utilization', { from, to }]
['analytics', 'today-summary']                     // receptionist
['analytics', 'today-by-doctor']                   // receptionist
['analytics', 'my-stats', { date }]                // doctor (own)
['analytics', 'my-trends', { week }]               // doctor (own)
['analytics', 'follow-ups', { thresholdDays }]
['analytics', 'waitlist-summary']
```

All analytics queries have `staleTime: 60_000` (1 minute) and `refetchInterval: 60_000` so dashboards stay current without hammering the server.

---

## API Integration

All API calls are made via **axios** (configured in `lib/api.ts`).

### Auto-Refresh Interceptor

```typescript
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      try {
        await api.post('/auth/refresh');
        return api(error.config);  // retry with new token
      } catch {
        window.location.href = '/login';
      }
    }
    throw error;
  },
);
```

### API Layer Pattern

Each feature has an `api/<feature>-api.ts` file that exports functions wrapping axios calls:

```typescript
// features/booking/api/appointments-api.ts
export async function getAvailableSlots(doctorId: string, from: Date, to: Date) {
  const { data } = await api.get('/appointments/slots', {
    params: { doctorId, from: from.toISOString(), to: to.toISOString() }
  });
  return data.data;  // unwrap { data, statusCode }
}

export async function bookAppointment(payload: CreateAppointmentDTO) {
  const { data } = await api.post('/appointments', payload, {
    headers: { 'Idempotency-Key': generateIdempotencyKey() }
  });
  return data.data;
}
```

### React Query Integration

```typescript
// features/booking/hooks/useAvailableSlots.ts
export function useAvailableSlots(doctorId: string, from: Date, to: Date) {
  return useQuery({
    queryKey: ['slots', doctorId, from, to],
    queryFn: () => getAvailableSlots(doctorId, from, to),
    enabled: !!doctorId,
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAppointmentDTO) => bookAppointment(payload),
    onSuccess: (newAppointment) => {
      // optimistic update or invalidate
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
```

### Socket.IO Integration

```typescript
// lib/socket.ts
export const queueSocket = io(`${API_URL}/queue`, {
  auth: (cb) => {
    const token = localStorage.getItem('accessToken');
    cb({ token });
  },
  reconnection: true,
});

// features/queue/hooks/useQueueSocket.ts
export function useQueueSocket(doctorId: string) {
  useEffect(() => {
    queueSocket.emit('queue.subscribe', { doctorId });
    const onUpdate = (data) => {
      // update local state, trigger re-render
    };
    queueSocket.on('queue.updated', onUpdate);
    return () => {
      queueSocket.off('queue.updated', onUpdate);
      queueSocket.emit('queue.unsubscribe', { doctorId });
    };
  }, [doctorId]);
}
```

---

## Internationalization (i18n)

### Setup (react-i18next)

```typescript
// lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from '../i18n/en.json';
import arTranslations from '../i18n/ar.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    ar: { translation: arTranslations },
  },
  lng: localStorage.getItem('language') || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});
```

### Usage

```typescript
import { useTranslation } from 'react-i18next';

export function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <p>{t('appointment.confirm')}</p>
      <button onClick={() => {
        i18n.changeLanguage('ar');
        localStorage.setItem('language', 'ar');
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
      }}>
        Arabic
      </button>
    </div>
  );
}
```

### RTL Support

- All layout uses logical properties: `margin-inline-start`, `padding-inline-end`, `text-start`, `flex-start`
- Icons are mirrored in RTL via CSS `scaleX(-1)` where appropriate
- `<html dir="rtl">` set on language change
- Tailwind config includes RTL variants if needed

### Translation Keys

All user-visible strings organized by feature:

```json
{
  "auth": {
    "login": "Login",
    "register": "Register",
    "email": "Email",
    "password": "Password"
  },
  "booking": {
    "selectDoctor": "Select Doctor",
    "selectDate": "Select Date",
    "availableSlots": "Available Slots"
  },
  ...
}
```

---

## Forms & Validation

All forms use **`react-hook-form`** + **`zod`** schemas:

```typescript
// utils/validation.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// features/auth/components/LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate: login, isPending } = useLogin();

  return (
    <form onSubmit={handleSubmit((data) => login(data))}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <button type="submit" disabled={isPending}>Login</button>
    </form>
  );
}
```

---

## State Management

- **Auth state**: AuthContext (user, token, role)
- **Server state**: @tanstack/react-query (appointments, doctors, analytics, etc.)
- **UI state**: React useState (modals, filters, pagination)
- **Real-time state**: Socket.IO listeners (queue updates)

No Redux or Zustand needed; Context + React Query covers the requirements.

---

## Date & Time Handling

All dates use **`dayjs`** with timezone support:

```typescript
// lib/date-utils.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const clinicTz = 'America/New_York';  // from clinic config

export function formatAppointmentTime(iso: string, locale: string) {
  return dayjs(iso).tz(clinicTz).locale(locale).format('YYYY-MM-DD HH:mm');
}

export function isSlotAvailable(slot: Date) {
  return dayjs(slot).tz(clinicTz).isAfter(dayjs().tz(clinicTz));
}
```

---

## Testing

**Unit Tests** (Vitest):
- Form components: render, validation, submission
- Hooks: useAuth, useAvailableSlots, useDirection
- Utility functions: date formatting, validation schemas

**Component Tests** (React Testing Library):
- LoginPage: render form, submit, handles error
- BookingPage: doctor selector, slot picker, confirmation
- QueueList: renders items, responds to socket updates

**E2E Tests** (Playwright):
- Register flow: fill form → submit → redirected to `/book`
- Booking flow: pick doctor → pick slot → confirm → verify in appointments
- Waitlist flow: create offer → navigate to `/offers/:id` → accept → old appt canceled
- Language switch: click AR → `<html dir="rtl">` set, strings translate

**Run tests**:
```bash
pnpm test                 # unit + component
pnpm test:ui              # test UI
pnpm coverage             # coverage report
pnpm build                # verify build succeeds
```

---

## Startup Checklist

- [ ] `pnpm install`
- [ ] `cp .env.example .env`
- [ ] `pnpm dev`
- [ ] App loads at `http://localhost:5173`
- [ ] Can navigate to `/login`, `/register`
- [ ] API requests are proxied to backend
- [ ] Language switcher flips `<html dir>` and translations
- [ ] Auth flow works: register → login → see profile
- [ ] Booking page: GET `/api/appointments/slots` returns slots
- [ ] Queue updates via Socket.IO when status changes
- [ ] Tests pass: `pnpm test`
- [ ] Build succeeds: `pnpm build`
