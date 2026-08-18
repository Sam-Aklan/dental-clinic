import { queryOptions } from "@tanstack/react-query";
import { bookingKeys } from "./booking.keys";
import { getDoctors, getAvailableSlots } from "./booking.api";
import type { SlotsQueryParams } from "@/types";

export function doctorsQueryOptions() {
	return queryOptions({
		queryKey: bookingKeys.doctors(),
		queryFn: getDoctors,
		staleTime: 5 * 60_000,
	});
}

export function slotsQueryOptions(params: SlotsQueryParams) {
	return queryOptions({
		queryKey: bookingKeys.slots(params.doctorId, params.from, params.to, params.includeReserved),
		queryFn: () => getAvailableSlots(params),
	});
}
