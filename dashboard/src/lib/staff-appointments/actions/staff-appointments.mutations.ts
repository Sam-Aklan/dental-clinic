import type { QueryClient, UseMutationOptions } from "@tanstack/react-query";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { staffAppointmentsKeys } from "./staff-appointments.keys";
import { cancelStaffAppointment, exportStaffAppointments, markStaffAppointmentNoShow, removeStaffWaitlistEntry, rescheduleStaffAppointment } from "./staff-appointments.api";
import { queueKeys } from "@/lib/queue";
import type { ExportAppointmentsParams, RescheduleAppointmentDTO, StaffCancelAppointmentDTO, UpdateStatusDTO } from "@/types";

export function createCancelStaffAppointmentMutationOptions(queryClient: QueryClient): UseMutationOptions<void, unknown, { id: string; payload: StaffCancelAppointmentDTO }> {
	return {
		mutationFn: ({ id, payload }) => cancelStaffAppointment(id, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: staffAppointmentsKeys.all });
			await queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todaySummary() });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todayByDoctor() });
		},
	};
}

export function createRescheduleStaffAppointmentMutationOptions(queryClient: QueryClient): UseMutationOptions<void, unknown, { id: string; payload: RescheduleAppointmentDTO }> {
	return {
		mutationFn: ({ id, payload }) => rescheduleStaffAppointment(id, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: staffAppointmentsKeys.all });
			await queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todaySummary() });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todayByDoctor() });
		},
	};
}

export function createMarkStaffNoShowMutationOptions(queryClient: QueryClient): UseMutationOptions<void, unknown, { id: string; payload: UpdateStatusDTO }> {
	return {
		mutationFn: ({ id, payload }) => markStaffAppointmentNoShow(id, payload),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: staffAppointmentsKeys.all });
			await queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todaySummary() });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todayByDoctor() });
		},
	};
}

export function createRemoveStaffWaitlistEntryMutationOptions(queryClient: QueryClient): UseMutationOptions<void, unknown, string> {
	return {
		mutationFn: (id) => removeStaffWaitlistEntry(id),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: staffAppointmentsKeys.all });
			await queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todaySummary() });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todayByDoctor() });
		},
	};
}

export function createExportStaffAppointmentsMutationOptions(queryClient: QueryClient): UseMutationOptions<Blob, unknown, Omit<ExportAppointmentsParams, "format">> {
	return {
		mutationFn: (filters) => exportStaffAppointments(filters),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["staff-appointments", "export"] });
		},
	};
}
