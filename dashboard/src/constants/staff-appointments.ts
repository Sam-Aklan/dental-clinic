import type { AppointmentStatus, StaffAppointmentTab } from "@/types";

export const STAFF_APPOINTMENT_PAGE_SIZE = 10 as const;
export const STAFF_APPOINTMENT_EXPORT_FORMAT = "csv" as const;

export const STAFF_APPOINTMENT_TABS: StaffAppointmentTab[] = ["today", "upcoming", "waitlist"];

export const STAFF_APPOINTMENT_STATUSES: AppointmentStatus[] = [
	"PENDING",
	"CONFIRMED",
	"IN_PROGRESS",
	"COMPLETED",
	"CANCELED",
	"NO_SHOW",
];

export const STAFF_APPOINTMENT_SORT_FIELDS = ["startsAt", "doctor", "status", "createdAt"] as const;
export const STAFF_APPOINTMENT_SORT_DIRECTIONS = ["asc", "desc"] as const;

export const STAFF_APPOINTMENT_I18N_NS = "staffAppointments" as const;
