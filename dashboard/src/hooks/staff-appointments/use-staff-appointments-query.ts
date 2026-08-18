import { useQuery } from "@tanstack/react-query";
import type { StaffAppointmentFilters } from "@/types";
import { staffAppointmentsQueryOptions } from "@/lib/staff-appointments";

export function useStaffAppointmentsQuery(filters: StaffAppointmentFilters) {
	return useQuery(staffAppointmentsQueryOptions(filters));
}
