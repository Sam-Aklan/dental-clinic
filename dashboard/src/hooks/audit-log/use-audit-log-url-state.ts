import { getRouteApi } from "@tanstack/react-router";
import { CLINIC_TIMEZONE } from "@/constants";
import { parseAuditLogSearch, serializeAuditLogSearch, updateAuditLogState } from "@/lib/audit-log";
import type { AuditLogUrlState } from "@/types";

const auditRoute = getRouteApi("/_authenticated/_admin/admin/audit");

export function useAuditLogUrlState(timezoneName = CLINIC_TIMEZONE) {
	const search = parseAuditLogSearch(auditRoute.useSearch() as Record<string, string | undefined>, timezoneName);
	const navigate = auditRoute.useNavigate();

	const setSearch = (patch: Partial<AuditLogUrlState> & { reset?: boolean }) => {
		const next = updateAuditLogState(search, patch, timezoneName);
		navigate({ search: serializeAuditLogSearch(next) as never, replace: true });
	};

	return {
		search,
		setSearch,
		setPage: (page: number) => setSearch({ page }),
		setPageSize: (pageSize: AuditLogUrlState["pageSize"]) => setSearch({ pageSize }),
		setSort: (sortBy: AuditLogUrlState["sortBy"], sortDir: AuditLogUrlState["sortDir"]) => setSearch({ sortBy, sortDir }),
		reset: () => setSearch({ reset: true }),
	};
}
