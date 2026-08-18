import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProtectedRouteGuard, WorkspaceShell } from "@/components/shared";
import { DOCTOR_NAV_ITEMS } from "@/constants/nav-items";
import { ROUTE_DOCTOR_QUEUE } from "@/constants/routes";

export const Route = createFileRoute("/_authenticated/_doctor")({
	beforeLoad: ({ location }) => {
		if (
			location.pathname === "/_authenticated/_doctor" ||
			location.pathname === "/_authenticated/_doctor/" ||
			location.pathname === "/doctor" ||
			location.pathname === "/doctor/"
		) {
			throw redirect({
				to: ROUTE_DOCTOR_QUEUE as any,
				replace: true,
			});
		}
	},
	component: DoctorLayout,
});

function DoctorLayout() {
	return (
		<ProtectedRouteGuard allowedRoles={["DOCTOR"]}>
			<WorkspaceShell navItems={DOCTOR_NAV_ITEMS} homeRoute={ROUTE_DOCTOR_QUEUE} />
		</ProtectedRouteGuard>
	);
}
