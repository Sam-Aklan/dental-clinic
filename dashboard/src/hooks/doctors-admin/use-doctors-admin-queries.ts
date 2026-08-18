import { useQuery } from "@tanstack/react-query";
import { doctorDirectoryQueryOptions, doctorOverridesQueryOptions, doctorQueryOptions } from "@/lib/doctors-admin";
import type { DoctorFilters } from "@/types";

export function useDoctors(filters: DoctorFilters) {
	return useQuery(doctorDirectoryQueryOptions(filters));
}

export function useDoctor(id: string) {
	return useQuery(doctorQueryOptions(id));
}

export function useDoctorOverrides(doctorId: string, enabled = true) {
	return useQuery({
		...doctorOverridesQueryOptions(doctorId),
		enabled: enabled && Boolean(doctorId),
	});
}
