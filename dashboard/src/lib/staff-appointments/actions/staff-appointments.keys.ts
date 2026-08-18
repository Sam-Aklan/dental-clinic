import type { StaffAppointmentFilters, StaffWaitlistFilters } from "@/types";

export const staffAppointmentsKeys = {
	all: ["staff-appointments"] as const,
	appointments: () => [...staffAppointmentsKeys.all, "appointments"] as const,
	appointmentList: (filters: StaffAppointmentFilters) => [...staffAppointmentsKeys.appointments(), filters] as const,
	waitlist: () => [...staffAppointmentsKeys.all, "waitlist"] as const,
	waitlistList: (filters: StaffWaitlistFilters) => [...staffAppointmentsKeys.waitlist(), filters] as const,
	slots: (doctorId: string, date: string) => [...staffAppointmentsKeys.all, "slots", doctorId, date] as const,
	export: (filters: Omit<StaffAppointmentFilters, "tab" | "page" | "pageSize">) => [...staffAppointmentsKeys.all, "export", filters] as const,
};
