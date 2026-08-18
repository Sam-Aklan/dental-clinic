import { useQuery } from "@tanstack/react-query";
import { doctorQueueQueryOptions } from "@/lib/doctor-queue";

export function useDoctorQueueQuery(date: string) {
	return useQuery(doctorQueueQueryOptions(date));
}
