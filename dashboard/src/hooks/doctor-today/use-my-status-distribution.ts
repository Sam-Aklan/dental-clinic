import { useQuery } from "@tanstack/react-query";
import { myStatusDistributionQueryOptions } from "@/lib/doctor-today";

export function useMyStatusDistribution(from: string, to: string) {
	return useQuery(myStatusDistributionQueryOptions(from, to));
}
