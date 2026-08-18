import { queryOptions } from "@tanstack/react-query";
import { clinicSettingsKeys } from "./clinic-settings.keys";
import { addHolidayClosure, deleteHolidayClosure, getClinicBookingSettings, getHolidayClosures, getWeeklyHours, updateClinicBookingSettings, updateWeeklyHours } from "./clinic-settings.api";

export function clinicBookingSettingsQueryOptions() {
	return queryOptions({
		queryKey: clinicSettingsKeys.bookingRules(),
		queryFn: getClinicBookingSettings,
	});
}

export function weeklyHoursQueryOptions() {
	return queryOptions({
		queryKey: clinicSettingsKeys.workingHours(),
		queryFn: getWeeklyHours,
	});
}

export function holidayClosuresQueryOptions() {
	return queryOptions({
		queryKey: clinicSettingsKeys.holidayClosures(),
		queryFn: getHolidayClosures,
	});
}

export function updateClinicSettingsMutationOptions() {
	return { mutationFn: updateClinicBookingSettings };
}

export function updateWeeklyHoursMutationOptions() {
	return { mutationFn: updateWeeklyHours };
}

export function addHolidayMutationOptions() {
	return { mutationFn: addHolidayClosure };
}

export function deleteHolidayMutationOptions() {
	return { mutationFn: deleteHolidayClosure };
}
