import { useQuery } from "@tanstack/react-query";
import { appointmentSlotsQueryOptions } from "@/lib/staff-appointments";

export function useAppointmentSlotsQuery(doctorId: string, date: string) {
	return useQuery(appointmentSlotsQueryOptions(doctorId, date));
}
