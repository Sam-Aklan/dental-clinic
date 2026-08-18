import type { AdminAppointmentsExportFilters, AdminAppointmentsFilters, AdminDashboardQueryParams, AdminFollowUpsFilters, AdminWaitlistFilters } from "@/types";

export const adminDashboardKeys = {
	root: ["admin-dashboard"] as const,
	kpiSummary: (params: AdminDashboardQueryParams) => ["admin-dashboard", "kpi-summary", params] as const,
	trends: (params: AdminDashboardQueryParams) => ["admin-dashboard", "trends", params] as const,
	statusDistribution: (params: AdminDashboardQueryParams) => ["admin-dashboard", "status-distribution", params] as const,
	doctorUtilization: (params: AdminDashboardQueryParams) => ["admin-dashboard", "doctor-utilization", params] as const,
	appointmentsByWeekday: (params: AdminDashboardQueryParams) => ["admin-dashboard", "appointments-by-weekday", params] as const,
	cancellationTrends: (params: AdminDashboardQueryParams) => ["admin-dashboard", "cancellation-trends", params] as const,
	waitlistSummary: () => ["admin-dashboard", "waitlist-summary"] as const,
	appointments: (filters: AdminAppointmentsFilters) => ["admin-dashboard", "appointments", filters] as const,
	followUps: (filters: AdminFollowUpsFilters) => ["admin-dashboard", "follow-ups", filters] as const,
	waitlist: (filters: AdminWaitlistFilters) => ["admin-dashboard", "waitlist", filters] as const,
	export: (filters: AdminAppointmentsExportFilters) => ["admin-dashboard", "export", filters] as const,
};
