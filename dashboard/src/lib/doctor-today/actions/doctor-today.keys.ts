import type { DoctorTodayFilters } from "@/types";

export const doctorTodayKeys = {
	all: ["doctor-today"] as const,
	schedule: (date: string) => [...doctorTodayKeys.all, "schedule", date] as const,
	weeklyAppointments: (filters: Pick<DoctorTodayFilters, "from" | "to" | "status" | "page" | "pageSize" | "sortBy" | "sortDir">) =>
		[...doctorTodayKeys.all, "weekly", filters.from, filters.to, filters.status?.length ? filters.status.join(",") : "all", String(filters.page ?? 1), String(filters.pageSize ?? 20), filters.sortBy ?? "startsAt", filters.sortDir ?? "asc"] as const,
	stats: (date: string) => [...doctorTodayKeys.all, "stats", date] as const,
	trends: (week: string) => [...doctorTodayKeys.all, "trends", week] as const,
	statusDistribution: (from: string, to: string) => [...doctorTodayKeys.all, "status-distribution", from, to] as const,
	hourlyLoad: (from: string, to: string) => [...doctorTodayKeys.all, "hourly-load", from, to] as const,
	appointmentStatus: (id: string) => [...doctorTodayKeys.all, "status", id] as const,
	appointmentNotes: (id: string) => [...doctorTodayKeys.all, "notes", id] as const,
};
