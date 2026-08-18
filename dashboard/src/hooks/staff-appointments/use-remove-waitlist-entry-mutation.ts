import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRemoveStaffWaitlistEntryMutationOptions } from "@/lib/staff-appointments";

export function useRemoveWaitlistEntryMutation() {
	const queryClient = useQueryClient();
	return useMutation(createRemoveStaffWaitlistEntryMutationOptions(queryClient));
}
