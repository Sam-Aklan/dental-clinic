import type { AppointmentStatus, AppointmentTab } from "@/types";

export const APPOINTMENT_PAGE_DEFAULT_PAGE_SIZE = 10 as const;
export const APPOINTMENT_CANCELLATION_CUTOFF_HOURS = 24 as const;
export const APPOINTMENT_SORT_VALUES = {
	upcoming: "startsAt:asc",
	past: "startsAt:desc",
	canceled: "startsAt:desc",
} as const;

export const APPOINTMENT_DEFAULT_SORT_BY = "startsAt" as const;
export const APPOINTMENT_DEFAULT_SORT_DIR = {
	upcoming: "asc",
	past: "desc",
	canceled: "desc",
} as const;

export const APPOINTMENT_TABS: AppointmentTab[] = ["upcoming", "past", "canceled"];

export const APPOINTMENT_TAB_LABELS: Record<AppointmentTab, string> = {
	upcoming: "appointments.tabs.upcoming",
	past: "appointments.tabs.past",
	canceled: "appointments.tabs.canceled",
};

export const APPOINTMENT_TAB_DEFAULT_STATUSES: Record<AppointmentTab, AppointmentStatus[]> = {
	upcoming: ["PENDING", "CONFIRMED", "IN_PROGRESS"],
	past: ["COMPLETED", "NO_SHOW"],
	canceled: ["CANCELED"],
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
	PENDING: "appointments.status.pending",
	CONFIRMED: "appointments.status.confirmed",
	IN_PROGRESS: "appointments.status.inProgress",
	COMPLETED: "appointments.status.completed",
	CANCELED: "appointments.status.canceled",
	NO_SHOW: "appointments.status.noShow",
};

export const APPOINTMENT_STATUS_TO_TAB: Record<AppointmentStatus, AppointmentTab> = {
	PENDING: "upcoming",
	CONFIRMED: "upcoming",
	IN_PROGRESS: "upcoming",
	COMPLETED: "past",
	CANCELED: "canceled",
	NO_SHOW: "past",
};

export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
	PENDING: ["CONFIRMED", "CANCELED"],
	CONFIRMED: ["IN_PROGRESS", "CANCELED", "NO_SHOW"],
	IN_PROGRESS: ["COMPLETED", "NO_SHOW"],
	COMPLETED: [],
	CANCELED: [],
	NO_SHOW: [],
};

export const STAFF_ONLY_TRANSITIONS: AppointmentStatus[] = ["CONFIRMED", "NO_SHOW"];

export const APPOINTMENT_QUERY_KEYS = {
	tab: "tab",
	doctorId: "doctorId",
	status: "status",
	page: "page",
	created: "created",
	sortBy: "sortBy",
	sortDir: "sortDir",
} as const;
