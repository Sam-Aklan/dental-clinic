import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createExportStaffAppointmentsMutationOptions } from "@/lib/staff-appointments";

export function useAppointmentsExportMutation() {
	const queryClient = useQueryClient();
	return useMutation(createExportStaffAppointmentsMutationOptions(queryClient));
}
