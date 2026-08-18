import { useQuery } from "@tanstack/react-query";
import { myStatsQueryOptions } from "@/lib/doctor-today";

export function useMyStats(date: string) {
	return useQuery(myStatsQueryOptions(date));
}
