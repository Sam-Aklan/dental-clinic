import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ROUTE_ADMIN_USERS } from "@/constants/routes";
import { resetUserFilters } from "@/lib/users-admin";

export const Route = createFileRoute("/_authenticated/_admin/admin/users")({
	component: AdminUsersRedirectRoute,
});

function AdminUsersRedirectRoute() {
	return <Navigate to={ROUTE_ADMIN_USERS} search={resetUserFilters() as never} replace />;
}
