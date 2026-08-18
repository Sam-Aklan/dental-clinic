import { queryOptions } from "@tanstack/react-query";
import { getStaffQueue, getTodayByDoctor, getTodaySummary } from "./queue.api";
import { queueKeys } from "./queue.keys";
import type { StaffQueueQueryParams } from "@/types";

export function staffQueueQueryOptions(params: StaffQueueQueryParams) {
	return queryOptions({
		queryKey: queueKeys.staffQueueFiltered(params),
		queryFn: () => getStaffQueue(params),
		refetchInterval: 60_000,
		placeholderData: (previous) => previous,
	});
}

export function todaySummaryQueryOptions(date: string) {
	return queryOptions({
		queryKey: [...queueKeys.todaySummary(), date] as const,
		queryFn: () => getTodaySummary(date),
		refetchInterval: 30_000,
		placeholderData: (previous) => previous,
	});
}

export function todayByDoctorQueryOptions(date: string) {
	return queryOptions({
		queryKey: [...queueKeys.todayByDoctor(), date] as const,
		queryFn: () => getTodayByDoctor(date),
		refetchInterval: 30_000,
		placeholderData: (previous) => previous,
	});
}
