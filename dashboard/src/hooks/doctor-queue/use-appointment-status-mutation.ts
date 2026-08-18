import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentStatusMutationOptions } from "@/lib/doctor-queue";

export function useAppointmentStatusMutation() {
	const queryClient = useQueryClient();
	return useMutation(appointmentStatusMutationOptions(queryClient));
}
