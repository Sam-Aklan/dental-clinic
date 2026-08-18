import type { Locale, Role } from "@/types";

export type UserRole = Role;
export type LanguagePreference = "en" | "ar";

export interface BackendUserDTO {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	role: Role;
	preferredLocale: Locale;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface AdminUserDTO {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone: string | null;
	role: UserRole;
	languagePreference: LanguagePreference;
	isDisabled: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface PaginatedUsers {
	items: AdminUserDTO[];
	total: number;
	page: number;
	pageSize: number;
}

export interface UserFilters {
	q: string;
	role: UserRole[];
	status: "active" | "disabled" | "all";
	language: LanguagePreference | "";
	page: number;
	sortBy: "name" | "email" | "role" | "createdAt" | "";
	sortDir: "asc" | "desc";
}

export interface CreateUserPayload {
	firstName: string;
	lastName: string;
	email: string;
	phone?: string | null;
	role: UserRole;
	preferredLocale?: Locale;
	password: string;
}

export interface UpdateUserPayload {
	firstName?: string;
	lastName?: string;
	phone?: string | null;
	role?: UserRole;
	preferredLocale?: Locale;
}

export interface CreateUserFormValues {
	firstName: string;
	lastName: string;
	email: string;
	phone: string;
	role: UserRole;
	languagePreference: LanguagePreference;
	password: string;
}

export interface EditUserFormValues {
	firstName: string;
	lastName: string;
	phone: string;
	role: UserRole;
	languagePreference: LanguagePreference;
}
