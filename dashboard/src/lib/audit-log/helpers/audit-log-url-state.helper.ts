import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { CLINIC_TIMEZONE } from "@/constants";
import { AUDIT_DEFAULT_DAYS, AUDIT_DEFAULT_PAGE_SIZE, AUDIT_DEFAULT_SORT_BY, AUDIT_DEFAULT_SORT_DIR, AUDIT_PAGE_SIZE_OPTIONS } from "@/constants/audit-log";
import type { AuditLogUrlState } from "@/types";

dayjs.extend(utc);
dayjs.extend(timezone);

type SearchRecord = Record<string, string | number | undefined>;

function defaultRange(timezoneName: string) {
	const today = dayjs().tz(timezoneName);
	return {
		from: today.subtract(AUDIT_DEFAULT_DAYS, "day").format("YYYY-MM-DD"),
		to: today.format("YYYY-MM-DD"),
	};
}

function asPositiveInteger(value: unknown, fallback: number) {
	const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
	return Number.isInteger(parsed) && parsed >= 1 ? parsed : fallback;
}

function asPageSize(value: unknown) {
	const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
	return AUDIT_PAGE_SIZE_OPTIONS.includes(parsed as never) ? (parsed as AuditLogUrlState["pageSize"]) : AUDIT_DEFAULT_PAGE_SIZE;
}

function asSortBy(value: unknown) {
	return value === "actor" || value === "action" || value === "targetType" || value === "createdAt" ? value : AUDIT_DEFAULT_SORT_BY;
}

function asSortDir(value: unknown) {
	return value === "asc" || value === "desc" ? value : AUDIT_DEFAULT_SORT_DIR;
}

function normalizeOptional(value: unknown) {
	return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asDateOrDefault(value: unknown, fallback: string) {
	return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && dayjs(value).isValid() ? value : fallback;
}

export function parseAuditLogSearch(search: SearchRecord, timezoneName: string = CLINIC_TIMEZONE): AuditLogUrlState {
	const range = defaultRange(timezoneName);

	return {
		from: asDateOrDefault(search.from, range.from),
		to: asDateOrDefault(search.to, range.to),
		actorId: normalizeOptional(search.actorId),
		actorName: normalizeOptional(search.actorName),
		action: normalizeOptional(search.action),
		targetType: normalizeOptional(search.targetType),
		targetId: normalizeOptional(search.targetId),
		page: asPositiveInteger(search.page, 1),
		pageSize: asPageSize(search.pageSize),
		sortBy: asSortBy(search.sortBy),
		sortDir: asSortDir(search.sortDir),
	};
}

export function serializeAuditLogSearch(state: AuditLogUrlState): Record<string, string> {
	const search: Record<string, string> = {
		from: state.from,
		to: state.to,
		page: String(state.page),
		pageSize: String(state.pageSize),
		sortBy: state.sortBy,
		sortDir: state.sortDir,
	};

	for (const key of ["actorId", "actorName", "action", "targetType", "targetId"] as const) {
		const value = state[key];
		if (typeof value === "string" && value.trim()) {
			search[key] = value.trim();
		}
	}

	return search;
}

export function updateAuditLogState(current: AuditLogUrlState, patch: Partial<AuditLogUrlState> & { reset?: boolean }, timezoneName: string = CLINIC_TIMEZONE) {
	if (patch.reset) {
		return parseAuditLogSearch({}, timezoneName);
	}

	const next: AuditLogUrlState = { ...current, ...patch };
	const changedNonPage = ["from", "to", "actorId", "actorName", "action", "targetType", "targetId", "sortBy", "sortDir", "pageSize"].some((key) => key in patch);

	if (changedNonPage) {
		next.page = patch.page ?? 1;
	}

	return parseAuditLogSearch(next as unknown as SearchRecord, timezoneName);
}
