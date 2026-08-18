import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelAppointmentMutationOptions } from "@/lib/appointments/actions";

export function useCancelAppointmentMutation() {
	const queryClient = useQueryClient();
	return useMutation(cancelAppointmentMutationOptions(queryClient));
}
