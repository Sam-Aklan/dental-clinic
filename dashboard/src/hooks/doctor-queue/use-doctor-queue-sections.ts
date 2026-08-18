import { useMemo } from "react";
import type { DoctorQueueAppointment, DoctorQueueFilterState } from "@/types";
import { buildDoctorQueueSections, buildDoctorQueueSummary } from "@/lib/doctor-queue";

export function useDoctorQueueSections(appointments: DoctorQueueAppointment[] | undefined, filters: DoctorQueueFilterState) {
	return useMemo(() => {
		const data = appointments ?? [];
		return {
			summary: buildDoctorQueueSummary(data),
			sections: buildDoctorQueueSections(data, filters),
		};
	}, [appointments, filters]);
}
