import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMarkStaffNoShowMutationOptions } from "@/lib/staff-appointments";

export function useMarkNoShowMutation() {
	const queryClient = useQueryClient();
	return useMutation(createMarkStaffNoShowMutationOptions(queryClient));
}
