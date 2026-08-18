import type { AppointmentStatus, StaffQueueFilterState } from "@/types";

const ALLOWED_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED", "NO_SHOW"];

function split(value: string | undefined) {
	return value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

export function parseStaffQueueSearch(search: Record<string, string | undefined>): StaffQueueFilterState {
	const statuses = split(search.status).filter((status): status is AppointmentStatus => ALLOWED_STATUSES.includes(status as AppointmentStatus));

	return {
		doctorIds: split(search.doctorId),
		statuses,
		search: search.q?.trim() ?? "",
	};
}

export function serializeStaffQueueSearch(state: StaffQueueFilterState) {
	return {
		doctorId: state.doctorIds.length ? state.doctorIds.join(",") : undefined,
		status: state.statuses.length ? state.statuses.join(",") : undefined,
		q: state.search.trim() || undefined,
	};
}

export function createStaffQueueSearchPatch(
	state: StaffQueueFilterState,
	patch: Partial<StaffQueueFilterState>,
) {
	return {
		doctorIds: patch.doctorIds ?? state.doctorIds,
		statuses: patch.statuses ?? state.statuses,
		search: patch.search ?? state.search,
	};
}
