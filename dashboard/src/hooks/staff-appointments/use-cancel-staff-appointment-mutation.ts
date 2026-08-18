import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCancelStaffAppointmentMutationOptions } from "@/lib/staff-appointments";

export function useCancelStaffAppointmentMutation() {
	const queryClient = useQueryClient();
	return useMutation(createCancelStaffAppointmentMutationOptions(queryClient));
}
