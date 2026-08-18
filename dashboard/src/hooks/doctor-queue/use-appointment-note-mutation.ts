import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentNoteMutationOptions } from "@/lib/doctor-queue";

export function useAppointmentNoteMutation() {
	const queryClient = useQueryClient();
	return useMutation(appointmentNoteMutationOptions(queryClient));
}
