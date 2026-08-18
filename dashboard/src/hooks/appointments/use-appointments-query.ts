import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AppointmentFilterState } from "@/types";
import { buildAppointmentListParams } from "@/lib/appointments/helpers";
import { appointmentsQueryOptions } from "@/lib/appointments/actions";

export function useAppointmentsQuery(state: AppointmentFilterState) {
	const referenceNow = useMemo(() => new Date(), []);
	const params = useMemo(() => buildAppointmentListParams(state, referenceNow), [state, referenceNow]);
	return useQuery(appointmentsQueryOptions(params));
}
