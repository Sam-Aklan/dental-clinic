import { queryOptions } from "@tanstack/react-query";
import type { UserFilters } from "@/types";
import { createUser, disableUser, enableUser, getUser, getUsers, updateUser } from "./users.api";
import { usersKeys } from "./users.keys";

export function usersListQueryOptions(filters: UserFilters) {
	return queryOptions({
		queryKey: usersKeys.list(filters),
		queryFn: () => getUsers(filters),
	});
}

export function userDetailQueryOptions(id: string) {
	return queryOptions({
		queryKey: usersKeys.detail(id),
		queryFn: () => getUser(id),
		enabled: Boolean(id),
	});
}

export function createUserMutationOptions() {
	return { mutationFn: createUser };
}

export function updateUserMutationOptions() {
	return { mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof updateUser>[1] }) => updateUser(id, payload) };
}

export function disableUserMutationOptions() {
	return { mutationFn: ({ id }: { id: string }) => disableUser(id) };
}

export function enableUserMutationOptions() {
	return { mutationFn: ({ id }: { id: string }) => enableUser(id) };
}
