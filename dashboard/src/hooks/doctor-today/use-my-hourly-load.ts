import { useQuery } from "@tanstack/react-query";
import { myHourlyLoadQueryOptions } from "@/lib/doctor-today";

export function useMyHourlyLoad(from: string, to: string) {
	return useQuery(myHourlyLoadQueryOptions(from, to));
}
