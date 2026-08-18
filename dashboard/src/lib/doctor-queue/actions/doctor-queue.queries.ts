import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { doctorQueueKeys } from "./doctor-queue.keys";
import { getClinicConfig, getDoctorQueue } from "./doctor-queue.api";

export function clinicConfigQueryOptions() {
	return queryOptions({
		queryKey: doctorQueueKeys.clinicConfig(),
		queryFn: getClinicConfig,
		staleTime: 5 * 60_000,
	});
}

export function doctorQueueQueryOptions(date: string) {
	return queryOptions({
		queryKey: doctorQueueKeys.date(date),
		queryFn: () => getDoctorQueue(date),
		placeholderData: keepPreviousData,
		refetchInterval: 60_000,
	});
}
