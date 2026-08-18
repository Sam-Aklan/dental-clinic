import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRescheduleStaffAppointmentMutationOptions } from "@/lib/staff-appointments";

export function useRescheduleAppointmentMutation() {
	const queryClient = useQueryClient();
	return useMutation(createRescheduleStaffAppointmentMutationOptions(queryClient));
}
