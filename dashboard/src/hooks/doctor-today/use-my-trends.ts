import { useQuery } from "@tanstack/react-query";
import { myTrendsQueryOptions } from "@/lib/doctor-today";

export function useMyTrends(week: string) {
	return useQuery(myTrendsQueryOptions(week));
}
