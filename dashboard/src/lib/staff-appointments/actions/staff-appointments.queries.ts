import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { staffAppointmentsKeys } from "./staff-appointments.keys";
import { exportStaffAppointments, getAppointmentSlots, getStaffAppointments, getStaffWaitlist } from "./staff-appointments.api";
import type { StaffAppointmentFilters, StaffWaitlistFilters } from "@/types";

export function staffAppointmentsQueryOptions(filters: StaffAppointmentFilters) {
	return queryOptions({
		queryKey: staffAppointmentsKeys.appointmentList(filters),
		queryFn: () => getStaffAppointments(filters),
		placeholderData: keepPreviousData,
	});
}

export function staffWaitlistQueryOptions(filters: StaffWaitlistFilters) {
	return queryOptions({
		queryKey: staffAppointmentsKeys.waitlistList(filters),
		queryFn: () => getStaffWaitlist(filters),
		placeholderData: keepPreviousData,
	});
}

export function appointmentSlotsQueryOptions(doctorId: string, date: string) {
	return queryOptions({
		queryKey: staffAppointmentsKeys.slots(doctorId, date),
		queryFn: () => getAppointmentSlots(doctorId, date),
		enabled: Boolean(doctorId && date),
	});
}

export function staffAppointmentsExportQueryOptions(filters: Omit<StaffAppointmentFilters, "tab" | "page" | "pageSize">) {
	return queryOptions({
		queryKey: staffAppointmentsKeys.export(filters),
		queryFn: () => exportStaffAppointments(filters),
	});
}
