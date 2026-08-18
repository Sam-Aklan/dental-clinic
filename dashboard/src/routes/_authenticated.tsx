import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRouteGuard } from "@/components/shared/protected-route-guard";

export const Route = createFileRoute("/_authenticated")({
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
	return (
		<ProtectedRouteGuard>
			<Outlet />
		</ProtectedRouteGuard>
	);
}
