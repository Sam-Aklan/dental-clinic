import { useQuery } from "@tanstack/react-query";
import { slotsQueryOptions, getDayBounds } from "@/lib/booking";

export function useAvailableSlotsQuery(doctorId: string | null, selectedDate: string, includeReserved = false) {
	const { from, to } = getDayBounds(selectedDate);

	return useQuery({
		...slotsQueryOptions({ doctorId: doctorId!, from, to, includeReserved }),
		enabled: Boolean(doctorId && selectedDate),
	});
}
