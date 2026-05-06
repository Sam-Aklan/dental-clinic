# Frontend Development Progress

Track completion of frontend pages, components, and features. Each row links to the plan and implementation status.

**Legend**: 🔴 = Not started · 🟡 = Spec written, implementation pending · 🟠 = In progress · 🟢 = Complete

---

## Specifications Written

| # | Feature / Page | Spec File | Status |
|---|---------------|-----------|--------|
| 001 | Landing Page (Marketing) | [specs/001-landing-page/spec.md](specs/001-landing-page/spec.md) | ✅ Done |
| 002 | Login Page | [specs/002-login-page/spec.md](specs/002-login-page/spec.md) | ✅ Done |
| 003 | Register Page | [specs/003-register-page/spec.md](specs/003-register-page/spec.md) | ✅ Done |
| 004 | Forgot Password Page | [specs/004-forgot-password-page/spec.md](specs/004-forgot-password-page/spec.md) | ✅ Done |
| 005 | Reset Password Page | [specs/005-reset-password-page/spec.md](specs/005-reset-password-page/spec.md) | ✅ Done |
| 006 | Lobby Queue Page (Kiosk) | [specs/006-lobby-queue-page/spec.md](specs/006-lobby-queue-page/spec.md) | ✅ Done |
| 007 | Auth Context, useAuth & auth-api | [specs/007-auth-context-and-hooks/spec.md](specs/007-auth-context-and-hooks/spec.md) | ✅ Done |
| 008 | ProtectedRoute Component | [specs/008-protected-route/spec.md](specs/008-protected-route/spec.md) | ✅ Done |
| 009 | Profile Page (`/me`) | [specs/009-profile-page/spec.md](specs/009-profile-page/spec.md) | ✅ Done |
| 010 | Booking Page (`/book`) | [specs/010-booking-page/spec.md](specs/010-booking-page/spec.md) | ✅ Done |
| 011 | My Appointments Page (`/appointments`) | [specs/011-my-appointments-page/spec.md](specs/011-my-appointments-page/spec.md) | ✅ Done |
| 012 | My Waitlist Page (`/waitlist`) | [specs/012-my-waitlist-page/spec.md](specs/012-my-waitlist-page/spec.md) | ✅ Done |
| 013 | Waitlist Offer Page (`/offers/:offerId`) | [specs/013-waitlist-offer-page/spec.md](specs/013-waitlist-offer-page/spec.md) | ✅ Done |
| 014 | Staff Queue Page (`/staff/queue`) | [specs/014-staff-queue-page/spec.md](specs/014-staff-queue-page/spec.md) | ✅ Done |
| 015 | Appointments Admin Page (`/staff/appointments`) | [specs/015-appointments-admin-page/spec.md](specs/015-appointments-admin-page/spec.md) | ✅ Done |
| 016 | Patients Page (`/staff/patients`) | [specs/016-patients-page/spec.md](specs/016-patients-page/spec.md) | ✅ Done |
| 017 | Walk-In Booking Page (`/staff/walkin`) | [specs/017-walk-in-booking-page/spec.md](specs/017-walk-in-booking-page/spec.md) | ✅ Done |
| 018 | Admin Dashboard Page (`/admin/dashboard`) | [specs/018-admin-dashboard-page/spec.md](specs/018-admin-dashboard-page/spec.md) | ✅ Done |
| 019 | Clinic Settings Page (`/admin/settings/clinic`) | [specs/019-clinic-settings-page/spec.md](specs/019-clinic-settings-page/spec.md) | ✅ Done |
| 020 | Doctors Admin Page (`/admin/settings/doctors`) | [specs/020-doctors-admin-page/spec.md](specs/020-doctors-admin-page/spec.md) | ✅ Done |
| 021 | Users Admin Page (`/admin/settings/users`) | [specs/021-users-admin-page/spec.md](specs/021-users-admin-page/spec.md) | ✅ Done |
| 022 | Audit Log Page (`/admin/audit`) | [specs/022-audit-log-page/spec.md](specs/022-audit-log-page/spec.md) | ✅ Done |
| 023 | Doctor Queue Page (`/doctor/queue`) | [specs/023-doctor-queue-page/spec.md](specs/023-doctor-queue-page/spec.md) | ✅ Done |
| 024 | Doctor Today Page (`/doctor/today`) | [specs/024-doctor-today-page/spec.md](specs/024-doctor-today-page/spec.md) | ✅ Done |
| 025 | Error Pages (`/403`, `*`) | [specs/025-error-pages/spec.md](specs/025-error-pages/spec.md) | ✅ Done |
| 026 | Common Components, Layouts & Hooks | [specs/026-common-components/spec.md](specs/026-common-components/spec.md) | ✅ Done |

> Add a row here each time a spec is written. Implementation progress is tracked in the tables below.

---

## Pages Implementation Status

### Public Pages

| Route | Page Component | Spec | Status | Notes |
|-------|----------------|------|--------|-------|
| `/` | `LandingPage` | [spec](specs/001-landing-page/spec.md) | 🟡 | Spec complete — implementation not started |
| `/login` | `LoginPage` | [spec](specs/002-login-page/spec.md) | 🟡 | Spec complete — implementation not started |
| `/register` | `RegisterPage` | [spec](specs/003-register-page/spec.md) | 🟡 | Spec complete — implementation not started |
| `/forgot-password` | `ForgotPasswordPage` | [spec](specs/004-forgot-password-page/spec.md) | 🟡 | Spec complete — implementation not started |
| `/reset-password` | `ResetPasswordPage` | [spec](specs/005-reset-password-page/spec.md) | 🟡 | Spec complete — implementation not started |
| `/lobby/:doctorId` | `LobbyQueuePage` | [spec](specs/006-lobby-queue-page/spec.md) | 🟡 | Spec complete — implementation not started |

### Authenticated Pages (All Roles)

| Route | Page Component | Spec | Status | Notes |
|-------|----------------|------|--------|-------|
| `/me` | `ProfilePage` | [spec](specs/009-profile-page/spec.md) | 🟡 | Spec complete — implementation not started |

### Patient Pages

| Route | Page Component | Spec | Status | Notes |
|-------|----------------|------|--------|-------|
| `/book` | `BookingPage` | [spec](specs/010-booking-page/spec.md) | 🟡 | Spec complete — implementation not started |
| `/appointments` | `MyAppointmentsPage` | [spec](specs/011-my-appointments-page/spec.md) | 🟡 | Spec complete — implementation not started |
| `/waitlist` | `MyWaitlistPage` | [spec](specs/012-my-waitlist-page/spec.md) | 🟡 | Spec complete — implementation not started |
| `/offers/:offerId` | `WaitlistOfferPage` | [spec](specs/013-waitlist-offer-page/spec.md) | 🟡 | Spec complete — implementation not started |

### Doctor Pages

| Route | Page Component | Spec | Status | Notes |
|-------|----------------|------|--------|-------|
| `/doctor/queue` | `DoctorQueuePage` | [spec](specs/023-doctor-queue-page/spec.md) | 🟡 | Spec complete — live own-doctor queue, status transitions, notes implementation pending |
| `/doctor/today` | `DoctorTodayPage` | [spec](specs/024-doctor-today-page/spec.md) | 🟡 | Spec complete — schedule dashboard, KPIs, charts, weekly table implementation pending |

### Receptionist / Admin Pages

| Route | Page Component | Spec | Status | Notes |
|-------|----------------|------|--------|-------|
| `/staff/queue` | `StaffQueuePage` | [spec](specs/014-staff-queue-page/spec.md) | 🟡 | Spec complete — multi-doctor live queue dashboard implementation pending |
| `/staff/appointments` | `AppointmentsAdminPage` | [spec](specs/015-appointments-admin-page/spec.md) | 🟡 | Spec complete — search/filter/cancel/reschedule implementation pending |
| `/staff/patients` | `PatientsPage` | [spec](specs/016-patients-page/spec.md) | 🟡 | Spec complete — implementation pending; backend receptionist patient-search permission needed |
| `/staff/walkin` | `WalkInBookingPage` | [spec](specs/017-walk-in-booking-page/spec.md) | 🟡 | Spec complete — implementation pending; backend staff `patientId` booking payload needed |

### Admin Pages

| Route | Page Component | Spec | Status | Notes |
|-------|----------------|------|--------|-------|
| `/admin/dashboard` | `AdminDashboardPage` | [spec](specs/018-admin-dashboard-page/spec.md) | 🟡 | Spec complete — analytics dashboard implementation pending |
| `/admin/settings/clinic` | `ClinicSettingsPage` | [spec](specs/019-clinic-settings-page/spec.md) | 🟡 | Spec complete — working hours, holidays, slot duration implementation pending |
| `/admin/settings/doctors` | `DoctorsAdminPage` | [spec](specs/020-doctors-admin-page/spec.md) | 🟡 | Spec complete — doctor profiles + schedule overrides implementation pending |
| `/admin/settings/users` | `UsersAdminPage` | [spec](specs/021-users-admin-page/spec.md) | 🟡 | Spec complete — user role/status management implementation pending |
| `/admin/audit` | `AuditLogPage` | [spec](specs/022-audit-log-page/spec.md) | 🟡 | Spec complete — filterable audit-log table implementation pending |

### Error Pages

| Route | Component | Spec | Status | Notes |
|-------|-----------|------|--------|-------|
| `/403` | `ForbiddenPage` | [spec](specs/025-error-pages/spec.md) | 🟡 | Spec complete — role-denied recovery page implementation pending |
| `*` | `NotFoundPage` | [spec](specs/025-error-pages/spec.md) | 🟡 | Spec complete — wildcard 404 recovery page implementation pending |

**Legend**: 🔴 = Not started, 🟡 = Spec written / implementation pending, 🟠 = In progress, 🟢 = Complete

---

## Components & Hooks Implementation

### Core Hooks

| Hook | Module | Location | Status | Notes |
|------|--------|----------|--------|-------|
| `useAuth` | auth | `features/auth/hooks/` | 🟡 | [spec](specs/007-auth-context-and-hooks/spec.md) — Returns user, login, logout, register |
| `useDoctors` | booking | `features/booking/hooks/` | 🟡 | [spec](specs/010-booking-page/spec.md) — GET `/doctors` for booking selector |
| `useAvailableSlots` | booking | `features/booking/hooks/` | 🟡 | [spec](specs/010-booking-page/spec.md) — GET slots; returns query result |
| `useBookAppointment` | booking | `features/booking/hooks/` | 🟡 | [spec](specs/010-booking-page/spec.md) — POST appointment; idempotency-key |
| `useAppointments` | booking | `features/booking/hooks/` | 🟡 | [spec](specs/011-my-appointments-page/spec.md) — GET patient appointment list |
| `useCancelAppointment` | booking | `features/booking/hooks/` | 🟡 | [spec](specs/011-my-appointments-page/spec.md) — DELETE appointment with 24h rule handling |
| `useQueueSocket` | queue | `features/queue/hooks/` | 🟡 | [spec 014](specs/014-staff-queue-page/spec.md), [spec 023](specs/023-doctor-queue-page/spec.md), [spec 024](specs/024-doctor-today-page/spec.md) — Socket.IO subscription + queue invalidation |
| `useStaffQueue` | queue | `features/queue/hooks/` | 🟡 | [spec](specs/014-staff-queue-page/spec.md) — GET today's staff queue |
| `useDoctorQueue` | queue | `features/queue/hooks/` | 🟡 | [spec](specs/023-doctor-queue-page/spec.md) — GET authenticated doctor's live queue |
| `useUpdateAppointmentStatus` | queue | `features/queue/hooks/` | 🟡 | [spec](specs/023-doctor-queue-page/spec.md) — PATCH appointment status transitions |
| `useUpdateAppointmentNotes` | queue | `features/queue/hooks/` | 🟡 | [spec](specs/023-doctor-queue-page/spec.md) — PATCH appointment notes for doctor queue/today |
| `useDoctorTodaySchedule` | queue | `features/queue/hooks/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — GET selected date schedule for authenticated doctor |
| `useDoctorWeekAppointments` | queue | `features/queue/hooks/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — GET selected week appointments for authenticated doctor |
| `useWaitlist` | waitlist | `features/waitlist/hooks/` | 🟡 | [spec](specs/012-my-waitlist-page/spec.md) — Manage current patient's waitlist entries |
| `useJoinWaitlist` | waitlist | `features/waitlist/hooks/` | 🟡 | [spec](specs/012-my-waitlist-page/spec.md) — POST waitlist entry |
| `useUpdateWaitlistWindow` | waitlist | `features/waitlist/hooks/` | 🟡 | [spec](specs/012-my-waitlist-page/spec.md) — PATCH availability window |
| `useLeaveWaitlist` | waitlist | `features/waitlist/hooks/` | 🟡 | [spec](specs/012-my-waitlist-page/spec.md) — DELETE waitlist entry |
| `useWaitlistOffer` | waitlist | `features/waitlist/hooks/` | 🟡 | [spec](specs/013-waitlist-offer-page/spec.md) — GET offer details + countdown refetch |
| `useAcceptOffer` | waitlist | `features/waitlist/hooks/` | 🟡 | [spec](specs/013-waitlist-offer-page/spec.md) — POST offer accept |
| `useDeclineOffer` | waitlist | `features/waitlist/hooks/` | 🟡 | [spec](specs/013-waitlist-offer-page/spec.md) — POST offer decline |
| `useAnalytics` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — Shared analytics query composition |
| `useKpiSummary` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — GET `/analytics/kpi-summary` |
| `useTrends` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — GET `/analytics/trends` |
| `useStatusDistribution` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — GET `/analytics/status-distribution` |
| `useDoctorUtilization` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — GET `/analytics/doctor-utilization` |
| `useAppointmentsByWeekday` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — GET `/analytics/appointments-by-weekday` |
| `useCancellationTrends` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — GET `/analytics/cancellation-trends` |
| `useFollowUps` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — GET `/analytics/follow-ups` |
| `useWaitlistSummary` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — GET `/analytics/waitlist-summary` |
| `useClinicConfig` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/019-clinic-settings-page/spec.md) — GET/PATCH clinic config |
| `useWorkingHours` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/019-clinic-settings-page/spec.md) — GET/PUT working hours |
| `useHolidays` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/019-clinic-settings-page/spec.md) — GET/POST/DELETE holidays |
| `useDoctorsAdmin` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/020-doctors-admin-page/spec.md) — Admin doctor directory and mutations |
| `useDoctorScheduleOverrides` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/020-doctors-admin-page/spec.md) — Per-doctor schedule overrides |
| `useUsers` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/021-users-admin-page/spec.md) — Admin user list/filter/mutations |
| `useAuditLogs` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/022-audit-log-page/spec.md) — GET `/audit` filterable table |
| `useTodaySummary` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/014-staff-queue-page/spec.md) — GET `/analytics/today-summary` for receptionist KPIs |
| `useTodayByDoctor` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/014-staff-queue-page/spec.md) — GET `/analytics/today-by-doctor` chart data |
| `useMyStats` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — GET `/analytics/my-stats` for doctor KPIs |
| `useMyTrends` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — GET `/analytics/my-trends` for doctor week chart |
| `useMyHourlyLoad` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — GET `/analytics/my-hourly-load` |
| `useMyStatusDistribution` | admin | `features/admin/hooks/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — GET `/analytics/my-status-distribution` |
| `useStaffAppointments` | booking | `features/booking/hooks/` | 🟡 | [spec](specs/015-appointments-admin-page/spec.md) — GET staff appointment table data |
| `useRescheduleAppointment` | booking | `features/booking/hooks/` | 🟡 | [spec](specs/015-appointments-admin-page/spec.md) — PATCH appointment date/time |
| `useCreateStaffAppointment` | booking | `features/booking/hooks/` | 🟡 | [spec](specs/017-walk-in-booking-page/spec.md) — POST appointment on behalf of patient |
| `usePatientSearch` | staff | `features/staff/hooks/` | 🟡 | [spec](specs/016-patients-page/spec.md) — Search patient records for receptionist flows |
| `useStaffPatient` | staff | `features/staff/hooks/` | 🟡 | [spec](specs/016-patients-page/spec.md) — Load selected patient profile/detail |
| `useProfile` | profile | `features/profile/hooks/` | 🟡 | [spec](specs/009-profile-page/spec.md) — View/update own profile |
| `useDirection` | common | `features/common/hooks/` | 🟡 | [spec](specs/026-common-components/spec.md) — LTR/RTL based on language; syncs `<html lang>` and `<html dir>` |
| `useToast` | common | `features/common/hooks/` | 🟡 | [spec](specs/026-common-components/spec.md) — Shared success/error/info/warning toast helpers |
| `usePagination` | common | `features/common/hooks/` | 🟡 | [spec](specs/026-common-components/spec.md) — Pagination state, total pages, offset, reset |

### Layout Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `RootLayout` | `features/common/layouts/` | 🟡 | [spec](specs/026-common-components/spec.md) — Public pages shell |
| `PatientLayout` | `features/common/layouts/` | 🟡 | [spec](specs/026-common-components/spec.md) — Patient nav + shell |
| `DoctorLayout` | `features/common/layouts/` | 🟡 | [spec](specs/026-common-components/spec.md) — Doctor nav + shell |
| `ReceptionistLayout` | `features/common/layouts/` | 🟡 | [spec](specs/026-common-components/spec.md) — Receptionist nav + shell |
| `AdminLayout` | `features/common/layouts/` | 🟡 | [spec](specs/026-common-components/spec.md) — Admin nav + shell |

### Auth Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `LoginForm` | `features/auth/components/` | 🟡 | [spec](specs/002-login-page/spec.md) — Email + password form |
| `RegisterForm` | `features/auth/components/` | 🟡 | [spec](specs/003-register-page/spec.md) — Patient registration form |
| `ChangePasswordForm` | `features/auth/components/` | 🟡 | [spec](specs/009-profile-page/spec.md) — Change password form |
| `ProtectedRoute` | `features/auth/components/` | 🟡 | [spec](specs/008-protected-route/spec.md) — Auth + role gating |

### Profile Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `ProfileForm` | `features/profile/components/` | 🟡 | [spec](specs/009-profile-page/spec.md) — View/edit profile form |

### Booking Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `DoctorSelector` | `features/booking/components/` | 🟡 | [spec](specs/010-booking-page/spec.md) — Doctor picker cards + search |
| `SlotPicker` | `features/booking/components/` | 🟡 | [spec](specs/010-booking-page/spec.md) — Calendar + slot selector |
| `BookingSummary` | `features/booking/components/` | 🟡 | [spec](specs/010-booking-page/spec.md) — Selected doctor/date/time summary |
| `AppointmentCard` | `features/booking/components/` | 🟡 | [spec](specs/011-my-appointments-page/spec.md) — Appointment summary card |
| `ConfirmationModal` | `features/booking/components/` | 🟡 | [spec](specs/010-booking-page/spec.md) — Confirm booking |
| `CancelAppointmentDialog` | `features/booking/components/` | 🟡 | [spec](specs/011-my-appointments-page/spec.md) — Confirm patient cancellation |

### Queue Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `QueueList` | `features/queue/components/` | 🟡 | [spec](specs/014-staff-queue-page/spec.md) — Real-time queue list/grouping |
| `QueueItem` | `features/queue/components/` | 🟡 | [spec](specs/014-staff-queue-page/spec.md) — Single staff queue row/card |
| `StatusBadge` | `features/queue/components/` | 🟡 | [spec](specs/014-staff-queue-page/spec.md) — Appointment status badge shared across queue/tables |
| `StatusTransitionButtons` | `features/queue/components/` | 🟡 | [spec](specs/014-staff-queue-page/spec.md) — Staff transition buttons and valid action map |
| `QueueKpiBanner` | `features/queue/components/` | 🟡 | [spec](specs/014-staff-queue-page/spec.md) — Receptionist KPI row |
| `StaffQueueFilters` | `features/queue/components/` | 🟡 | [spec](specs/014-staff-queue-page/spec.md) — Doctor/status/search filters |
| `DoctorQueueGroup` | `features/queue/components/` | 🟡 | [spec](specs/014-staff-queue-page/spec.md) — Queue rows grouped by doctor |
| `DoctorQueueHeader` | `features/queue/components/` | 🟡 | [spec](specs/023-doctor-queue-page/spec.md) — Doctor queue title, live badge, refresh |
| `DoctorQueueSummary` | `features/queue/components/` | 🟡 | [spec](specs/023-doctor-queue-page/spec.md) — Doctor queue KPI cards |
| `DoctorQueueFilters` | `features/queue/components/` | 🟡 | [spec](specs/023-doctor-queue-page/spec.md) — Status filter + show-finished toggle |
| `DoctorQueueSection` | `features/queue/components/` | 🟡 | [spec](specs/023-doctor-queue-page/spec.md) — In-session/waiting/upcoming/finished sections |
| `DoctorQueueItem` | `features/queue/components/` | 🟡 | [spec](specs/023-doctor-queue-page/spec.md) — Privacy-safe doctor queue appointment card |
| `AppointmentNotesDialog` | `features/queue/components/` | 🟡 | [spec](specs/023-doctor-queue-page/spec.md) — Edit appointment notes |

### Doctor Dashboard Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `DoctorTodayHeader` | `features/queue/components/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — Schedule title, date picker, queue link |
| `DoctorKpiCards` | `features/queue/components/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — Doctor schedule KPI row |
| `MyWeekAtGlanceChart` | `features/queue/components/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — Doctor weekly appointment bar chart |
| `MyStatusDistributionChart` | `features/queue/components/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — Doctor monthly status donut chart |
| `MyHourlyLoadChart` | `features/queue/components/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — Doctor hourly load bar chart |
| `DoctorScheduleTabs` | `features/queue/components/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — Today/This Week tab state |
| `DoctorScheduleTable` | `features/queue/components/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — Privacy-safe schedule table/cards |
| `DoctorScheduleActions` | `features/queue/components/` | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — Reused doctor status transitions |

### Staff Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `PatientSearchPanel` | `features/staff/components/` | 🟡 | [spec](specs/016-patients-page/spec.md) — Debounced patient search results |
| `PatientDetailsPanel` | `features/staff/components/` | 🟡 | [spec](specs/016-patients-page/spec.md) — Selected patient profile summary |
| `PatientAppointmentHistoryTable` | `features/staff/components/` | 🟡 | [spec](specs/016-patients-page/spec.md) — Appointment history for selected patient |
| `PatientLookup` | `features/staff/components/` | 🟡 | [spec](specs/017-walk-in-booking-page/spec.md) — Existing-patient lookup for staff booking |
| `StaffBookingStepper` | `features/booking/components/` | 🟡 | [spec](specs/017-walk-in-booking-page/spec.md) — Walk-in booking step indicator |
| `StaffBookingSummary` | `features/booking/components/` | 🟡 | [spec](specs/017-walk-in-booking-page/spec.md) — Staff booking summary card |
| `StaffBookingConfirmDialog` | `features/booking/components/` | 🟡 | [spec](specs/017-walk-in-booking-page/spec.md) — Confirm staff-created appointment |

### Waitlist Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `WaitlistEntryCard` | `features/waitlist/components/` | 🟡 | [spec](specs/012-my-waitlist-page/spec.md) — Waitlist entry summary |
| `OfferModal` | `features/waitlist/components/` | 🟡 | [spec](specs/013-waitlist-offer-page/spec.md) — Accept/decline offer modal |
| `AvailabilityWindowForm` | `features/waitlist/components/` | 🟡 | [spec](specs/012-my-waitlist-page/spec.md) — Set available time window |
| `LeaveWaitlistDialog` | `features/waitlist/components/` | 🟡 | [spec](specs/012-my-waitlist-page/spec.md) — Confirm waitlist removal |
| `OfferDetailsCard` | `features/waitlist/components/` | 🟡 | [spec](specs/013-waitlist-offer-page/spec.md) — Offer doctor/time/status summary |
| `OfferCountdown` | `features/waitlist/components/` | 🟡 | [spec](specs/013-waitlist-offer-page/spec.md) — Offer expiry timer |
| `OfferActionDialog` | `features/waitlist/components/` | 🟡 | [spec](specs/013-waitlist-offer-page/spec.md) — Accept/decline confirmation dialog |

### Admin Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `AnalyticsCards` | `features/admin/components/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — Grid of KpiCard metric configs |
| `TrendsChart` | `features/admin/components/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — Recharts LineChart, multi-series, date-range |
| `DonutChart` | `features/admin/components/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — Recharts PieChart in donut mode — status distribution |
| `BarChart` | `features/admin/components/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — Recharts BarChart — horizontal (utilization) + vertical (weekday/hourly) |
| `HolidayForm` | `features/admin/components/` | 🟡 | [spec](specs/019-clinic-settings-page/spec.md) — Add/delete holiday closure |
| `WorkingHourForm` | `features/admin/components/` | 🟡 | [spec](specs/019-clinic-settings-page/spec.md) — Set working hours per weekday |
| `ClinicConfigForm` | `features/admin/components/` | 🟡 | [spec](specs/019-clinic-settings-page/spec.md) — General clinic settings form |
| `DoctorProfileForm` | `features/admin/components/` | 🟡 | [spec](specs/020-doctors-admin-page/spec.md) — Create/edit doctor profile |
| `ScheduleOverrideForm` | `features/admin/components/` | 🟡 | [spec](specs/020-doctors-admin-page/spec.md) — Per-day schedule override |
| `UserForm` | `features/admin/components/` | 🟡 | [spec](specs/021-users-admin-page/spec.md) — Create/edit user and role |
| `AuditLogFilters` | `features/admin/components/` | 🟡 | [spec](specs/022-audit-log-page/spec.md) — Audit date/actor/action/target filters |
| `AuditLogDetailsSheet` | `features/admin/components/` | 🟡 | [spec](specs/022-audit-log-page/spec.md) — Redacted audit payload viewer |

### Shared Dashboard Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `KpiCard` | `features/common/components/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — Value, label, delta badge, sparkline slot |
| `Sparkline` | `features/common/components/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — 7-day mini Recharts line inside KpiCard |
| `DateRangePicker` | `features/common/components/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — dayjs-backed start/end date inputs |
| `DataTable` | `features/common/components/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — @tanstack/react-table wrapper — sort, paginate, filter |
| `ExportCsvButton` | `features/common/components/` | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — Triggers CSV export from DataTable or server endpoint |

### Common Components

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| `Header` | `features/common/components/` | 🟡 | [spec](specs/026-common-components/spec.md) — Top nav bar, user menu, mobile sidebar trigger |
| `Sidebar` | `features/common/components/` | 🟡 | [spec](specs/026-common-components/spec.md) — Role-specific side navigation |
| `LanguageSwitcher` | `features/common/components/` | 🟡 | [spec](specs/026-common-components/spec.md) — EN/AR toggle with persisted RTL direction |
| `LoadingSpinner` | `features/common/components/` | 🟡 | [spec](specs/026-common-components/spec.md) — Inline, overlay, and full-page loading indicator |
| `ErrorBoundary` | `features/common/components/` | 🟡 | [spec](specs/026-common-components/spec.md) — Runtime render error fallback and reset |
| `NotFoundPage` | `features/common/pages/` | 🟡 | [spec](specs/025-error-pages/spec.md) — 404 page |
| `ForbiddenPage` | `features/common/pages/` | 🟡 | [spec](specs/025-error-pages/spec.md) — 403 page |

---

## Core App & Shared Infrastructure

### App Shell

| Item | File / Module | Spec | Status | Notes |
|------|---------------|------|--------|-------|
| `app/layout.tsx` | `frontend/src/app/layout.tsx` | — | 🔴 | No spec yet |
| `router.tsx` | `frontend/src/app/router.tsx` | — | 🔴 | No spec yet |
| `providers.tsx` | `frontend/src/app/providers.tsx` | [spec](specs/007-auth-context-and-hooks/spec.md) | 🟡 | AuthProvider + QueryClientProvider + i18n/theme wiring |
| `app.tsx` | `frontend/src/app/app.tsx` | — | 🔴 | No spec yet |
| `main.tsx` | `frontend/src/main.tsx` | — | 🔴 | No spec yet |

### Shared Libraries / Setup

| Item | File / Module | Spec | Status | Notes |
|------|---------------|------|--------|-------|
| `api.ts` | `frontend/src/lib/api.ts` | [spec](specs/007-auth-context-and-hooks/spec.md) | 🟡 | Axios instance + auto-refresh interceptor |
| `queryClient.ts` | `frontend/src/lib/queryClient.ts` | — | 🔴 | No spec yet |
| `i18n.ts` | `frontend/src/lib/i18n.ts` | — | 🔴 | No spec yet |
| `date-utils.ts` | `frontend/src/lib/date-utils.ts` | — | 🔴 | No spec yet |
| `socket.ts` | `frontend/src/lib/socket.ts` | specs 014/023/024 | 🟡 | Socket.IO queue client used by queue/doctor pages |
| `en.json` | `frontend/src/i18n/en.json` | [spec](specs/026-common-components/spec.md) | 🟡 | English translation catalog |
| `ar.json` | `frontend/src/i18n/ar.json` | [spec](specs/026-common-components/spec.md) | 🟡 | Arabic translation catalog |

### Shared Types

| Item | File / Module | Spec | Status | Notes |
|------|---------------|------|--------|-------|
| `api.ts` | `frontend/src/types/api.ts` | — | 🔴 | No spec yet |
| `common.ts` | `frontend/src/types/common.ts` | — | 🔴 | No spec yet |
| `domain.ts` | `frontend/src/types/domain.ts` | [spec](specs/007-auth-context-and-hooks/spec.md) | 🟡 | Auth and domain model types |

### Shared Hooks / Utilities

| Item | File / Module | Spec | Status | Notes |
|------|---------------|------|--------|-------|
| `useApi.ts` | `frontend/src/hooks/useApi.ts` | — | 🔴 | No spec yet |
| `useMutation.ts` | `frontend/src/hooks/useMutation.ts` | — | 🔴 | No spec yet |
| `classnames.ts` | `frontend/src/utils/classnames.ts` | [spec](specs/026-common-components/spec.md) | 🟡 | `cn()` helper used by shared UI |
| `format.ts` | `frontend/src/utils/format.ts` | — | 🔴 | No spec yet |
| `validation.ts` | `frontend/src/utils/validation.ts` | — | 🔴 | No spec yet |

### Shared Styles

| Item | File / Module | Spec | Status | Notes |
|------|---------------|------|--------|-------|
| `globals.css` | `frontend/src/styles/globals.css` | — | 🔴 | No spec yet |
| `animations.css` | `frontend/src/styles/animations.css` | — | 🔴 | No spec yet |

### Feature API Layers

| Item | File / Module | Spec | Status | Notes |
|------|---------------|------|--------|-------|
| `auth-api.ts` | `frontend/src/features/auth/api/auth-api.ts` | [spec](specs/007-auth-context-and-hooks/spec.md) | 🟡 | Login/register/logout/me/forgot/reset |
| `AuthContext.tsx` | `frontend/src/features/auth/contexts/AuthContext.tsx` | [spec](specs/007-auth-context-and-hooks/spec.md) | 🟡 | Global auth state |
| `appointments-api.ts` | `frontend/src/features/booking/api/appointments-api.ts` | specs 010/011/015/017 | 🟡 | Booking and appointment operations |
| `queue-api.ts` | `frontend/src/features/queue/api/queue-api.ts` | specs 014/023/024 | 🟡 | Queue fetch/update operations |
| `waitlist-api.ts` | `frontend/src/features/waitlist/api/waitlist-api.ts` | specs 012/013 | 🟡 | Waitlist CRUD and offers |
| `admin-api.ts` | `frontend/src/features/admin/api/admin-api.ts` | specs 018-022 | 🟡 | Admin analytics/settings/users/audit |
| `users-api.ts` | `frontend/src/features/profile/api/users-api.ts` | [spec](specs/009-profile-page/spec.md) | 🟡 | Profile view/update endpoints |

---

## Features & Flows

| Feature | Status | Implementation | API Integration | Testing |
|---------|--------|-----------------|------------------|---------|
| **User Registration** | 🔴 | Register page + form | POST `/auth/register` | — |
| **User Login** | 🔴 | Login page + form | POST `/auth/login` | — |
| **Auto-Refresh** | 🔴 | Axios interceptor | POST `/auth/refresh` | — |
| **Logout** | 🔴 | Logout button | POST `/auth/logout` | — |
| **Password Reset** | 🔴 | Forgot/reset pages | POST `/auth/forgot-password`, `/reset-password` | — |
| **Profile View/Edit** | 🔴 | Profile page | GET/PATCH `/users/me` | — |
| **Doctor Listing** | 🟡 | [spec](specs/010-booking-page/spec.md) — Doctor selector | GET `/doctors` | — |
| **Slot Generation Display** | 🟡 | [spec](specs/010-booking-page/spec.md) — Booking page calendar | GET `/appointments/slots` | — |
| **Appointment Booking** | 🟡 | [spec](specs/010-booking-page/spec.md) — Booking page + confirm | POST `/appointments` (idempotency) | — |
| **Appointment Listing** | 🟡 | [spec](specs/011-my-appointments-page/spec.md) — My appointments page | GET `/appointments` | — |
| **Appointment Cancellation** | 🟡 | [spec](specs/011-my-appointments-page/spec.md) — Cancel button + modal | DELETE `/appointments/:id` | — |
| **Waitlist Join** | 🟡 | [spec](specs/012-my-waitlist-page/spec.md) — My waitlist page | POST `/waitlist` | — |
| **Waitlist Offer Accept/Decline** | 🟡 | [spec](specs/013-waitlist-offer-page/spec.md) — Offer page | POST `/waitlist/offers/:id/accept\|decline` | — |
| **Real-Time Queue** | 🟡 | [spec 014](specs/014-staff-queue-page/spec.md), [spec 023](specs/023-doctor-queue-page/spec.md), [spec 024](specs/024-doctor-today-page/spec.md) — Staff and doctor queue pages | Socket.IO `/queue` namespace | — |
| **Doctor Queue** | 🟡 | [spec](specs/023-doctor-queue-page/spec.md) — Doctor own live queue, status transitions, notes | GET `/appointments`, PATCH status/notes, Socket.IO | — |
| **Doctor Today Schedule** | 🟡 | [spec](specs/024-doctor-today-page/spec.md) — Doctor schedule dashboard, KPIs, charts, weekly table | GET `/appointments`, GET `/analytics/my-*`, Socket.IO | — |
| **Staff Queue** | 🟡 | [spec](specs/014-staff-queue-page/spec.md) — Staff queue page | GET `/appointments`, GET `/analytics/today-*`, Socket.IO | — |
| **Staff Appointment Management** | 🟡 | [spec](specs/015-appointments-admin-page/spec.md) — Staff appointment table, cancel, reschedule, no-show, export | GET/PATCH/DELETE `/appointments`, GET `/appointments/export` | — |
| **Staff Patient Search** | 🟡 | [spec](specs/016-patients-page/spec.md) — Patient search/detail/history | Needs receptionist access to `GET /users?role=PATIENT` or dedicated `/patients` endpoints | — |
| **Walk-In Booking** | 🟡 | [spec](specs/017-walk-in-booking-page/spec.md) — Book on behalf of selected patient | POST `/appointments` with staff `patientId`; GET `/appointments/slots` | — |
| **Analytics Dashboard** | 🟡 | [spec](specs/018-admin-dashboard-page/spec.md) — Admin dashboard with KPI/charts/tables | GET `/analytics/*`, GET `/appointments`, GET `/waitlist` | — |
| **Clinic Settings** | 🟡 | [spec](specs/019-clinic-settings-page/spec.md) — Clinic config, working hours, holidays | GET/PATCH `/clinic-config`, PUT working hours, POST/DELETE holidays | — |
| **Doctor Management** | 🟡 | [spec](specs/020-doctors-admin-page/spec.md) — Doctor profiles + schedule overrides | CRUD `/doctors`, schedule override endpoints | — |
| **User Management** | 🟡 | [spec](specs/021-users-admin-page/spec.md) — List/edit/disable users and roles | CRUD `/users`, PATCH disable | — |
| **Audit Log Viewing** | 🟡 | [spec](specs/022-audit-log-page/spec.md) — Filterable audit table and payload detail | GET `/audit` | — |
| **i18n EN/AR** | 🟡 | [spec](specs/026-common-components/spec.md) — Language switcher and common keys | All pages + translations | — |
| **RTL Layout** | 🟡 | [spec](specs/026-common-components/spec.md) — CSS logical properties and direction hook | `<html dir="rtl">` toggle | — |

---

## API Integration Status

See [BACKEND_PLAN.md — API Contracts](BACKEND_PLAN.md#api-contracts-swagger) for endpoint details.

### Auth Endpoints

| Endpoint | Frontend Hook | Status |
|----------|---------------|--------|
| POST `/auth/register` | `useRegister` | 🔴 |
| POST `/auth/login` | `useLogin` | 🔴 |
| POST `/auth/refresh` | Axios interceptor | 🔴 |
| POST `/auth/logout` | `useLogout` | 🔴 |
| POST `/auth/forgot-password` | `useForgotPassword` | 🔴 |
| POST `/auth/reset-password` | `useResetPassword` | 🔴 |
| GET `/auth/me` | `useAuth` (query) | 🔴 |

### Appointments Endpoints

| Endpoint | Frontend Hook | Status |
|----------|---------------|--------|
| GET `/appointments/slots` | `useAvailableSlots` | 🟡 |
| GET `/appointments` | `useAppointments`, `useStaffAppointments`, `useDoctorQueue`, `useDoctorTodaySchedule`, `useDoctorWeekAppointments` | 🟡 [specs 011, 014, 015, 023, 024] |
| GET `/appointments/:id` | `useAppointment` | 🔴 |
| POST `/appointments` | `useBookAppointment` | 🟡 |
| POST `/appointments` (staff payload) | `useCreateStaffAppointment` | 🟡 |
| PATCH `/appointments/:id/status` | `useUpdateAppointmentStatus` | 🟡 [specs 014, 015, 023, 024] |
| PATCH `/appointments/:id` | `useRescheduleAppointment`, `useUpdateAppointmentNotes` | 🟡 [specs 015, 023, 024] |
| DELETE `/appointments/:id` | `useCancelAppointment` | 🟡 |
| GET `/appointments/export?format=csv` | `useExportAppointmentsCsv` | 🟡 |

### Doctors Endpoints

| Endpoint | Frontend Hook | Status |
|----------|---------------|--------|
| GET `/doctors` | `useDoctors`, `useDoctorsAdmin` | 🟡 |
| GET `/doctors/:id` | `useDoctor` | 🟡 [spec](specs/020-doctors-admin-page/spec.md) |
| POST `/doctors` | `useCreateDoctor` | 🟡 [spec](specs/020-doctors-admin-page/spec.md) |
| PATCH `/doctors/:id` | `useUpdateDoctor` | 🟡 [spec](specs/020-doctors-admin-page/spec.md) |
| GET `/doctors/:id/schedule-overrides` | `useDoctorScheduleOverrides` | 🟡 [spec](specs/020-doctors-admin-page/spec.md) |
| POST `/doctors/:id/schedule-overrides` | `useCreateScheduleOverride` | 🟡 [spec](specs/020-doctors-admin-page/spec.md) |
| DELETE `/doctors/:id/schedule-overrides/:overrideId` | `useDeleteScheduleOverride` | 🟡 [spec](specs/020-doctors-admin-page/spec.md) |

### Waitlist Endpoints

| Endpoint | Frontend Hook | Status |
|----------|---------------|--------|
| GET `/waitlist` | `useWaitlist` | 🟡 |
| POST `/waitlist` | `useJoinWaitlist` | 🟡 |
| PATCH `/waitlist/:id` | `useUpdateWaitlistWindow` | 🟡 |
| DELETE `/waitlist/:id` | `useLeaveWaitlist` | 🟡 |
| GET `/waitlist/offers/:offerId` | `useWaitlistOffer` | 🟡 |
| POST `/waitlist/offers/:offerId/accept` | `useAcceptOffer` | 🟡 |
| POST `/waitlist/offers/:offerId/decline` | `useDeclineOffer` | 🟡 |

### Clinic Config Endpoints

| Endpoint | Frontend Hook | Status |
|----------|---------------|--------|
| GET `/clinic-config` | `useClinicConfig` | 🟡 [spec](specs/019-clinic-settings-page/spec.md) |
| PATCH `/clinic-config` | `useUpdateClinicConfig` | 🟡 [spec](specs/019-clinic-settings-page/spec.md) |
| GET `/clinic-config/working-hours` | `useWorkingHours` | 🟡 [spec](specs/019-clinic-settings-page/spec.md) |
| PUT `/clinic-config/working-hours` | `useReplaceWorkingHours` | 🟡 [spec](specs/019-clinic-settings-page/spec.md) |
| GET `/clinic-config/holidays` | `useHolidays` | 🟡 [spec](specs/019-clinic-settings-page/spec.md) |
| POST `/clinic-config/holidays` | `useCreateHoliday` | 🟡 [spec](specs/019-clinic-settings-page/spec.md) |
| DELETE `/clinic-config/holidays/:id` | `useDeleteHoliday` | 🟡 [spec](specs/019-clinic-settings-page/spec.md) |

### Analytics Endpoints

#### Admin

| Endpoint | Frontend Hook | Status |
|----------|---------------|--------|
| GET `/analytics/kpi-summary` | `useKpiSummary` | 🟡 [spec](specs/018-admin-dashboard-page/spec.md) |
| GET `/analytics/trends` | `useTrends` | 🟡 [spec](specs/018-admin-dashboard-page/spec.md) |
| GET `/analytics/status-distribution` | `useStatusDistribution` | 🟡 [spec](specs/018-admin-dashboard-page/spec.md) |
| GET `/analytics/doctor-utilization` | `useDoctorUtilization` | 🟡 [spec](specs/018-admin-dashboard-page/spec.md) |
| GET `/analytics/appointments-by-weekday` | `useAppointmentsByWeekday` | 🟡 [spec](specs/018-admin-dashboard-page/spec.md) |
| GET `/analytics/cancellation-trends` | `useCancellationTrends` | 🟡 [spec](specs/018-admin-dashboard-page/spec.md) |
| GET `/analytics/follow-ups` | `useFollowUps` | 🟡 [spec](specs/018-admin-dashboard-page/spec.md) |
| GET `/analytics/waitlist-summary` | `useWaitlistSummary` | 🟡 [spec](specs/018-admin-dashboard-page/spec.md) |

#### Receptionist

| Endpoint | Frontend Hook | Status |
|----------|---------------|--------|
| GET `/analytics/today-summary` | `useTodaySummary` | 🟡 |
| GET `/analytics/today-by-doctor` | `useTodayByDoctor` | 🟡 |

### Staff / Patient Search Endpoints

| Endpoint | Frontend Hook | Status |
|----------|---------------|--------|
| GET `/users?role=PATIENT` or `/patients` | `usePatientSearch` | 🟡 Spec written; backend receptionist permission/endpoint required |
| GET `/users/:id` or `/patients/:id` | `useStaffPatient` | 🟡 Spec written; backend receptionist permission/endpoint required |
| GET `/appointments?patientId=...` or `/patients/:id/appointments` | `usePatientAppointmentHistory` | 🟡 Spec written; backend filter/endpoint required |

### Users Admin Endpoints

| Endpoint | Frontend Hook | Status |
|----------|---------------|--------|
| GET `/users` | `useUsers` | 🟡 [spec](specs/021-users-admin-page/spec.md) |
| POST `/users` | `useCreateUser` | 🟡 [spec](specs/021-users-admin-page/spec.md) |
| GET `/users/:id` | `useUser` | 🟡 [spec](specs/021-users-admin-page/spec.md) |
| PATCH `/users/:id` | `useUpdateUser` | 🟡 [spec](specs/021-users-admin-page/spec.md) |
| PATCH `/users/:id/disable` | `useDisableUser` | 🟡 [spec](specs/021-users-admin-page/spec.md) |

### Audit Endpoints

| Endpoint | Frontend Hook | Status |
|----------|---------------|--------|
| GET `/audit` | `useAuditLogs` | 🟡 [spec](specs/022-audit-log-page/spec.md) |

### Doctor Analytics Endpoints

| Endpoint | Frontend Hook | Status |
|----------|---------------|--------|
| GET `/analytics/my-stats` | `useMyStats` | 🟡 [spec](specs/024-doctor-today-page/spec.md) |
| GET `/analytics/my-trends` | `useMyTrends` | 🟡 [spec](specs/024-doctor-today-page/spec.md) |
| GET `/analytics/my-hourly-load` | `useMyHourlyLoad` | 🟡 [spec](specs/024-doctor-today-page/spec.md) |
| GET `/analytics/my-status-distribution` | `useMyStatusDistribution` | 🟡 [spec](specs/024-doctor-today-page/spec.md) |

---

## i18n Translation Keys Status

| Category | Keys | English | Arabic | Status |
|----------|------|---------|--------|--------|
| **Auth** | login, register, email, password, etc. | 🔴 | 🔴 | 🔴 |
| **Booking** | selectDoctor, selectDate, availableSlots, appointments, etc. | 🟡 | 🟡 | 🟡 Spec keys listed in specs 010-011 |
| **Queue** | inProgress, completed, pending, etc. | 🔴 | 🔴 | 🔴 |
| **Doctor** | doctorQueue, doctorToday KPI/table/chart/action keys | 🟡 | 🟡 | 🟡 Spec keys listed in specs 023-024 |
| **Staff Queue** | KPI, filters, live queue actions | 🟡 | 🟡 | 🟡 Spec keys listed in spec 014 |
| **Staff Appointments** | appointment table, cancel, reschedule, export | 🟡 | 🟡 | 🟡 Spec keys listed in spec 015 |
| **Staff Patients** | patient search/detail/history | 🟡 | 🟡 | 🟡 Spec keys listed in spec 016 |
| **Walk-In Booking** | patient lookup, staff booking, validation | 🟡 | 🟡 | 🟡 Spec keys listed in spec 017 |
| **Waitlist** | joinWaitlist, leaveWaitlist, offerExpires, etc. | 🟡 | 🟡 | 🟡 Spec keys listed in specs 012-013 |
| **Admin** | dashboard, settings, doctors, users, audit, etc. | 🟡 | 🟡 | 🟡 Spec keys listed in specs 018-022 |
| **Errors** | forbidden, notFound, recovery CTAs | 🟡 | 🟡 | 🟡 Spec keys listed in spec 025 |
| **Common** | loading, navigation, language, error boundary, shell actions | 🟡 | 🟡 | 🟡 Spec keys listed in spec 026 |

---

## Testing Status

| Test Level | Target | Status | Coverage |
|------------|--------|--------|----------|
| **Unit Tests** | Hooks | 🔴 | — |
| **Unit Tests** | Utility functions | 🔴 | — |
| **Component Tests** | Auth pages | 🔴 | — |
| **Component Tests** | Booking pages | 🔴 | — |
| **Component Tests** | Queue pages | 🔴 | — |
| **E2E Tests** | Register flow | 🔴 | — |
| **E2E Tests** | Booking flow | 🔴 | — |
| **E2E Tests** | Waitlist accept flow | 🔴 | — |
| **E2E Tests** | Language switch | 🔴 | — |

**Run**:
```bash
pnpm test              # unit + component tests
pnpm test:ui           # test UI dashboard
pnpm coverage          # coverage report
pnpm build             # verify build
```

---

## Notes

- Spec-driven development: Create `specs/<NNN-featureName>/spec.md` for each page/major feature before implementing.
- All forms use `react-hook-form` + `zod` for validation.
- All API calls go through axios (configured in `lib/api.ts`) with auto-refresh interceptor.
- Real-time updates via Socket.IO (configured in `lib/socket.ts`).
- All user-visible strings must exist in both `i18n/en.json` and `i18n/ar.json`.
- All CSS uses logical properties for RTL support (`margin-inline-start`, `text-start`, etc.).
- Layout icons are mirrored in RTL via CSS.
- Use shadcn/ui primitives; don't hand-roll components.
