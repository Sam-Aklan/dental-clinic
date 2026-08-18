import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { cancelStaffAppointment, issueKioskToken, updateAppointmentStatus } from "./queue.api";
import { queueKeys } from "./queue.keys";
import type { AppointmentStatus, IssueKioskTokenPayload } from "@/types";

type StatusPayload = { id: string; status: AppointmentStatus; needsFollowUp?: boolean };
type CancelPayload = { id: string; reason?: string };
type QueryClientLike = ReturnType<typeof useQueryClient>;

function invalidateQueue(client: QueryClientLike, date?: string) {
	void client.invalidateQueries({ queryKey: adminDashboardKeys.root });
	void client.invalidateQueries({ queryKey: queueKeys.staffQueue() });
	void client.invalidateQueries({ queryKey: queueKeys.todaySummary() });
	void client.invalidateQueries({ queryKey: queueKeys.todayByDoctor() });
	if (date) {
		void client.invalidateQueries({ queryKey: [...queueKeys.all, "staff", { date }] });
	}
}

export function updateStatusMutationOptions(client: QueryClientLike) {
	return {
		mutationKey: [...queueKeys.all, "update-status"] as const,
		mutationFn: ({ id, status, needsFollowUp }: StatusPayload) => updateAppointmentStatus(id, status, needsFollowUp),
		onSuccess: () => invalidateQueue(client),
	};
}

export function cancelStaffMutationOptions(client: QueryClientLike) {
	return {
		mutationKey: [...queueKeys.all, "cancel-staff"] as const,
		mutationFn: ({ id, reason }: CancelPayload) => cancelStaffAppointment(id, reason),
		onSuccess: () => invalidateQueue(client),
	};
}

export function issueKioskTokenMutationOptions() {
	return {
		mutationKey: [...queueKeys.all, "issue-kiosk-token"] as const,
		mutationFn: (payload: IssueKioskTokenPayload) => issueKioskToken(payload),
	};
}

export function useUpdateStatusMutation() {
	const client = useQueryClient();
	return useMutation(updateStatusMutationOptions(client));
}

export function useCancelStaffMutation() {
	const client = useQueryClient();
	return useMutation(cancelStaffMutationOptions(client));
}

export function useIssueKioskTokenMutation() {
	return useMutation(issueKioskTokenMutationOptions());
}
