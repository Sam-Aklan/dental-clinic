import { queryOptions } from "@tanstack/react-query";
import { doctorsKeys } from "./doctors.keys";
import { createDoctor, createScheduleOverride, deleteScheduleOverride, getDoctor, getDoctors, getScheduleOverrides, updateDoctor } from "./doctors.api";
import type { DoctorFilters } from "@/types";

export function doctorDirectoryQueryOptions(filters: DoctorFilters) {
	return queryOptions({
		queryKey: doctorsKeys.list(filters),
		queryFn: () => getDoctors(filters),
	});
}

export function doctorQueryOptions(id: string) {
	return queryOptions({
		queryKey: doctorsKeys.detail(id),
		queryFn: () => getDoctor(id),
		enabled: Boolean(id),
	});
}

export function doctorOverridesQueryOptions(doctorId: string) {
	return queryOptions({
		queryKey: doctorsKeys.overrides(doctorId),
		queryFn: () => getScheduleOverrides(doctorId),
		enabled: Boolean(doctorId),
	});
}

export function createDoctorMutationOptions() {
	return { mutationFn: createDoctor };
}

export function updateDoctorMutationOptions() {
	return { mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateDoctor>[1] }) => updateDoctor(id, payload) };
}

export function createScheduleOverrideMutationOptions() {
	return { mutationFn: ({ doctorId, payload }: { doctorId: string; payload: Parameters<typeof createScheduleOverride>[1] }) => createScheduleOverride(doctorId, payload) };
}

export function deleteScheduleOverrideMutationOptions() {
	return { mutationFn: ({ doctorId, overrideId }: { doctorId: string; overrideId: string }) => deleteScheduleOverride(doctorId, overrideId) };
}
