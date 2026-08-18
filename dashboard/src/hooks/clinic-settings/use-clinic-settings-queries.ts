import { useQuery } from "@tanstack/react-query";
import { clinicBookingSettingsQueryOptions, weeklyHoursQueryOptions, holidayClosuresQueryOptions } from "@/lib/clinic-settings";

export function useClinicSettings() {
	return useQuery(clinicBookingSettingsQueryOptions());
}

export function useWeeklyHours() {
	return useQuery(weeklyHoursQueryOptions());
}

export function useHolidays() {
	return useQuery(holidayClosuresQueryOptions());
}
