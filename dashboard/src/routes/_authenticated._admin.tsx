import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProtectedRouteGuard, WorkspaceShell } from "@/components/shared";
import { ADMIN_NAV_ITEMS } from "@/constants/nav-items";
import { ROUTE_ADMIN_DASHBOARD } from "@/constants/routes";

export const Route = createFileRoute("/_authenticated/_admin")({
	beforeLoad: ({ location }) => {
		if (
			location.pathname === "/_authenticated/_admin" ||
			location.pathname === "/_authenticated/_admin/" ||
			location.pathname === "/admin" ||
			location.pathname === "/admin/"
		) {
			throw redirect({
				to: ROUTE_ADMIN_DASHBOARD as any,
				replace: true,
			});
		}
	},
	component: AdminLayout,
});

function AdminLayout() {
	return (
		<ProtectedRouteGuard allowedRoles={["ADMIN"]}>
			<WorkspaceShell navItems={ADMIN_NAV_ITEMS} homeRoute={ROUTE_ADMIN_DASHBOARD} />
		</ProtectedRouteGuard>
	);
}
