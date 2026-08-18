import { useQuery } from "@tanstack/react-query";
import { auditLogQueryOptions } from "@/lib/audit-log";
import type { AuditFilterParams } from "@/types";

export function useAuditLogQuery(params: AuditFilterParams) {
	return useQuery(auditLogQueryOptions(params));
}
