import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { doctorTodayKeys } from "./doctor-today.keys";
import { getDoctorSchedule, getMyHourlyLoad, getMyStats, getMyStatusDistribution, getMyTrends } from "./doctor-today.api";
import type { DoctorTodayFilters } from "@/types";

export function doctorTodayScheduleQueryOptions(filters: Pick<DoctorTodayFilters, "from" | "to" | "status" | "page" | "pageSize" | "sortBy" | "sortDir">) {
	const scheduleKey = filters.from === filters.to ? doctorTodayKeys.schedule(filters.from) : doctorTodayKeys.weeklyAppointments(filters);
	return queryOptions({
		queryKey: scheduleKey,
		queryFn: () => getDoctorSchedule(filters),
		placeholderData: keepPreviousData,
		refetchInterval: 60_000,
	});
}

export function myStatsQueryOptions(date: string) {
	return queryOptions({
		queryKey: doctorTodayKeys.stats(date),
		queryFn: () => getMyStats(date),
		staleTime: 60_000,
		refetchInterval: 30_000,
	});
}

export function myTrendsQueryOptions(week: string) {
	return queryOptions({
		queryKey: doctorTodayKeys.trends(week),
		queryFn: () => getMyTrends(week),
		staleTime: 60_000,
	});
}

export function myStatusDistributionQueryOptions(from: string, to: string) {
	return queryOptions({
		queryKey: doctorTodayKeys.statusDistribution(from, to),
		queryFn: () => getMyStatusDistribution(from, to),
		staleTime: 60_000,
	});
}

export function myHourlyLoadQueryOptions(from: string, to: string) {
	return queryOptions({
		queryKey: doctorTodayKeys.hourlyLoad(from, to),
		queryFn: () => getMyHourlyLoad(from, to),
		staleTime: 60_000,
	});
}
