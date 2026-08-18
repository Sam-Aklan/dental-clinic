import { useMemo } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import type { AppointmentFilterState, AppointmentStatus, AppointmentTab } from "@/types";
import { ROUTE_BOOK_APPOINTMENTS } from "@/constants/routes";
import { createAppointmentSearchStatePatch, parseAppointmentSearch, serializeAppointmentSearch, getAllowedStatusesForTab } from "@/lib/appointments/helpers";

function useCurrentSearchState() {
	const search = useSearch({ strict: false }) as Record<string, string | undefined>;
	return useMemo(() => parseAppointmentSearch(search), [search]);
}

export function useAppointmentSearchState() {
	const navigate = useNavigate();
	const state = useCurrentSearchState();

	function update(nextState: AppointmentFilterState) {
		navigate({ to: ROUTE_BOOK_APPOINTMENTS, search: serializeAppointmentSearch(nextState) });
	}

	return {
		state,
		allowedStatuses: getAllowedStatusesForTab(state.tab),
		setTab(tab: AppointmentTab) {
			update(createAppointmentSearchStatePatch(state, {
				tab,
				statuses: getAllowedStatusesForTab(tab),
				page: 1,
				sortDir: tab === "upcoming" ? "asc" : "desc",
			}));
		},
		setDoctorId(doctorId: string | null) {
			update(createAppointmentSearchStatePatch(state, { doctorId, page: 1 }));
		},
		setStatuses(statuses: AppointmentStatus[]) {
			update(createAppointmentSearchStatePatch(state, { statuses, page: 1 }));
		},
		setPage(page: number) {
			update(createAppointmentSearchStatePatch(state, { page }));
		},
		setSortBy(sortBy: "startsAt" | "createdAt") {
			update(createAppointmentSearchStatePatch(state, { sortBy, page: 1 }));
		},
		setSortDir(sortDir: "asc" | "desc") {
			update(createAppointmentSearchStatePatch(state, { sortDir, page: 1 }));
		},
		clearFilters() {
			update(createAppointmentSearchStatePatch(state, {
				doctorId: null,
				statuses: getAllowedStatusesForTab(state.tab),
				page: 1,
				sortBy: "startsAt",
				sortDir: state.tab === "upcoming" ? "asc" : "desc",
			}));
		},
	};
}
