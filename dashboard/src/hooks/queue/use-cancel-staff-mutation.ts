import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { cancelStaffMutationOptions } from "@/lib/queue";

export function useCancelStaffMutation() {
	const client = useQueryClient();
	return useMutation(cancelStaffMutationOptions(client));
}
