import type { QueryClient } from "@tanstack/react-query";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { doctorQueueKeys } from "./doctor-queue.keys";
import { updateAppointmentNote, updateAppointmentStatus } from "./doctor-queue.api";
import { queueKeys } from "@/lib/queue";
import type { AppointmentStatus } from "@/types";

export function appointmentStatusMutationOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, status, needsFollowUp }: { id: string; status: AppointmentStatus; needsFollowUp?: boolean }) => updateAppointmentStatus(id, { status, needsFollowUp }),
		onSuccess: async (_data: void, variables: { id: string; needsFollowUp?: boolean }) => {
			await queryClient.invalidateQueries({ queryKey: doctorQueueKeys.all });
			await queryClient.invalidateQueries({ queryKey: doctorQueueKeys.appointmentStatus(variables.id) });
			await queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todaySummary() });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todayByDoctor() });
		},
	};
}

export function appointmentNoteMutationOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, notes }: { id: string; notes: string }) => updateAppointmentNote(id, notes),
		onSuccess: async (_data: unknown, variables: { id: string }) => {
			await queryClient.invalidateQueries({ queryKey: doctorQueueKeys.all });
			await queryClient.invalidateQueries({ queryKey: doctorQueueKeys.appointmentNote(variables.id) });
			await queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todaySummary() });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todayByDoctor() });
		},
	};
}
