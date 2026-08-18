import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentNotesMutationOptions, appointmentStatusMutationOptions } from "@/lib/doctor-today";

export function useDoctorTodayMutations() {
	const queryClient = useQueryClient();
	const statusMutation = useMutation(appointmentStatusMutationOptions(queryClient));
	const notesMutation = useMutation(appointmentNotesMutationOptions(queryClient));

	return {
		statusMutation,
		notesMutation,
		updateStatus: statusMutation.mutateAsync,
		updateNotes: notesMutation.mutateAsync,
	} as const;
}
