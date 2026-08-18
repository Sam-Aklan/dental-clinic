import { MoreHorizontalIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatUserCreatedAt, formatUserName, formatUserPhone } from "@/lib/users-admin";
import type { AdminUserDTO, UserFilters } from "@/types";

interface UserTableProps {
	users: AdminUserDTO[];
	currentUserId?: string;
	isLoading: boolean;
	isError: boolean;
	emptyMode: "empty" | "results" | null;
	filters: UserFilters;
	total: number;
	pageSize: number;
	onPageChange: (page: number) => void;
	onSortChange: (sortBy: UserFilters["sortBy"], sortDir: UserFilters["sortDir"]) => void;
	onReset: () => void;
	onCreate: () => void;
	onEdit: (user: AdminUserDTO) => void;
	onDisable: (user: AdminUserDTO) => void;
	onEnable: (user: AdminUserDTO) => void;
	onRetry: () => void;
}

function SortButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
	return <Button type="button" variant="ghost" className="h-auto p-0 font-medium" onClick={onClick}>{children}</Button>;
}

export function UserTable({ users, currentUserId, isLoading, isError, emptyMode, filters, total, pageSize, onPageChange, onSortChange, onReset, onCreate, onEdit, onDisable, onEnable, onRetry }: UserTableProps) {
	const { t, i18n } = useTranslation();
	const totalPages = Math.max(1, Math.ceil(total / pageSize));

	if (isError) {
		return <Empty className="py-16"><EmptyHeader><EmptyTitle>{t("usersAdmin.table.errorTitle")}</EmptyTitle><EmptyDescription>{t("usersAdmin.table.errorDescription")}</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={onRetry}>{t("usersAdmin.actions.retry")}</Button></EmptyContent></Empty>;
	}

	if (isLoading) {
		return (
			<div className="space-y-3">
				{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-14 w-full rounded-lg" />)}
			</div>
		);
	}

	if (!users.length) {
		return emptyMode === "empty"
			? <Empty className="py-16"><EmptyHeader><EmptyTitle>{t("usersAdmin.table.emptyTitle")}</EmptyTitle><EmptyDescription>{t("usersAdmin.table.emptyDescription")}</EmptyDescription></EmptyHeader><EmptyContent><Button onClick={onCreate}>{t("usersAdmin.actions.createUser")}</Button></EmptyContent></Empty>
			: <Empty className="py-16"><EmptyHeader><EmptyTitle>{t("usersAdmin.table.noResultsTitle")}</EmptyTitle><EmptyDescription>{t("usersAdmin.table.noResultsDescription")}</EmptyDescription></EmptyHeader><EmptyContent><Button variant="outline" onClick={onReset}>{t("usersAdmin.actions.reset")}</Button></EmptyContent></Empty>;
	}

	return (
		<div className="space-y-4">
			<div className="overflow-x-auto rounded-xl border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead><SortButton onClick={() => onSortChange("name", filters.sortDir === "asc" ? "desc" : "asc")}>{t("usersAdmin.columns.name")}</SortButton></TableHead>
							<TableHead>{t("usersAdmin.columns.email")}</TableHead>
							<TableHead>{t("usersAdmin.columns.phone")}</TableHead>
							<TableHead><SortButton onClick={() => onSortChange("role", filters.sortDir === "asc" ? "desc" : "asc")}>{t("usersAdmin.columns.role")}</SortButton></TableHead>
							<TableHead>{t("usersAdmin.columns.status")}</TableHead>
							<TableHead>{t("usersAdmin.columns.language")}</TableHead>
							<TableHead><SortButton onClick={() => onSortChange("createdAt", filters.sortDir === "asc" ? "desc" : "asc")}>{t("usersAdmin.columns.createdAt")}</SortButton></TableHead>
							<TableHead>{t("usersAdmin.columns.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user) => (
							<TableRow key={user.id}>
								<TableCell>{formatUserName(user)}</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>{formatUserPhone(user.phone)}</TableCell>
								<TableCell>{t(`usersAdmin.roles.${user.role}`)}</TableCell>
								<TableCell>{t(user.isDisabled ? "usersAdmin.status.disabled" : "usersAdmin.status.active")}</TableCell>
								<TableCell>{t(`usersAdmin.language.${user.languagePreference}`)}</TableCell>
								<TableCell>{formatUserCreatedAt(user.createdAt)}</TableCell>
								<TableCell>
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
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<Pagination>
				<PaginationContent>
					<PaginationItem>
						<PaginationPrevious href="#" onClick={(event) => { event.preventDefault(); onPageChange(Math.max(1, filters.page - 1)); }} text={t("usersAdmin.actions.previous")} isRtl={i18n.language === "ar"?true:false} />
					</PaginationItem>
					<PaginationItem>
						<span className="px-3 text-sm text-muted-foreground">{t("usersAdmin.pagination.page", { page: filters.page, totalPages })}</span>
					</PaginationItem>
					<PaginationItem>
						<PaginationNext href="#" onClick={(event) => { event.preventDefault(); onPageChange(Math.min(totalPages, filters.page + 1)); }} text={t("usersAdmin.actions.next")} isRtl={i18n.language === "ar"?true:false} />
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</div>
	);
}
