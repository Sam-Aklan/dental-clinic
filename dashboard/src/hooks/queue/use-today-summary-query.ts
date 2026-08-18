import { useQuery } from "@tanstack/react-query";
import { todaySummaryQueryOptions } from "@/lib/queue";

export function useTodaySummaryQuery(date: string) {
	return useQuery(todaySummaryQueryOptions(date));
}
