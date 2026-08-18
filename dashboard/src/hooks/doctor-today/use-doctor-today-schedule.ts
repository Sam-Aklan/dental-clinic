import { useQuery } from "@tanstack/react-query";
import { doctorTodayScheduleQueryOptions } from "@/lib/doctor-today";
import { monthEnd, monthStart, weekEnd, weekStart } from "@/lib/doctor-today";
import type { DoctorTodayUrlState } from "@/types";

export function useDoctorTodaySchedule(state: DoctorTodayUrlState) {
	const isWeek = state.tab === "thisWeek";
	const from = isWeek ? weekStart(state.week) : state.date;
	const to = isWeek ? weekEnd(state.week) : state.date;
	const query = useQuery(
		doctorTodayScheduleQueryOptions({
			from,
			to,
			status: isWeek ? state.status : undefined,
			page: isWeek ? state.page : 1,
			pageSize: isWeek ? 20 : 50,
			sortBy: isWeek ? state.sortBy : "startsAt",
			sortDir: isWeek ? state.sortDir : "asc",
		}),
	);

	return {
		...query,
		isWeek,
		from,
		to,
		monthFrom: monthStart(state.date),
		monthTo: monthEnd(state.date),
	} as const;
}
