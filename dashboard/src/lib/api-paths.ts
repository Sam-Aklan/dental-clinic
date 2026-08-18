export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const AUTH_LOGIN = "/auth/login" as const;
export const AUTH_REGISTER = "/auth/register" as const;
export const AUTH_ME = "/auth/me" as const;
export const AUTH_LOGOUT = "/auth/logout" as const;
export const AUTH_REFRESH = "/auth/refresh" as const;
export const AUTH_FORGOT_PASSWORD = "/auth/forgot-password" as const;
export const AUTH_RESET_PASSWORD = "/auth/reset-password" as const;

export const USERS = "/users" as const;
export const USERS_ME = "/users/me" as const;
export const USERS_ME_PASSWORD = "/users/me/change-password" as const;

export const CLINIC_CONFIG = "/clinic-config" as const;
export const CLINIC_CONFIG_WORKING_HOURS = "/clinic-config/working-hours" as const;
export const CLINIC_CONFIG_HOLIDAYS = "/clinic-config/holidays" as const;

export function clinicConfigHolidayPath(id: string) {
	return `${CLINIC_CONFIG_HOLIDAYS}/${id}` as const;
}

export function userPath(id: string) {
	return `${USERS}/${id}` as const;
}

export function userDisablePath(id: string) {
	return `${USERS}/${id}/disable` as const;
}

export function userEnablePath(id: string) {
	return `${USERS}/${id}/enable` as const;
}

export const DOCTORS = "/doctors" as const;

export function doctorPath(id: string) {
	return `${DOCTORS}/${id}` as const;
}

export function doctorScheduleOverridesPath(doctorId: string) {
	return `${DOCTORS}/${doctorId}/schedule-overrides` as const;
}

export function doctorScheduleOverridePath(doctorId: string, overrideId: string) {
	return `${DOCTORS}/${doctorId}/schedule-overrides/${overrideId}` as const;
}

export const APPOINTMENT_SLOTS = "/appointments/slots" as const;
export const APPOINTMENTS = "/appointments" as const;
export const FOLLOW_UPS = "/follow-ups" as const;
export const APPOINTMENTS_EXPORT = "/appointments/export" as const;
export const ANALYTICS_TODAY_SUMMARY = "/analytics/today-summary" as const;
export const ANALYTICS_TODAY_BY_DOCTOR = "/analytics/today-by-doctor" as const;
export const ANALYTICS_KPI_SUMMARY = "/analytics/kpi-summary" as const;
export const ANALYTICS_TRENDS = "/analytics/trends" as const;
export const ANALYTICS_STATUS_DISTRIBUTION = "/analytics/status-distribution" as const;
export const ANALYTICS_DOCTOR_UTILIZATION = "/analytics/doctor-utilization" as const;
export const ANALYTICS_APPOINTMENTS_BY_WEEKDAY = "/analytics/appointments-by-weekday" as const;
export const ANALYTICS_CANCELLATION_TRENDS = "/analytics/cancellation-trends" as const;
export const ANALYTICS_FOLLOW_UPS = "/analytics/follow-ups" as const;
export const ANALYTICS_WAITLIST_SUMMARY = "/analytics/waitlist-summary" as const;
export const ANALYTICS_MY_STATS = "/analytics/my-stats" as const;
export const ANALYTICS_MY_TRENDS = "/analytics/my-trends" as const;
export const ANALYTICS_MY_STATUS_DISTRIBUTION = "/analytics/my-status-distribution" as const;
export const ANALYTICS_MY_HOURLY_LOAD = "/analytics/my-hourly-load" as const;
export const WAITLIST = "/waitlist" as const;
export const AUDIT = "/audit" as const;
export const QUEUE_KIOSK_TOKEN = "/queue/kiosk-token" as const;

export function appointmentStatusPath(id: string) {
	return `${APPOINTMENTS}/${id}/status` as const;
}

export function appointmentPath(id: string) {
	return `${APPOINTMENTS}/${id}` as const;
}

export function appointmentNotesPath(id: string) {
	return `${APPOINTMENTS}/${id}/notes` as const;
}

export function waitlistEntryPath(id: string) {
	return `${WAITLIST}/${id}` as const;
}

export function waitlistOfferPath(offerId: string) {
	return `${WAITLIST}/offers/${encodeURIComponent(offerId)}` as const;
}

export function waitlistOfferAcceptPath(offerId: string) {
	return `${WAITLIST}/offers/${encodeURIComponent(offerId)}/accept` as const;
}

export function waitlistOfferDeclinePath(offerId: string) {
	return `${WAITLIST}/offers/${encodeURIComponent(offerId)}/decline` as const;
}
