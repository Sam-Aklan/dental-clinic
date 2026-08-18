import { useQuery } from "@tanstack/react-query";
import { adminDashboardAppointmentsQueryOptions, adminDashboardFollowUpsQueryOptions, adminDashboardWaitlistQueryOptions } from "@/lib/admin-dashboard";
import type { AdminAppointmentsFilters, AdminFollowUpsFilters, AdminWaitlistFilters } from "@/types";

export function useAdminDashboardTableQueries(appointmentsFilters: AdminAppointmentsFilters, followUpsFilters: AdminFollowUpsFilters, waitlistFilters: AdminWaitlistFilters) {
	return {
		appointments: useQuery(adminDashboardAppointmentsQueryOptions(appointmentsFilters)),
		followUps: useQuery(adminDashboardFollowUpsQueryOptions(followUpsFilters)),
		waitlist: useQuery(adminDashboardWaitlistQueryOptions(waitlistFilters)),
	};
}
