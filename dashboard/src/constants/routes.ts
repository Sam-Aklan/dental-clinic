import type { Role } from "@/types";

export const ROUTE_HOME = "/" as const;
export const ROUTE_LOGIN = "/login" as const;
export const ROUTE_PROFILE = "/profile" as const;
export const ROUTE_BOOK = "/book" as const;
export const ROUTE_BOOK_APPOINTMENTS = "/my-appointments" as const;
export const ROUTE_WAITLIST = "/waitlist" as const;
export const ROUTE_DOCTOR_QUEUE = "/doctor/queue" as const;
export const ROUTE_DOCTOR_SCHEDULE = "/doctor/schedule" as const;
export const ROUTE_DOCTOR_TODAY = "/doctor/today" as const;
export const ROUTE_STAFF_QUEUE = "/staff/queue" as const;
export const ROUTE_STAFF_LOBBY_ACCESS = "/staff/lobby-access" as const;
export const ROUTE_STAFF_APPOINTMENTS = "/staff/appointments" as const;
export const ROUTE_STAFF_PATIENTS = "/staff/patients" as const;
export const ROUTE_STAFF_WALK_IN = "/staff/walk-in" as const;
export const ROUTE_ADMIN_DASHBOARD = "/admin/dashboard" as const;
export const ROUTE_ADMIN_LOBBY_ACCESS = "/admin/lobby-access" as const;
export const ROUTE_ADMIN_SETTINGS = "/admin/settings" as const;
export const ROUTE_ADMIN_DOCTORS = "/admin/doctors" as const;
export const ROUTE_ADMIN_USERS = "/admin/user-settings" as const;
export const ROUTE_ADMIN_AUDIT_LOG = "/admin/audit" as const;
export const ROUTE_ACCESS_DENIED = "/access-denied" as const;
export const ROUTE_FORBIDDEN = "/403" as const;
export const ROUTE_FORGOT_PASSWORD = "/forgot-password" as const;
export const ROUTE_RESET_PASSWORD = "/reset-password" as const;
export const ROUTE_MY_APPOINTMENTS = "/my-appointments" as const;
export const ROUTE_REGISTER = "/register" as const;
export const ROUTE_OFFER_PREFIX = "/offers" as const;
export const ROUTE_OFFER = "/offers/$" as const;

export const roleHomeMap: Record<Role, string> = {
	PATIENT: ROUTE_BOOK,
	DOCTOR: ROUTE_DOCTOR_QUEUE,
	RECEPTIONIST: ROUTE_STAFF_QUEUE,
	ADMIN: ROUTE_ADMIN_DASHBOARD,
};
