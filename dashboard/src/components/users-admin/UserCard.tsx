import { MoreHorizontalIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUserCreatedAt, formatUserName, formatUserPhone } from "@/lib/users-admin";
import type { AdminUserDTO } from "@/types";

interface UserCardProps {
	users: AdminUserDTO[];
	currentUserId?: string;
	isLoading?: boolean;
	emptyMode?: "empty" | "results" | null;
	onEdit: (user: AdminUserDTO) => void;
	onDisable: (user: AdminUserDTO) => void;
	onEnable: (user: AdminUserDTO) => void;
}

export function UserCard({ users, currentUserId, isLoading, emptyMode, onEdit, onDisable, onEnable }: UserCardProps) {
	const { t } = useTranslation();

	if (isLoading) {
		return <div className="grid gap-3 md:hidden">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40 w-full rounded-xl" />)}</div>;
	}

	if (!users.length) {
		return emptyMode === "empty"
			? <Empty className="py-12 md:hidden"><EmptyHeader><EmptyTitle>{t("usersAdmin.table.emptyTitle")}</EmptyTitle><EmptyDescription>{t("usersAdmin.table.emptyDescription")}</EmptyDescription></EmptyHeader></Empty>
			: <Empty className="py-12 md:hidden"><EmptyHeader><EmptyTitle>{t("usersAdmin.table.noResultsTitle")}</EmptyTitle><EmptyDescription>{t("usersAdmin.table.noResultsDescription")}</EmptyDescription></EmptyHeader></Empty>;
	}

	return (
		<div className="grid gap-3 md:hidden">
			{users.map((user) => (
				<Card key={user.id} size="sm">
					<CardHeader>
						<CardTitle>{formatUserName(user)}</CardTitle>
						<CardDescription>{user.email}</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm">
						<div className="flex flex-wrap gap-2"><Badge variant="outline">{t(`usersAdmin.roles.${user.role}`)}</Badge><Badge variant={user.isDisabled ? "destructive" : "secondary"}>{t(user.isDisabled ? "usersAdmin.status.disabled" : "usersAdmin.status.active")}</Badge><Badge variant="outline">{t(`usersAdmin.language.${user.languagePreference}`)}</Badge></div>
						<p>{formatUserPhone(user.phone)}</p>
						<p className="text-muted-foreground">{formatUserCreatedAt(user.createdAt)}</p>
					</CardContent>
					<CardFooter className="justify-between gap-2">
						<span className="text-sm text-muted-foreground">{t("usersAdmin.actions.actions")}</span>
						<DropdownMenu>
							<DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm"><MoreHorizontalIcon /></Button></DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => onEdit(user)}>{t("usersAdmin.actions.edit")}</DropdownMenuItem>
								{user.isDisabled ? (
									<DropdownMenuItem disabled={currentUserId === user.id} onClick={() => onEnable(user)}>{t("usersAdmin.actions.enable")}</DropdownMenuItem>
								) : (
									<DropdownMenuItem disabled={currentUserId === user.id} onClick={() => onDisable(user)}>{currentUserId === user.id ? t("usersAdmin.actions.disableSelfBlocked") : t("usersAdmin.actions.disable")}</DropdownMenuItem>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</CardFooter>
				</Card>
			))}
		</div>
	);
}
