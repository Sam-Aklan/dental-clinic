import { useQuery } from "@tanstack/react-query";
import { adminDashboardWaitlistSummaryQueryOptions } from "@/lib/admin-dashboard";

export function useAdminWaitlistSummaryQuery() {
	return useQuery(adminDashboardWaitlistSummaryQueryOptions());
}
