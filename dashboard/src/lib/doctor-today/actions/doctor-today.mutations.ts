import type { QueryClient } from "@tanstack/react-query";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { doctorTodayKeys } from "./doctor-today.keys";
import { updateDoctorTodayAppointmentNotes, updateDoctorTodayAppointmentStatus } from "./doctor-today.api";
import { queueKeys } from "@/lib/queue";
import type { DoctorTodayAppointmentStatus } from "@/types";

const INVALIDATION_KEYS = [
	doctorTodayKeys.all,
	adminDashboardKeys.root,
	queueKeys.todaySummary(),
	queueKeys.todayByDoctor(),
	["appointments", "doctor-queue"] as const,
	["appointments", "doctor-week"] as const,
	["analytics", "my-stats"] as const,
	["analytics", "my-trends"] as const,
	["analytics", "my-hourly-load"] as const,
	["analytics", "my-status-distribution"] as const,
] as const;

async function invalidateDoctorTodayCaches(queryClient: QueryClient, appointmentId: string) {
	for (const queryKey of INVALIDATION_KEYS) {
		await queryClient.invalidateQueries({ queryKey });
	}
	await queryClient.invalidateQueries({ queryKey: doctorTodayKeys.appointmentStatus(appointmentId) });
	await queryClient.invalidateQueries({ queryKey: doctorTodayKeys.appointmentNotes(appointmentId) });
}

export function appointmentStatusMutationOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, status }: { id: string; status: DoctorTodayAppointmentStatus }) => updateDoctorTodayAppointmentStatus(id, status),
		onSuccess: async (_data: void, variables: { id: string }) => {
			await invalidateDoctorTodayCaches(queryClient, variables.id);
		},
	};
}

export function appointmentNotesMutationOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, notes }: { id: string; notes: string }) => updateDoctorTodayAppointmentNotes(id, notes),
		onSuccess: async (_data: void, variables: { id: string }) => {
			await invalidateDoctorTodayCaches(queryClient, variables.id);
		},
	};
}
