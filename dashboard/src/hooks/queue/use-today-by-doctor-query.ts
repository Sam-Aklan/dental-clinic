import { useQuery } from "@tanstack/react-query";
import { todayByDoctorQueryOptions } from "@/lib/queue";

export function useTodayByDoctorQuery(date: string) {
	return useQuery(todayByDoctorQueryOptions(date));
}
