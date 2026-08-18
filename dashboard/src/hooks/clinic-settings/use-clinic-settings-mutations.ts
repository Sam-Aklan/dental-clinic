import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clinicSettingsKeys, updateClinicSettingsMutationOptions, updateWeeklyHoursMutationOptions, addHolidayMutationOptions, deleteHolidayMutationOptions } from "@/lib/clinic-settings";
import { bookingKeys } from "@/lib/booking";
import { adminDashboardKeys } from "@/lib/admin-dashboard";

export function useUpdateClinicSettings() {
	const queryClient = useQueryClient();
	return useMutation({
		...updateClinicSettingsMutationOptions(),
		onSuccess: async (data) => {
			queryClient.setQueryData(clinicSettingsKeys.bookingRules(), data);
			await queryClient.invalidateQueries({ queryKey: clinicSettingsKeys.bookingRules() });
			await queryClient.invalidateQueries({ queryKey: bookingKeys.all });
		},
	});
}

export function useUpdateWeeklyHours() {
	const queryClient = useQueryClient();
	return useMutation({
		...updateWeeklyHoursMutationOptions(),
		onSuccess: async (data) => {
			queryClient.setQueryData(clinicSettingsKeys.workingHours(), data);
			await queryClient.invalidateQueries({ queryKey: clinicSettingsKeys.workingHours() });
			await queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			await queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root });
		},
	});
}

export function useAddHoliday() {
	const queryClient = useQueryClient();
	return useMutation({
		...addHolidayMutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: clinicSettingsKeys.holidayClosures() });
			await queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			await queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root });
		},
	});
}

export function useDeleteHoliday() {
	const queryClient = useQueryClient();
	return useMutation({
		...deleteHolidayMutationOptions(),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: clinicSettingsKeys.holidayClosures() });
			await queryClient.invalidateQueries({ queryKey: bookingKeys.all });
			await queryClient.invalidateQueries({ queryKey: adminDashboardKeys.root });
		},
	});
}
