import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { updateStatusMutationOptions } from "@/lib/queue";

export function useUpdateStatusMutation() {
	const client = useQueryClient();
	return useMutation(updateStatusMutationOptions(client));
}
