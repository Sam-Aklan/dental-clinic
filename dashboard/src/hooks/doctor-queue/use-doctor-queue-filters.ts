import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ROUTE_DOCTOR_QUEUE } from "@/constants/routes";
import type { AppointmentStatus } from "@/types";
import { createDoctorQueueSearchPatch, parseDoctorQueueFilters, serializeDoctorQueueFilters } from "@/lib/doctor-queue";

export function useDoctorQueueFilters() {
	const navigate = useNavigate();
	const search = useSearch({ strict: false }) as Record<string, string | undefined>;
	const state = useMemo(() => parseDoctorQueueFilters(search), [search]);

	function update(nextSearch: ReturnType<typeof serializeDoctorQueueFilters>, replace = false) {
		navigate({ to: ROUTE_DOCTOR_QUEUE, search: nextSearch, replace });
	}

	return {
		state,
		setStatuses(statuses: AppointmentStatus[]) {
			update(createDoctorQueueSearchPatch(state, { statuses }));
		},
		toggleStatus(status: AppointmentStatus) {
			const statuses = state.statuses.includes(status) ? state.statuses.filter((value) => value !== status) : [...state.statuses, status];
			update(createDoctorQueueSearchPatch(state, { statuses }));
		},
		setShowFinished(showFinished: boolean) {
			update(createDoctorQueueSearchPatch(state, { showFinished }));
		},
		toggleShowFinished() {
			update(createDoctorQueueSearchPatch(state, { showFinished: !state.showFinished }));
		},
		clearFilters() {
			update(serializeDoctorQueueFilters({ statuses: [], showFinished: false }));
		},
		replaceStatuses(statuses: AppointmentStatus[]) {
			update(createDoctorQueueSearchPatch(state, { statuses }), true);
		},
	};
}
