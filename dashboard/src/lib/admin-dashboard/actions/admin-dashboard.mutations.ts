import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelAdminAppointment, exportAdminAppointments } from "./admin-dashboard.api";
import { adminDashboardKeys } from "./admin-dashboard.keys";
import type { AdminAppointmentsExportFilters } from "@/types";

export function adminDashboardExportMutationOptions(filters: AdminAppointmentsExportFilters) {
	return {
		mutationKey: adminDashboardKeys.export(filters),
		mutationFn: () => exportAdminAppointments(filters),
	};
}

export function useAdminDashboardExportMutation(filters: AdminAppointmentsExportFilters) {
	return useMutation(adminDashboardExportMutationOptions(filters));
}

export function cancelAdminAppointmentMutationOptions(client: ReturnType<typeof useQueryClient>) {
	return {
		mutationKey: [...adminDashboardKeys.root, "cancel-appointment"] as const,
		mutationFn: (appointmentId: string) => cancelAdminAppointment(appointmentId),
		onSuccess: () => {
			void client.invalidateQueries({ queryKey: adminDashboardKeys.root });
		},
	};
}

export function useCancelAdminAppointmentMutation() {
	const client = useQueryClient();
	return useMutation(cancelAdminAppointmentMutationOptions(client));
}
