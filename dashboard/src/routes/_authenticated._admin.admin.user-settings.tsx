import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { UsersAdminPage } from "@/components/users-admin";
import { parseUserFilters, resetUserFilters } from "@/lib/users-admin";
import type { UserFilters } from "@/types";

export const Route = createFileRoute("/_authenticated/_admin/admin/user-settings")({
	validateSearch: (search) => parseUserFilters(search as Record<string, unknown>),
	component: AdminSettingsUsersRoute,
});

function AdminSettingsUsersRoute() {
	const search = Route.useSearch() as UserFilters;
	const navigate = useNavigate();

	const updateSearch = (patch: Partial<UserFilters>, options?: { replace?: boolean }) => {
		navigate({ search: { ...search, ...patch } as never, replace: options?.replace });
	};

	return <UsersAdminPage search={search} onUpdateSearch={updateSearch} onResetSearch={() => navigate({ search: resetUserFilters() as never })} />;
}
