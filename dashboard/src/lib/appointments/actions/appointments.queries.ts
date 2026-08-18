import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import type { AppointmentListParams } from "@/types";
import { appointmentsKeys } from "./appointments.keys";
import { getMyAppointments } from "./appointments.api";

export function appointmentsQueryOptions(params: AppointmentListParams) {
	return queryOptions({
		queryKey: appointmentsKeys.list(params),
		queryFn: () => getMyAppointments(params),
		placeholderData: keepPreviousData,
		staleTime: 30_000,
	});
}
