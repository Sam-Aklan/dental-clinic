import dayjs from "dayjs";
import { ADMIN_DASHBOARD_AUTO_BUCKET, ADMIN_DASHBOARD_DEFAULT_SORT_BY, ADMIN_DASHBOARD_DEFAULT_SORT_DIR, ADMIN_DASHBOARD_DEFAULT_TAB, ADMIN_DASHBOARD_DEFAULT_THRESHOLD_DAYS } from "@/constants";
import type { AdminAppointmentSortField, AdminDashboardBucket, AdminDashboardUrlState, AppointmentStatus, DashboardTab, SortDir, TrendBucket } from "@/types";

const STATUS_VALUES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED", "NO_SHOW"];
const TAB_VALUES: DashboardTab[] = ["appointments", "follow-ups", "waitlist"];
const SORT_FIELDS: AdminAppointmentSortField[] = ["startsAt", "status", "createdAt", "doctorName"];
const SORT_DIRS: SortDir[] = ["asc", "desc"];
const BUCKET_VALUES: TrendBucket[] = ["day", "week", "month"];

export function getCurrentCalendarMonthRange(referenceDate = new Date()) {
	const current = dayjs(referenceDate);
	return {
		from: current.startOf("month").format("YYYY-MM-DD"),
		to: current.format("YYYY-MM-DD"),
	};
}

export function getAutoTrendBucket(from: string, to: string): TrendBucket {
	const spanDays = Math.abs(dayjs(to).diff(dayjs(from), "day")) + 1;
	if (spanDays <= 45) return "day";
	if (spanDays <= 365) return "week";
	return "month";
}

export function getEffectiveTrendBucket(from: string, to: string, bucket: AdminDashboardBucket): TrendBucket {
	return bucket === ADMIN_DASHBOARD_AUTO_BUCKET ? getAutoTrendBucket(from, to) : bucket;
}

function isTab(value: string | undefined): value is DashboardTab {
	return !!value && TAB_VALUES.includes(value as DashboardTab);
}

function isStatus(value: string | undefined): value is AppointmentStatus {
	return !!value && STATUS_VALUES.includes(value as AppointmentStatus);
}

function isSortField(value: string | undefined): value is AdminAppointmentSortField {
	return !!value && SORT_FIELDS.includes(value as AdminAppointmentSortField);
}

function isSortDir(value: string | undefined): value is SortDir {
	return !!value && SORT_DIRS.includes(value as SortDir);
}

function isBucket(value: string | undefined): value is TrendBucket {
	return !!value && BUCKET_VALUES.includes(value as TrendBucket);
}

function positiveInt(value: string | undefined, fallback: number) {
	const parsed = Number.parseInt(value ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function createDefaultAdminDashboardUrlState(referenceDate = new Date()): AdminDashboardUrlState {
	const range = getCurrentCalendarMonthRange(referenceDate);
	return {
		from: range.from,
		to: range.to,
		bucket: ADMIN_DASHBOARD_AUTO_BUCKET,
		tab: ADMIN_DASHBOARD_DEFAULT_TAB,
		doctorId: "",
		status: "",
		patientName: "",
		thresholdDays: ADMIN_DASHBOARD_DEFAULT_THRESHOLD_DAYS,
		page: 1,
		sortBy: ADMIN_DASHBOARD_DEFAULT_SORT_BY,
		sortDir: ADMIN_DASHBOARD_DEFAULT_SORT_DIR,
	};
}

export function parseAdminDashboardSearch(search: Record<string, string | undefined>): AdminDashboardUrlState {
	const defaults = createDefaultAdminDashboardUrlState();
	const from = search.from?.trim() || defaults.from;
	const to = search.to?.trim() || defaults.to;
	const bucket = isBucket(search.bucket) ? search.bucket : ADMIN_DASHBOARD_AUTO_BUCKET;
	return {
		from,
		to,
		bucket,
		tab: isTab(search.tab) ? search.tab : defaults.tab,
		doctorId: search.doctorId?.trim() || "",
		status: isStatus(search.status) ? search.status : "",
		patientName: search.patientName?.trim() || "",
		thresholdDays: positiveInt(search.thresholdDays, defaults.thresholdDays),
		page: positiveInt(search.page, 1),
		sortBy: isSortField(search.sortBy) ? search.sortBy : defaults.sortBy,
		sortDir: isSortDir(search.sortDir) ? search.sortDir : defaults.sortDir,
	};
}

export function serializeAdminDashboardSearch(state: AdminDashboardUrlState): Record<string, string | undefined> {
	const defaults = createDefaultAdminDashboardUrlState();
	return {
		from: state.from || undefined,
		to: state.to || undefined,
		bucket: state.bucket !== ADMIN_DASHBOARD_AUTO_BUCKET ? state.bucket : undefined,
		tab: state.tab !== defaults.tab ? state.tab : undefined,
		doctorId: state.doctorId.trim() || undefined,
		status: state.status || undefined,
		patientName: state.patientName.trim() || undefined,
		thresholdDays: state.thresholdDays !== defaults.thresholdDays ? String(state.thresholdDays) : undefined,
		page: state.page > 1 ? String(state.page) : undefined,
		sortBy: state.sortBy !== defaults.sortBy ? state.sortBy : undefined,
		sortDir: state.sortDir !== defaults.sortDir ? state.sortDir : undefined,
	};
}

export function normalizeAdminDashboardState(state: AdminDashboardUrlState): AdminDashboardUrlState {
	return {
		...state,
		doctorId: state.doctorId.trim(),
		status: state.status,
		patientName: state.patientName.trim(),
		thresholdDays: state.thresholdDays > 0 ? state.thresholdDays : ADMIN_DASHBOARD_DEFAULT_THRESHOLD_DAYS,
		page: state.page > 0 ? state.page : 1,
		sortDir: state.sortDir === "desc" ? "desc" : "asc",
		sortBy: SORT_FIELDS.includes(state.sortBy) ? state.sortBy : ADMIN_DASHBOARD_DEFAULT_SORT_BY,
		bucket: state.bucket === ADMIN_DASHBOARD_AUTO_BUCKET || isBucket(state.bucket) ? state.bucket : ADMIN_DASHBOARD_AUTO_BUCKET,
		from: state.from,
		to: state.to,
		tab: TAB_VALUES.includes(state.tab) ? state.tab : ADMIN_DASHBOARD_DEFAULT_TAB,
	};
}

export function updateAdminDashboardState(state: AdminDashboardUrlState, patch: Partial<AdminDashboardUrlState>): AdminDashboardUrlState {
	const next = normalizeAdminDashboardState({ ...state, ...patch });
	if (patch.from || patch.to || patch.doctorId !== undefined || patch.status !== undefined || patch.patientName !== undefined || patch.bucket !== undefined) {
		next.page = patch.page ?? 1;
	}
	if (patch.tab && patch.tab !== state.tab) {
		next.page = 1;
	}
	return next;
}
