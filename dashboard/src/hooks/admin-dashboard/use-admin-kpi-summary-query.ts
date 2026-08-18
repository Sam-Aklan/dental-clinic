import { useQuery } from "@tanstack/react-query";
import { adminDashboardKpiSummaryQueryOptions } from "@/lib/admin-dashboard";
import type { AdminDashboardQueryParams } from "@/types";

export function useAdminKpiSummaryQuery(params: AdminDashboardQueryParams) {
	return useQuery(adminDashboardKpiSummaryQueryOptions(params));
}
