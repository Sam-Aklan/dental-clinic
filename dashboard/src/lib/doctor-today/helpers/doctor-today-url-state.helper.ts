import { todayClinicDate } from "./doctor-today-date.helper";
import type { DoctorTodaySortDir, DoctorTodaySortField, DoctorTodayUrlState, DoctorTodayAppointmentStatus } from "@/types";

const TABS: DoctorTodayUrlState["tab"][] = ["today", "thisWeek"];
const SORT_FIELDS: DoctorTodaySortField[] = ["startsAt", "status", "date"];
const SORT_DIRS: DoctorTodaySortDir[] = ["asc", "desc"];
const STATUSES: DoctorTodayAppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED", "NO_SHOW"];

function isTab(value: string | undefined): value is DoctorTodayUrlState["tab"] {
	return !!value && TABS.includes(value as DoctorTodayUrlState["tab"]);
}

function isSortField(value: string | undefined): value is DoctorTodaySortField {
	return !!value && SORT_FIELDS.includes(value as DoctorTodaySortField);
}

function isSortDir(value: string | undefined): value is DoctorTodaySortDir {
	return !!value && SORT_DIRS.includes(value as DoctorTodaySortDir);
}

function isStatus(value: string): value is DoctorTodayAppointmentStatus {
	return STATUSES.includes(value as DoctorTodayAppointmentStatus);
}

function positiveInt(value: string | undefined, fallback: number) {
	const parsed = Number.parseInt(value ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseStatuses(value: string | string[] | undefined) {
	if (!value) return [];
	const values = Array.isArray(value) ? value : value.split(",");
	return values.map((entry) => entry.trim()).filter(isStatus);
}

export function createDefaultDoctorTodayState(referenceDate = new Date()): DoctorTodayUrlState {
	const date = todayClinicDate(referenceDate);
	return {
		date,
		week: date,
		tab: "today",
		status: [],
		page: 1,
		sortBy: "startsAt",
		sortDir: "asc",
	};
}

export function parseDoctorTodaySearch(search: Record<string, string | string[] | undefined>): DoctorTodayUrlState {
	const defaults = createDefaultDoctorTodayState();
	const date = typeof search.date === "string" && search.date.trim() ? search.date.trim() : defaults.date;
	const week = typeof search.week === "string" && search.week.trim() ? search.week.trim() : date;
	const tab = isTab(typeof search.tab === "string" ? search.tab : undefined) ? (search.tab as DoctorTodayUrlState["tab"]) : defaults.tab;
	const sortBy = isSortField(typeof search.sortBy === "string" ? search.sortBy : undefined) ? (search.sortBy as DoctorTodaySortField) : defaults.sortBy;
	const sortDir = isSortDir(typeof search.sortDir === "string" ? search.sortDir : undefined) ? (search.sortDir as DoctorTodaySortDir) : defaults.sortDir;

	return {
		date,
		week,
		tab,
		status: parseStatuses(search.status),
		page: positiveInt(typeof search.page === "string" ? search.page : undefined, defaults.page),
		sortBy,
		sortDir,
	};
}

export function serializeDoctorTodaySearch(state: DoctorTodayUrlState): Record<string, string | undefined> {
	const defaults = createDefaultDoctorTodayState();
	const status = state.status.length > 0 ? state.status.join(",") : undefined;

	return {
		date: state.date || undefined,
		week: state.week || undefined,
		tab: state.tab !== defaults.tab ? state.tab : undefined,
		status,
		page: state.page > 1 ? String(state.page) : undefined,
		sortBy: state.sortBy !== defaults.sortBy ? state.sortBy : undefined,
		sortDir: state.sortDir !== defaults.sortDir ? state.sortDir : undefined,
	};
}

export function updateDoctorTodayState(state: DoctorTodayUrlState, patch: Partial<DoctorTodayUrlState>): DoctorTodayUrlState {
	const next: DoctorTodayUrlState = {
		...state,
		...patch,
		date: patch.date?.trim() || state.date,
		week: patch.week?.trim() || state.week,
		tab: isTab(patch.tab) ? patch.tab : state.tab,
		status: patch.status ? patch.status.filter(isStatus) : state.status,
		page: positiveInt(typeof patch.page === "number" ? String(patch.page) : undefined, state.page),
		sortBy: isSortField(patch.sortBy) ? patch.sortBy : state.sortBy,
		sortDir: isSortDir(patch.sortDir) ? patch.sortDir : state.sortDir,
	};

	if (patch.date || patch.week || (patch.tab && patch.tab !== state.tab) || patch.status) {
		next.page = 1;
	}

	if (patch.status) {
		next.page = 1;
	}

	return {
		...next,
		week: next.week || next.date,
	};
}
