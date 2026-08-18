import { keepPreviousData } from "@tanstack/react-query";
import { getAuditLog } from "./audit-log.api";
import { auditLogKeys } from "./audit-log.keys";
import type { AuditFilterParams } from "@/types";

export function auditLogQueryOptions(params: AuditFilterParams) {
	return {
		queryKey: auditLogKeys.list(params),
		queryFn: () => getAuditLog(params),
		placeholderData: keepPreviousData,
		staleTime: 30_000,
	};
}
