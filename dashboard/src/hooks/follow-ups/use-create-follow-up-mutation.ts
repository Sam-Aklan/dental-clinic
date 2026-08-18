import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { bookingKeys } from "@/lib/booking";
import { doctorQueueKeys } from "@/lib/doctor-queue";
import { followUpKeys, createFollowUpMutationFn, type FollowUpSlotsQueryParams } from "@/lib/follow-ups";
import { queueKeys } from "@/lib/queue";
import { staffAppointmentsKeys } from "@/lib/staff-appointments";
import type { CreateFollowUpRequest, FollowUpResponse } from "@/types";

export interface UseCreateFollowUpMutationOptions {
	slotQueryParams?: FollowUpSlotsQueryParams | null;
	onSuccess?: (response: FollowUpResponse) => void;
	onConflict?: () => void;
}

export function useCreateFollowUpMutation(options: UseCreateFollowUpMutationOptions = {}) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: CreateFollowUpRequest) => createFollowUpMutationFn(payload),
		onSuccess: async (response) => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: doctorQueueKeys.all }),
				queryClient.invalidateQueries({ queryKey: queueKeys.all }),
				queryClient.invalidateQueries({ queryKey: bookingKeys.all }),
				queryClient.invalidateQueries({ queryKey: staffAppointmentsKeys.all }),
				queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root }),
				queryClient.invalidateQueries({ queryKey: followUpKeys.all }),
			]);
			options.onSuccess?.(response);
		},
		onError: async (error) => {
			if (isAxiosError(error) && error.response?.status === 409) {
				if (options.slotQueryParams) {
					await queryClient.invalidateQueries({ queryKey: followUpKeys.slots(options.slotQueryParams.doctorId, options.slotQueryParams.from, options.slotQueryParams.to) });
				}
				options.onConflict?.();
			}
		},
	});
}
