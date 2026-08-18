import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createJoinWaitlistMutationOptions,
	createUpdateWaitlistWindowMutationOptions,
	createLeaveWaitlistMutationOptions,
} from "@/lib/waitlist";

export function useJoinWaitlistMutation() {
	const queryClient = useQueryClient();
	return useMutation(createJoinWaitlistMutationOptions(queryClient));
}

export function useUpdateWaitlistWindowMutation() {
	const queryClient = useQueryClient();
	return useMutation(createUpdateWaitlistWindowMutationOptions(queryClient));
}

export function useLeaveWaitlistMutation() {
	const queryClient = useQueryClient();
	return useMutation(createLeaveWaitlistMutationOptions(queryClient));
}
