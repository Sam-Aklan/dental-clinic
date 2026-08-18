import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelAdminAppointmentMutationOptions } from "@/lib/admin-dashboard";

export function useCancelAdminAppointmentMutation() {
	const client = useQueryClient();
	return useMutation(cancelAdminAppointmentMutationOptions(client));
}
