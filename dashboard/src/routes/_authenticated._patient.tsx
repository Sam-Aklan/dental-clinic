import { createFileRoute, redirect } from "@tanstack/react-router";
import { ProtectedRouteGuard, WorkspaceShell } from "@/components/shared";
import { PATIENT_NAV_ITEMS } from "@/constants/nav-items";
import { ROUTE_BOOK } from "@/constants/routes";

export const Route = createFileRoute("/_authenticated/_patient")({
	beforeLoad: ({ location }) => {
		if (
			location.pathname === "/_authenticated/_patient" ||
			location.pathname === "/_authenticated/_patient/" ||
			location.pathname === "/patient" ||
			location.pathname === "/patient/"
		) {
			throw redirect({
				to: ROUTE_BOOK as any,
				replace: true,
			});
		}
	},
	component: PatientLayout,
});

function PatientLayout() {
	return (
		<ProtectedRouteGuard allowedRoles={["PATIENT"]}>
			<WorkspaceShell navItems={PATIENT_NAV_ITEMS} homeRoute={ROUTE_BOOK} />
		</ProtectedRouteGuard>
	);
}
