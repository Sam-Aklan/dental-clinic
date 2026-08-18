import type { QueryClient, UseMutationOptions } from "@tanstack/react-query";
import { adminDashboardKeys } from "@/lib/admin-dashboard";
import { appointmentsKeys } from "./appointments.keys";
import { cancelMyAppointment } from "./appointments.api";
import { queueKeys } from "@/lib/queue";

export function cancelAppointmentMutationOptions(queryClient: QueryClient): UseMutationOptions<void, unknown, string> {
	return {
		mutationFn: (appointmentId: string) => cancelMyAppointment(appointmentId),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: appointmentsKeys.all });
			await queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todaySummary() });
			await queryClient.invalidateQueries({ queryKey: queueKeys.todayByDoctor() });
		},
	};
}
