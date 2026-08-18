import type { DoctorQueueFilterState, AppointmentStatus } from "@/types";

const STATUS_VALUES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW", "CANCELED"];

export function parseDoctorQueueFilters(searchParams: Record<string, string | undefined>): DoctorQueueFilterState {
	const rawStatuses = searchParams.statuses?.split(",").map((value) => value.trim()).filter(Boolean) ?? [];
	const statuses = rawStatuses.filter((status): status is AppointmentStatus => STATUS_VALUES.includes(status as AppointmentStatus));

	return {
		statuses,
		showFinished: searchParams.showFinished === "true",
	};
}

export function serializeDoctorQueueFilters(state: DoctorQueueFilterState) {
	return {
		statuses: state.statuses.length ? state.statuses.join(",") : undefined,
		showFinished: state.showFinished ? "true" : undefined,
	};
}

export function createDoctorQueueSearchPatch(state: DoctorQueueFilterState, patch: Partial<DoctorQueueFilterState>) {
	return serializeDoctorQueueFilters({ ...state, ...patch });
}
