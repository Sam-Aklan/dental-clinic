import { useQuery } from "@tanstack/react-query";
import type { StaffWaitlistFilters } from "@/types";
import { staffWaitlistQueryOptions } from "@/lib/staff-appointments";

export function useStaffWaitlistQuery(filters: StaffWaitlistFilters) {
	return useQuery(staffWaitlistQueryOptions(filters));
}
