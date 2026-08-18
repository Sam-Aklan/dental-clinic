import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboardSection } from "@/components/admin-dashboard";
import { parseAdminDashboardSearch } from "@/lib/admin-dashboard";

export const Route = createFileRoute("/_authenticated/_admin/admin/dashboard")({
	validateSearch: (search) => parseAdminDashboardSearch(search as Record<string, string | undefined>),
	component: AdminDashboardRoute,
});

function AdminDashboardRoute() {
	return <AdminDashboardSection />;
}
