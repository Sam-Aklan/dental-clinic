import { createFileRoute } from "@tanstack/react-router";
import { AuditLogPage } from "@/components/audit-log";
import { parseAuditLogSearch } from "@/lib/audit-log";

export const Route = createFileRoute("/_authenticated/_admin/admin/audit")({
	validateSearch: (search) => parseAuditLogSearch(search as Record<string, string | undefined>),
	component: AuditLogRoute,
});

function AuditLogRoute() {
	return <AuditLogPage />;
}
