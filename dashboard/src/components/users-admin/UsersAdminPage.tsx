import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/auth";
import { createUserPayload, extractApiErrorMessage, updateUserPayload } from "@/lib/users-admin";
import type { AdminUserDTO, CreateUserFormValues, EditUserFormValues } from "@/types";
import type { UserFilters } from "@/types";
import { useCreateUserMutation, useDisableUserMutation, useEnableUserMutation, useUpdateUserMutation, useUsersFilters, useUsersQuery } from "@/hooks/users-admin";
import { UserFilters as UsersFilters } from "./UserFilters";
import { UserTable } from "./UserTable";
import { UserCard } from "./UserCard";
import { UserFormDialog } from "./UserFormDialog";
import { DisableUserDialog } from "./DisableUserDialog";

interface UsersAdminPageProps {
	search: UserFilters;
	onUpdateSearch: (patch: Partial<UserFilters>, options?: { replace?: boolean }) => void;
	onResetSearch: () => void;
}

export function UsersAdminPage({ search, onUpdateSearch, onResetSearch }: UsersAdminPageProps) {
	const { t } = useTranslation();
	const { user: currentUser } = useAuth();
	const mobile = useIsMobile();
	const { searchTerm, setSearchTerm, setRole, setStatus, setLanguage, setSort, setPage, reset } = useUsersFilters({ search, onUpdateSearch, onResetSearch });
	const query = useUsersQuery(search);
	const createMutation = useCreateUserMutation();
	const updateMutation = useUpdateUserMutation();
	const disableMutation = useDisableUserMutation();
	const enableMutation = useEnableUserMutation();
	const [createOpen, setCreateOpen] = useState(false);
	const [editUser, setEditUser] = useState<AdminUserDTO | undefined>();
	const [disableUser, setDisableUser] = useState<AdminUserDTO | undefined>();
	const [activeError, setActiveError] = useState("");
	const handleDisableUser = (user: AdminUserDTO) => {
		if (currentUser?.id === user.id) return;
		setDisableUser(user);
	};

	const handleEnableUser = async (user: AdminUserDTO) => {
		if (currentUser?.id === user.id) return;
		setActiveError("");
		try {
			await enableMutation.mutateAsync({ id: user.id });
			toast.success(t("usersAdmin.success.enable"));
		} catch (error) {
			toast.error(extractApiErrorMessage(error));
		}
	};

	const users = query.data?.items ?? [];
	const total = query.data?.total ?? 0;
	const pageSize = query.data?.pageSize ?? 20;
	const emptyMode = useMemo(() => search.q || search.role.length || search.language || search.status !== "active" || search.sortBy ? "results" : "empty", [search]);

	const submitCreate = async (values: CreateUserFormValues | EditUserFormValues) => {
		setActiveError("");
		await createMutation.mutateAsync(createUserPayload(values as CreateUserFormValues));
		setCreateOpen(false);
	};

	const submitUpdate = async (values: CreateUserFormValues | EditUserFormValues) => {
		if (!editUser) return;
		setActiveError("");
		await updateMutation.mutateAsync({ id: editUser.id, payload: updateUserPayload(values as EditUserFormValues) });
		setEditUser(undefined);
	};

	const submitDisable = async () => {
		if (!disableUser) return;
		setActiveError("");
		try {
			await disableMutation.mutateAsync({ id: disableUser.id });
			toast.success(t("usersAdmin.success.disable"));
			setDisableUser(undefined);
		} catch (error) {
			// Handled by DisableUserDialog alert using error state
		}
	};

	const errorMessage = activeError || extractApiErrorMessage(createMutation.error ?? updateMutation.error ?? disableMutation.error ?? enableMutation.error);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader className="gap-2">
					<CardTitle>{t("usersAdmin.page.title")}</CardTitle>
					<CardDescription>{t("usersAdmin.page.subtitle")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex justify-end"><Button onClick={() => setCreateOpen(true)}>{t("usersAdmin.actions.createUser")}</Button></div>
					<UsersFilters filters={search} searchTerm={searchTerm} onSearchTermChange={setSearchTerm} onRoleChange={setRole} onStatusChange={setStatus} onLanguageChange={setLanguage} onSortChange={setSort} onReset={reset} />
					{query.isError ? <Alert variant="destructive"><AlertTitle>{t("usersAdmin.errors.loadTitle")}</AlertTitle><AlertDescription>{t("usersAdmin.errors.loadDescription")}</AlertDescription></Alert> : null}
					{!query.isError ? <div className="space-y-4">{mobile ? <UserCard users={users} currentUserId={currentUser?.id} isLoading={query.isLoading} emptyMode={emptyMode} onEdit={setEditUser} onDisable={handleDisableUser} onEnable={handleEnableUser} /> : <UserTable users={users} currentUserId={currentUser?.id} isLoading={query.isLoading} isError={query.isError} emptyMode={emptyMode} filters={search} total={total} pageSize={pageSize} onPageChange={setPage} onSortChange={setSort} onReset={reset} onCreate={() => setCreateOpen(true)} onEdit={setEditUser} onDisable={handleDisableUser} onEnable={handleEnableUser} onRetry={() => query.refetch()} />}</div> : null}
				</CardContent>
			</Card>

			<UserFormDialog open={createOpen} mode="create" currentUserId={currentUser?.id} isPending={createMutation.isPending} errorMessage={createMutation.isError ? errorMessage : undefined} onOpenChange={setCreateOpen} onSubmit={submitCreate} />
			<UserFormDialog open={Boolean(editUser)} mode="edit" user={editUser} currentUserId={currentUser?.id} isPending={updateMutation.isPending} errorMessage={updateMutation.isError ? errorMessage : undefined} onOpenChange={(open) => !open && setEditUser(undefined)} onSubmit={submitUpdate} />
			<DisableUserDialog open={Boolean(disableUser)} user={disableUser} currentUserId={currentUser?.id} isPending={disableMutation.isPending} errorMessage={disableMutation.isError ? errorMessage : undefined} onOpenChange={(open) => !open && setDisableUser(undefined)} onConfirm={submitDisable} />
		</div>
	);
}
