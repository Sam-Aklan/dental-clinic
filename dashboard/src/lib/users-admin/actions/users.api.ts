import { api } from "@/lib/axios-instance";
import { USERS, userDisablePath, userEnablePath, userPath } from "@/lib/api-paths";
import type { AdminUserDTO, BackendUserDTO, CreateUserPayload, PaginatedUsers, UpdateUserPayload, UserFilters } from "@/types";
import { mapBackendUser, toUsersApiFilters, unwrapPaginatedUsers } from "../helpers";

function unwrap<T>(payload: { data?: T } | T): T {
	return (payload as { data?: T }).data ?? (payload as T);
}

export async function getUsers(filters: UserFilters): Promise<PaginatedUsers> {
	const response = await api.get<{ data?: unknown }>(USERS, { params: toUsersApiFilters(filters) });
	return unwrapPaginatedUsers(response.data);
}

export async function getUser(id: string): Promise<AdminUserDTO> {
	const response = await api.get<BackendUserDTO | { data: BackendUserDTO }>(userPath(id));
	return mapBackendUser(unwrap(response.data));
}

export async function createUser(payload: CreateUserPayload): Promise<AdminUserDTO> {
	const response = await api.post<BackendUserDTO | { data: BackendUserDTO }>(USERS, payload);
	return mapBackendUser(unwrap(response.data));
}

export async function updateUser(id: string, payload: UpdateUserPayload): Promise<AdminUserDTO> {
	const response = await api.patch<BackendUserDTO | { data: BackendUserDTO }>(userPath(id), payload);
	return mapBackendUser(unwrap(response.data));
}

export async function disableUser(id: string): Promise<AdminUserDTO> {
	const response = await api.patch<BackendUserDTO | { data: BackendUserDTO }>(userDisablePath(id), {});
	return mapBackendUser(unwrap(response.data));
}

export async function enableUser(id: string): Promise<AdminUserDTO> {
	const response = await api.patch<BackendUserDTO | { data: BackendUserDTO }>(userEnablePath(id), {});
	return mapBackendUser(unwrap(response.data));
}
