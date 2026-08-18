import type { AuditFilterParams } from "@/types";

export const auditLogKeys = {
	all: ["auditLog"] as const,
	lists: () => [...auditLogKeys.all, "list"] as const,
	list: (params: AuditFilterParams) => [...auditLogKeys.lists(), params] as const,
};
