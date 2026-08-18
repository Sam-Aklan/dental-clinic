import { useQuery } from "@tanstack/react-query";
import { adminDashboardAppointmentsByWeekdayQueryOptions, adminDashboardCancellationTrendsQueryOptions, adminDashboardDoctorUtilizationQueryOptions, adminDashboardStatusDistributionQueryOptions, adminDashboardTrendsQueryOptions } from "@/lib/admin-dashboard";
import type { AdminDashboardQueryParams } from "@/types";

export function useAdminDashboardAnalyticsQueries(params: AdminDashboardQueryParams) {
	return {
		trends: useQuery(adminDashboardTrendsQueryOptions(params)),
		statusDistribution: useQuery(adminDashboardStatusDistributionQueryOptions(params)),
		doctorUtilization: useQuery(adminDashboardDoctorUtilizationQueryOptions(params)),
		appointmentsByWeekday: useQuery(adminDashboardAppointmentsByWeekdayQueryOptions(params)),
		cancellationTrends: useQuery(adminDashboardCancellationTrendsQueryOptions(params)),
	};
}
