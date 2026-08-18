import type { UserFilters } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { usersListQueryOptions, userDetailQueryOptions } from "@/lib/users-admin";

export function useUsersQuery(filters: UserFilters) {
	return useQuery(usersListQueryOptions(filters));
}

export function useUserQuery(id: string) {
	return useQuery(userDetailQueryOptions(id));
}
