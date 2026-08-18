import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UserFilters, UserRole } from "@/types";

interface UserFiltersProps {
	filters: UserFilters;
	searchTerm: string;
	onSearchTermChange: (value: string) => void;
	onRoleChange: (value: UserRole[]) => void;
	onStatusChange: (value: UserFilters["status"]) => void;
	onLanguageChange: (value: UserFilters["language"]) => void;
	onSortChange: (sortBy: UserFilters["sortBy"], sortDir: UserFilters["sortDir"]) => void;
	onReset: () => void;
}

const ROLE_OPTIONS: UserRole[] = ["PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"];
const ALL_LANGUAGES_VALUE = "__all_languages__";
const DEFAULT_SORT_VALUE = "__default_sort__";

export function UserFilters({ filters, searchTerm, onSearchTermChange, onRoleChange, onStatusChange, onLanguageChange, onSortChange, onReset }: UserFiltersProps) {
	const { t } = useTranslation();
	const [roleOpen, setRoleOpen] = useState(false);
	const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(filters.role);

	return (
		<section className="grid gap-3 rounded-xl border bg-card p-4 shadow-xs md:grid-cols-2 xl:grid-cols-6">
			<div className="space-y-2 md:col-span-2 xl:col-span-2">
				<label className="text-sm font-medium" htmlFor="users-search">
					{t("usersAdmin.filters.search")}
				</label>
				<Input id="users-search" value={searchTerm} onChange={(event) => onSearchTermChange(event.target.value)} placeholder={t("usersAdmin.filters.searchPlaceholder")} />
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium" htmlFor="users-role">{t("usersAdmin.filters.role")}</label>
				<Combobox
					items={ROLE_OPTIONS}
					multiple
					open={roleOpen}
					value={selectedRoles}
					onValueChange={(value) => setSelectedRoles(value as UserRole[])}
					onOpenChange={(open) => {
						if (open) {
							setSelectedRoles(filters.role);
						}

						if (!open) {
							const changed = selectedRoles.length !== filters.role.length || selectedRoles.some((role, index) => role !== filters.role[index]);

							if (changed) {
								onRoleChange(selectedRoles);
							}
						}

						setRoleOpen(open);
					}}
				>
					<ComboboxChips id="users-role" aria-label={t("usersAdmin.filters.role")}>
						<ComboboxValue>
							{selectedRoles.map((role) => <ComboboxChip key={role}>{t(`usersAdmin.roles.${role}`)}</ComboboxChip>)}
						</ComboboxValue>
						<ComboboxChipsInput placeholder={selectedRoles.length ? undefined : t("usersAdmin.filters.role")} />
					</ComboboxChips>
					<ComboboxContent>
						<ComboboxEmpty>{t("usersAdmin.filters.noRolesFound", { defaultValue: t("usersAdmin.filters.all") })}</ComboboxEmpty>
						<ComboboxList>
							{(role) => <ComboboxItem key={role} value={role}>{t(`usersAdmin.roles.${role}`)}</ComboboxItem>}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium" htmlFor="users-status">{t("usersAdmin.filters.status")}</label>
				<Select value={filters.status} onValueChange={(value) => onStatusChange(value as UserFilters["status"])}>
					<SelectTrigger id="users-status" aria-label={t("usersAdmin.filters.status")}>
						<SelectValue placeholder={t("usersAdmin.filters.status")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="active">{t("usersAdmin.status.active")}</SelectItem>
						<SelectItem value="disabled">{t("usersAdmin.status.disabled")}</SelectItem>
						<SelectItem value="all">{t("usersAdmin.filters.all")}</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium" htmlFor="users-language">{t("usersAdmin.filters.language")}</label>
				<Select value={filters.language || ALL_LANGUAGES_VALUE} onValueChange={(value) => onLanguageChange(value === ALL_LANGUAGES_VALUE ? "" : value as UserFilters["language"])}>
					<SelectTrigger id="users-language" aria-label={t("usersAdmin.filters.language")}>
						<SelectValue placeholder={t("usersAdmin.filters.language")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={ALL_LANGUAGES_VALUE}>{t("usersAdmin.filters.all")}</SelectItem>
						<SelectItem value="en">{t("usersAdmin.language.en")}</SelectItem>
						<SelectItem value="ar">{t("usersAdmin.language.ar")}</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium" htmlFor="users-sort">{t("usersAdmin.filters.sortBy")}</label>
				<Select value={filters.sortBy || DEFAULT_SORT_VALUE} onValueChange={(value) => onSortChange(value === DEFAULT_SORT_VALUE ? "" : value as UserFilters["sortBy"], filters.sortDir)}>
					<SelectTrigger id="users-sort" aria-label={t("usersAdmin.filters.sortBy")}>
						<SelectValue placeholder={t("usersAdmin.filters.sortBy")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={DEFAULT_SORT_VALUE}>{t("usersAdmin.filters.defaultSort")}</SelectItem>
						<SelectItem value="name">{t("usersAdmin.sort.name")}</SelectItem>
						<SelectItem value="email">{t("usersAdmin.sort.email")}</SelectItem>
						<SelectItem value="role">{t("usersAdmin.sort.role")}</SelectItem>
						<SelectItem value="createdAt">{t("usersAdmin.sort.createdAt")}</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-2">
				<label className="text-sm font-medium" htmlFor="users-sort-dir">{t("usersAdmin.filters.sortDir")}</label>
				<Select value={filters.sortDir} onValueChange={(value) => onSortChange(filters.sortBy, value as UserFilters["sortDir"])}>
					<SelectTrigger id="users-sort-dir" aria-label={t("usersAdmin.filters.sortDir")}>
						<SelectValue placeholder={t("usersAdmin.filters.sortDir")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="asc">{t("usersAdmin.sort.asc")}</SelectItem>
						<SelectItem value="desc">{t("usersAdmin.sort.desc")}</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div className="flex items-end">
				<Button type="button" variant="outline" className="w-full" onClick={onReset}>{t("usersAdmin.actions.reset")}</Button>
			</div>
		</section>
	);
}
