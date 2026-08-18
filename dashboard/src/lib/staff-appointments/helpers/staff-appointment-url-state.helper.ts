import type { AppointmentSortField, AppointmentUrlState, SortDir, StaffAppointmentTab } from "@/types";

const DEFAULT_SORT_BY: AppointmentSortField = "startsAt";
const DEFAULT_SORT_DIR: SortDir = "asc";

function isTab(value: string | undefined): value is StaffAppointmentTab {
	return value === "today" || value === "upcoming" || value === "waitlist";
}

function isSortBy(value: string | undefined): value is AppointmentSortField {
	return value === "startsAt" || value === "doctor" || value === "status" || value === "createdAt";
}

function isSortDir(value: string | undefined): value is SortDir {
	return value === "asc" || value === "desc";
}

function splitCsv(value: string | undefined) {
	return (value ?? "")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

export function decodeStaffAppointmentSearch(search: Record<string, string | undefined>): AppointmentUrlState {
	const tab = isTab(search.tab) ? search.tab : "today";
	return {
		tab,
		from: search.from?.trim() || null,
		to: search.to?.trim() || null,
		doctorIds: splitCsv(search.doctorId),
		statuses: splitCsv(search.status).filter((value): value is AppointmentUrlState["statuses"][number] => {
			return ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED", "NO_SHOW"].includes(value);
		}),
		patientName: search.patientName?.trim() || "",
		page: Number.parseInt(search.page ?? "1", 10) > 0 ? Number.parseInt(search.page ?? "1", 10) : 1,
		sortBy: isSortBy(search.sortBy) ? search.sortBy : DEFAULT_SORT_BY,
		sortDir: isSortDir(search.sortDir) ? search.sortDir : DEFAULT_SORT_DIR,
	};
}

export function encodeStaffAppointmentSearch(state: AppointmentUrlState): Record<string, string | undefined> {
	return {
		tab: state.tab,
		from: state.from ?? undefined,
		to: state.to ?? undefined,
		doctorId: state.doctorIds.length ? state.doctorIds.join(",") : undefined,
		status: state.statuses.length ? state.statuses.join(",") : undefined,
		patientName: state.patientName || undefined,
		page: state.page > 1 ? String(state.page) : undefined,
		sortBy: state.sortBy === DEFAULT_SORT_BY ? undefined : state.sortBy,
		sortDir: state.sortDir === DEFAULT_SORT_DIR ? undefined : state.sortDir,
	};
}

export function createDefaultStaffAppointmentState(tab: StaffAppointmentTab = "today"): AppointmentUrlState {
	return {
		tab,
		from: null,
		to: null,
		doctorIds: [],
		statuses: [],
		patientName: "",
		page: 1,
		sortBy: DEFAULT_SORT_BY,
		sortDir: DEFAULT_SORT_DIR,
	};
}
