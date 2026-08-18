import type { AppointmentFilterState, AppointmentListParams, AppointmentStatus, AppointmentTab, PatientAppointment } from "@/types";
import { APPOINTMENT_PAGE_DEFAULT_PAGE_SIZE, APPOINTMENT_QUERY_KEYS, APPOINTMENT_SORT_VALUES, APPOINTMENT_DEFAULT_SORT_BY, APPOINTMENT_DEFAULT_SORT_DIR, APPOINTMENT_TAB_DEFAULT_STATUSES, APPOINTMENT_STATUS_TO_TAB } from "@/constants/appointments";

const appointmentStatusValues: AppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED", "NO_SHOW"];

function isAppointmentStatus(value: string | undefined): value is AppointmentStatus {
	return !!value && appointmentStatusValues.includes(value as AppointmentStatus);
}

function isAppointmentTab(value: string | undefined): value is AppointmentTab {
	return value === "upcoming" || value === "past" || value === "canceled";
}

function parseCsvValues(value: string | undefined) {
	return (value ?? "")
		.split(",")
		.map((item) => item.trim())
		.filter(Boolean);
}

function sortByStartAscending(left: PatientAppointment, right: PatientAppointment) {
	return Date.parse(left.startsAt) - Date.parse(right.startsAt);
}

function sortByStartDescending(left: PatientAppointment, right: PatientAppointment) {
	return Date.parse(right.startsAt) - Date.parse(left.startsAt);
}

export function getAllowedStatusesForTab(tab: AppointmentTab): AppointmentStatus[] {
	return APPOINTMENT_TAB_DEFAULT_STATUSES[tab];
}

export function getAppointmentTab(appointment: PatientAppointment, referenceNow = new Date()): AppointmentTab | null {
	if (appointment.status === "CANCELED") return "canceled";
	if (appointment.status === "COMPLETED" || appointment.status === "NO_SHOW") {
		return Date.parse(appointment.startsAt) < referenceNow.getTime() ? "past" : null;
	}
	if (appointment.status !== "PENDING" && appointment.status !== "CONFIRMED" && appointment.status !== "IN_PROGRESS") return null;
	return Date.parse(appointment.startsAt) >= referenceNow.getTime() ? "upcoming" : null;
}

export function groupAppointmentsByTab(appointments: PatientAppointment[], referenceNow = new Date()) {
	const upcoming: PatientAppointment[] = [];
	const past: PatientAppointment[] = [];
	const canceled: PatientAppointment[] = [];

	for (const appointment of appointments) {
		const tab = getAppointmentTab(appointment, referenceNow);
		if (tab === "upcoming") upcoming.push(appointment);
		else if (tab === "past") past.push(appointment);
		else if (tab === "canceled") canceled.push(appointment);
	}

	return {
		upcoming: upcoming.sort(sortByStartAscending),
		past: past.sort(sortByStartDescending),
		canceled: canceled.sort(sortByStartDescending),
	};
}

export function getAppointmentDoctorOptions(appointments: PatientAppointment[]) {
	const seen = new Set<string>();
	return appointments.flatMap((appointment) => {
		if (seen.has(appointment.doctor.id)) return [];
		seen.add(appointment.doctor.id);
		return [appointment.doctor];
	});
}

export function normalizeStatusesForTab(tab: AppointmentTab, statuses: AppointmentStatus[] | undefined) {
	const allowed = new Set(getAllowedStatusesForTab(tab));
	const normalized = (statuses ?? []).filter((status) => allowed.has(status));
	return normalized.length > 0 ? normalized : getAllowedStatusesForTab(tab);
}

export function parseAppointmentSearch(search: Record<string, string | undefined>): AppointmentFilterState {
	const rawTab = search[APPOINTMENT_QUERY_KEYS.tab];
	const tab: AppointmentTab = isAppointmentTab(rawTab) ? rawTab : "upcoming";
	const rawDoctorId = search[APPOINTMENT_QUERY_KEYS.doctorId]?.trim() ?? "";
	const doctorId = rawDoctorId.length > 0 ? rawDoctorId : null;
	const parsedStatuses = parseCsvValues(search[APPOINTMENT_QUERY_KEYS.status]).filter(isAppointmentStatus);
	const statuses = normalizeStatusesForTab(tab, parsedStatuses);
	const page = Number.parseInt(search[APPOINTMENT_QUERY_KEYS.page] ?? "1", 10);
	const createdAppointmentId = search[APPOINTMENT_QUERY_KEYS.created]?.trim() ?? "";

	const rawSortBy = search[APPOINTMENT_QUERY_KEYS.sortBy];
	const sortBy: "startsAt" | "createdAt" = rawSortBy === "createdAt" || rawSortBy === "startsAt" ? rawSortBy : APPOINTMENT_DEFAULT_SORT_BY;

	const rawSortDir = search[APPOINTMENT_QUERY_KEYS.sortDir];
	const defaultSortDir = APPOINTMENT_DEFAULT_SORT_DIR[tab];
	const sortDir: "asc" | "desc" = rawSortDir === "asc" || rawSortDir === "desc" ? rawSortDir : defaultSortDir;

	return {
		tab,
		doctorId,
		statuses,
		page: Number.isFinite(page) && page > 0 ? page : 1,
		createdAppointmentId: createdAppointmentId.length > 0 ? createdAppointmentId : null,
		sortBy,
		sortDir,
	};
}

export function serializeAppointmentSearch(state: AppointmentFilterState): Record<string, string | undefined> {
	return {
		[APPOINTMENT_QUERY_KEYS.tab]: state.tab,
		[APPOINTMENT_QUERY_KEYS.doctorId]: state.doctorId ?? undefined,
		[APPOINTMENT_QUERY_KEYS.status]: state.statuses.join(","),
		[APPOINTMENT_QUERY_KEYS.page]: String(state.page),
		[APPOINTMENT_QUERY_KEYS.created]: state.createdAppointmentId ?? undefined,
		[APPOINTMENT_QUERY_KEYS.sortBy]: state.sortBy,
		[APPOINTMENT_QUERY_KEYS.sortDir]: state.sortDir,
	};
}

export function buildAppointmentListParams(state: AppointmentFilterState, referenceNow = new Date()): AppointmentListParams {
	const referenceDate = referenceNow.toISOString().slice(0, 10);
	const from = state.tab === "upcoming" ? referenceDate : null;
	const to = state.tab === "past" ? referenceDate : null;

	return {
		tab: state.tab,
		doctorId: state.doctorId,
		statuses: normalizeStatusesForTab(state.tab, state.statuses),
		page: state.page,
		pageSize: APPOINTMENT_PAGE_DEFAULT_PAGE_SIZE,
		sortBy: state.sortBy,
		sortDir: state.sortDir,
		from,
		to,
	};
}

export function filterAppointmentsForState(appointments: PatientAppointment[], state: AppointmentFilterState, referenceNow = new Date()) {
	const grouped = groupAppointmentsByTab(appointments, referenceNow);
	const source = grouped[state.tab];
	const normalizedStatuses = normalizeStatusesForTab(state.tab, state.statuses);
	const visible = source.filter((appointment) => {
		if (state.doctorId && appointment.doctorId !== state.doctorId) return false;
		return normalizedStatuses.includes(appointment.status);
	});

	return [...visible].sort((left, right) => {
		const leftVal = state.sortBy === "createdAt" ? left.createdAt : left.startsAt;
		const rightVal = state.sortBy === "createdAt" ? right.createdAt : right.startsAt;
		const diff = Date.parse(leftVal) - Date.parse(rightVal);
		return state.sortDir === "asc" ? diff : -diff;
	});
}

export function getNextPage(state: AppointmentFilterState, totalPages: number) {
	return Math.min(Math.max(state.page, 1), Math.max(totalPages, 1));
}

export function createAppointmentSearchStatePatch(
	state: AppointmentFilterState,
	updates: Partial<Pick<AppointmentFilterState, "tab" | "doctorId" | "statuses" | "page" | "createdAppointmentId" | "sortBy" | "sortDir" >>,
): AppointmentFilterState {
	const nextState: AppointmentFilterState = {
		...state,
		...updates,
		page: updates.page ?? state.page,
		createdAppointmentId: updates.createdAppointmentId === undefined ? state.createdAppointmentId : updates.createdAppointmentId,
		doctorId: updates.doctorId === undefined ? state.doctorId : updates.doctorId,
		statuses: updates.statuses === undefined ? state.statuses : updates.statuses,
		tab: updates.tab ?? state.tab,
		sortBy: updates.sortBy ?? state.sortBy,
		sortDir: updates.sortDir ?? state.sortDir,
	};

	return {
		...nextState,
		statuses: normalizeStatusesForTab(nextState.tab, nextState.statuses),
		page: nextState.page > 0 ? nextState.page : 1,
	};
}

export function getAppointmentStatusTab(status: AppointmentStatus) {
	return APPOINTMENT_STATUS_TO_TAB[status];
}
