import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProtectedRouteGuard, WorkspaceShell } from "@/components/shared";
import { RECEPTIONIST_NAV_ITEMS } from "@/constants/nav-items";
import { ROUTE_STAFF_QUEUE } from "@/constants/routes";

export const Route = createFileRoute("/_authenticated/_receptionist")({
	beforeLoad: ({ location }) => {
		if (
			location.pathname === "/_authenticated/_receptionist" ||
			location.pathname === "/_authenticated/_receptionist/" ||
			location.pathname === "/staff" ||
			location.pathname === "/staff/"
		) {
			throw redirect({
				to: ROUTE_STAFF_QUEUE as any,
				replace: true,
			});
		}
	},
	component: ReceptionistLayout,
});

function ReceptionistLayout() {
	return (
		<ProtectedRouteGuard allowedRoles={["RECEPTIONIST", "ADMIN"]}>
			<WorkspaceShell navItems={RECEPTIONIST_NAV_ITEMS} homeRoute={ROUTE_STAFF_QUEUE} />
		</ProtectedRouteGuard>
	);
}
