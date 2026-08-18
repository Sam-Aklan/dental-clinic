import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { adminDashboardKeys } from "./admin-dashboard.keys";
import {
	getAdminAppointmentTrends,
	getAdminAppointments,
	getAdminAppointmentsByWeekday,
	getAdminCancellationTrends,
	getAdminDoctorUtilization,
	getAdminFollowUps,
	getAdminKpiSummary,
	getAdminStatusDistribution,
	getAdminWaitlistSummary,
	getAdminWaitlist,
} from "./admin-dashboard.api";
import type { AdminAppointmentsFilters, AdminDashboardQueryParams, AdminFollowUpsFilters, AdminWaitlistFilters } from "@/types";

export function adminDashboardKpiSummaryQueryOptions(params: AdminDashboardQueryParams) {
	return queryOptions({ queryKey: adminDashboardKeys.kpiSummary(params), queryFn: () => getAdminKpiSummary(params), staleTime: 60_000, refetchInterval: 60_000 });
}

export function adminDashboardTrendsQueryOptions(params: AdminDashboardQueryParams) {
	return queryOptions({ queryKey: adminDashboardKeys.trends(params), queryFn: () => getAdminAppointmentTrends(params), staleTime: 60_000, refetchInterval: 60_000, placeholderData: keepPreviousData });
}

export function adminDashboardStatusDistributionQueryOptions(params: AdminDashboardQueryParams) {
	return queryOptions({ queryKey: adminDashboardKeys.statusDistribution(params), queryFn: () => getAdminStatusDistribution(params), staleTime: 60_000, refetchInterval: 60_000, placeholderData: keepPreviousData });
}

export function adminDashboardDoctorUtilizationQueryOptions(params: AdminDashboardQueryParams) {
	return queryOptions({ queryKey: adminDashboardKeys.doctorUtilization(params), queryFn: () => getAdminDoctorUtilization(params), staleTime: 60_000, refetchInterval: 60_000, placeholderData: keepPreviousData });
}

export function adminDashboardAppointmentsByWeekdayQueryOptions(params: AdminDashboardQueryParams) {
	return queryOptions({ queryKey: adminDashboardKeys.appointmentsByWeekday(params), queryFn: () => getAdminAppointmentsByWeekday(params), staleTime: 60_000, refetchInterval: 60_000, placeholderData: keepPreviousData });
}

export function adminDashboardCancellationTrendsQueryOptions(params: AdminDashboardQueryParams) {
	return queryOptions({ queryKey: adminDashboardKeys.cancellationTrends(params), queryFn: () => getAdminCancellationTrends(params), staleTime: 60_000, refetchInterval: 60_000, placeholderData: keepPreviousData });
}

export function adminDashboardWaitlistSummaryQueryOptions() {
	return queryOptions({ queryKey: adminDashboardKeys.waitlistSummary(), queryFn: () => getAdminWaitlistSummary(), staleTime: 60_000, refetchInterval: 60_000 });
}

export function adminDashboardAppointmentsQueryOptions(filters: AdminAppointmentsFilters) {
	return queryOptions({ queryKey: adminDashboardKeys.appointments(filters), queryFn: () => getAdminAppointments(filters), staleTime: 30_000, placeholderData: keepPreviousData });
}

export function adminDashboardFollowUpsQueryOptions(filters: AdminFollowUpsFilters) {
	return queryOptions({ queryKey: adminDashboardKeys.followUps(filters), queryFn: () => getAdminFollowUps(filters), staleTime: 30_000, placeholderData: keepPreviousData });
}

export function adminDashboardWaitlistQueryOptions(filters: AdminWaitlistFilters) {
	return queryOptions({ queryKey: adminDashboardKeys.waitlist(filters), queryFn: () => getAdminWaitlist(filters), staleTime: 30_000, placeholderData: keepPreviousData });
}
