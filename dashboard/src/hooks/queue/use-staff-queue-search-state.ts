import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ROUTE_STAFF_QUEUE } from "@/constants/routes";
import type { AppointmentStatus, StaffQueueFilterState } from "@/types";
import { createStaffQueueSearchPatch, parseStaffQueueSearch, serializeStaffQueueSearch } from "@/lib/queue";

function useCurrentSearchState() {
	const search = useSearch({ strict: false }) as Record<string, string | undefined>;
	return useMemo(() => parseStaffQueueSearch(search), [search]);
}

export function useStaffQueueSearchState() {
	const navigate = useNavigate();
	const state = useCurrentSearchState();

	function update(nextState: StaffQueueFilterState, replace = false) {
		navigate({ to: ROUTE_STAFF_QUEUE, search: serializeStaffQueueSearch(nextState), replace });
	}

	return {
		state,
		setDoctorIds(doctorIds: string[]) {
			update(createStaffQueueSearchPatch(state, { doctorIds }));
		},
		toggleDoctorId(doctorId: string) {
			const doctorIds = state.doctorIds.includes(doctorId) ? state.doctorIds.filter((id) => id !== doctorId) : [...state.doctorIds, doctorId];
			update(createStaffQueueSearchPatch(state, { doctorIds }));
		},
		setStatuses(statuses: AppointmentStatus[]) {
			update(createStaffQueueSearchPatch(state, { statuses }));
		},
		toggleStatus(status: AppointmentStatus) {
			const statuses = state.statuses.includes(status) ? state.statuses.filter((value) => value !== status) : [...state.statuses, status];
			update(createStaffQueueSearchPatch(state, { statuses }));
		},
		setSearch(search: string) {
			update(createStaffQueueSearchPatch(state, { search }));
		},
		clearFilters() {
			update({ doctorIds: [], statuses: [], search: "" });
		},
		replaceSearch(search: string) {
			update(createStaffQueueSearchPatch(state, { search }), true);
		},
	};
}
