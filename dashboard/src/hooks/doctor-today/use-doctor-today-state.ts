import { useCallback } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { createDefaultDoctorTodayState, parseDoctorTodaySearch, serializeDoctorTodaySearch, updateDoctorTodayState } from "@/lib/doctor-today";
import type { DoctorTodayUrlState } from "@/types";

const doctorTodayRoute = getRouteApi("/_authenticated/_doctor/doctor/today" as never);

export function useDoctorTodayState() {
	const search = doctorTodayRoute.useSearch();
	const navigate = doctorTodayRoute.useNavigate();
	const state = parseDoctorTodaySearch(search as never);

	const setState = useCallback(
		(patch: Partial<DoctorTodayUrlState>) => {
			const next = updateDoctorTodayState(state, patch);
			navigate({ search: serializeDoctorTodaySearch(next) as never });
		},
		[navigate, state],
	);

	const resetState = useCallback(() => {
		navigate({ search: serializeDoctorTodaySearch(createDefaultDoctorTodayState()) as never });
	}, [navigate]);

	const setDate = useCallback((date: string) => setState({ date, week: date, page: 1 }), [setState]);
	const setWeek = useCallback((week: string) => setState({ week, page: 1 }), [setState]);
	const setTab = useCallback((tab: DoctorTodayUrlState["tab"]) => setState({ tab, page: 1 }), [setState]);
	const setStatus = useCallback((status: DoctorTodayUrlState["status"]) => setState({ status, page: 1 }), [setState]);
	const setPage = useCallback((page: number) => setState({ page }), [setState]);
	const setSort = useCallback((sortBy: DoctorTodayUrlState["sortBy"], sortDir: DoctorTodayUrlState["sortDir"]) => setState({ sortBy, sortDir, page: 1 }), [setState]);

	return {
		state,
		setState,
		resetState,
		setDate,
		setWeek,
		setTab,
		setStatus,
		setPage,
		setSort,
	} as const;
}
