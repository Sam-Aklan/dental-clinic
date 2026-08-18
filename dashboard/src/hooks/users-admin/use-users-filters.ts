import { useEffect, useMemo, useState } from "react";
import type { UserFilters } from "@/types";

interface UseUsersFiltersParams {
	search: UserFilters;
	onUpdateSearch: (patch: Partial<UserFilters>, options?: { replace?: boolean }) => void;
	onResetSearch: () => void;
}

export function useUsersFilters({ search, onUpdateSearch, onResetSearch }: UseUsersFiltersParams) {
	const [searchTerm, setSearchTerm] = useState(search.q);

	useEffect(() => {
		setSearchTerm(search.q);
	}, [search.q]);

	useEffect(() => {
		const handle = window.setTimeout(() => {
			if (searchTerm !== search.q) {
				onUpdateSearch({ q: searchTerm, page: 1 }, { replace: true });
			}
		}, 250);
		return () => window.clearTimeout(handle);
	}, [onUpdateSearch, search.q, searchTerm]);

	const handlers = useMemo(() => ({
		setRole: (role: UserFilters["role"]) => onUpdateSearch({ role, page: 1 }, { replace: true }),
		setStatus: (status: UserFilters["status"]) => onUpdateSearch({ status, page: 1 }, { replace: true }),
		setLanguage: (language: UserFilters["language"]) => onUpdateSearch({ language, page: 1 }, { replace: true }),
		setSort: (sortBy: UserFilters["sortBy"], sortDir: UserFilters["sortDir"]) => onUpdateSearch({ sortBy, sortDir, page: 1 }, { replace: true }),
		setPage: (page: number) => onUpdateSearch({ page }),
		reset: onResetSearch,
	}), [onResetSearch, onUpdateSearch]);

	return {
		searchTerm,
		setSearchTerm,
		...handlers,
	};
}
