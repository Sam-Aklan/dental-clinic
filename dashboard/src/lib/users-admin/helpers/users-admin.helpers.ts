import type { AdminUserDTO, BackendUserDTO, CreateUserPayload, LanguagePreference, PaginatedUsers, UpdateUserPayload, UserFilters, UserRole } from "@/types";

export const DEFAULT_USER_FILTERS: UserFilters = {
	q: "",
	role: [],
	status: "active",
	language: "",
	page: 1,
	sortBy: "",
	sortDir: "asc",
};

function readSearchParam(value: unknown) {
	if (typeof value === "string") {
		return value;
	}

	if (Array.isArray(value)) {
		return value.find((entry): entry is string => typeof entry === "string");
	}

	return undefined;
}

export function parseUserFilters(raw: Record<string, unknown>): UserFilters {
	const roleValue = readSearchParam(raw.role);
	const sortByValue = readSearchParam(raw.sortBy);
	const statusValue = readSearchParam(raw.status);
	const languageValue = readSearchParam(raw.language);
	const pageValue = readSearchParam(raw.page);
	const sortDirValue = readSearchParam(raw.sortDir);
	const qValue = readSearchParam(raw.q);

	const roles = roleValue
		?.split(",")
		.map((role) => role.trim())
		.filter((role): role is UserRole => ["PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"].includes(role as UserRole)) ?? [];
	const sortBy = sortByValue === "name" || sortByValue === "email" || sortByValue === "role" || sortByValue === "createdAt" ? sortByValue : "";
	const status = statusValue === "disabled" || statusValue === "all" ? statusValue : "active";
	const language = languageValue === "en" || languageValue === "ar" ? languageValue : "";
	const page = Number.parseInt(pageValue ?? "", 10);
	const sortDir = sortDirValue === "desc" ? "desc" : "asc";

	return {
		q: qValue?.trim() ?? "",
		role: roles,
		status,
		language,
		page: Number.isFinite(page) && page > 0 ? page : 1,
		sortBy,
		sortDir,
	};
}

export function serializeUserFilters(filters: UserFilters): Record<string, string | undefined> {
	return {
		q: filters.q || undefined,
		role: filters.role.length ? filters.role.join(",") : undefined,
		status: filters.status === DEFAULT_USER_FILTERS.status ? undefined : filters.status,
		language: filters.language || undefined,
		page: filters.page > 1 ? String(filters.page) : undefined,
		sortBy: filters.sortBy || undefined,
		sortDir: filters.sortDir === DEFAULT_USER_FILTERS.sortDir ? undefined : filters.sortDir,
	};
}

export function resetUserFilters(): UserFilters {
	return { ...DEFAULT_USER_FILTERS };
}

export function mapLanguagePreferenceToApi(languagePreference: LanguagePreference | "") {
	if (!languagePreference) {
		return undefined;
	}
	return languagePreference.toUpperCase() as "EN" | "AR";
}

export function mapApiLocaleToLanguagePreference(locale?: string | null): LanguagePreference {
	return locale?.toLowerCase() === "ar" ? "ar" : "en";
}

export function mapBackendUser(raw: BackendUserDTO): AdminUserDTO {
	return {
		id: raw.id,
		firstName: raw.firstName,
		lastName: raw.lastName,
		email: raw.email,
		phone: raw.phone,
		role: raw.role,
		languagePreference: mapApiLocaleToLanguagePreference(raw.preferredLocale),
		isDisabled: !raw.isActive,
		createdAt: raw.createdAt,
		updatedAt: raw.updatedAt,
	};
}

export function unwrapPaginatedUsers(payload: unknown): PaginatedUsers {
	const root = payload as { data?: unknown; items?: unknown; total?: number; page?: number; pageSize?: number } | undefined;
	const data = root?.data as { items?: BackendUserDTO[]; total?: number; page?: number; pageSize?: number } | BackendUserDTO[] | undefined;

	if (Array.isArray(data)) {
		return { items: data.map(mapBackendUser), total: data.length, page: 1, pageSize: data.length || 1 };
	}

	if (data && Array.isArray(data.items)) {
		return {
			items: data.items.map(mapBackendUser),
			total: data.total ?? data.items.length,
			page: data.page ?? 1,
			pageSize: data.pageSize ?? (data.items.length || 1),
		};
	}

	if (root && Array.isArray(root.items)) {
		const items = root.items as BackendUserDTO[];
		return {
			items: items.map(mapBackendUser),
			total: root.total ?? items.length,
			page: root.page ?? 1,
			pageSize: root.pageSize ?? (items.length || 1),
		};
	}

	return { items: [], total: 0, page: 1, pageSize: 1 };
}

export function toUsersApiFilters(filters: UserFilters) {
	return {
		q: filters.q || undefined,
		role: filters.role.length ? filters.role.join(",") : undefined,
		status: filters.status,
		preferredLocale: mapLanguagePreferenceToApi(filters.language),
		page: filters.page > 1 ? filters.page : undefined,
		sortBy: filters.sortBy === "name" ? "firstName" : filters.sortBy || undefined,
		sortDir: filters.sortDir,
	};
}

export function createUserPayload(values: { firstName: string; lastName: string; email: string; phone?: string; role: UserRole; languagePreference?: LanguagePreference; password: string; }): CreateUserPayload {
	return {
		firstName: values.firstName.trim(),
		lastName: values.lastName.trim(),
		email: values.email.trim(),
		phone: values.phone?.trim() ? values.phone.trim() : null,
		role: values.role,
		preferredLocale: mapLanguagePreferenceToApi(values.languagePreference ?? ""),
		password: values.password,
	};
}

export function updateUserPayload(values: { firstName?: string; lastName?: string; phone?: string; role?: UserRole; languagePreference?: LanguagePreference; }): UpdateUserPayload {
	return {
		...(values.firstName !== undefined ? { firstName: values.firstName.trim() } : {}),
		...(values.lastName !== undefined ? { lastName: values.lastName.trim() } : {}),
		...(values.phone !== undefined ? { phone: values.phone.trim() ? values.phone.trim() : null } : {}),
		...(values.role !== undefined ? { role: values.role } : {}),
		...(values.languagePreference !== undefined ? { preferredLocale: mapLanguagePreferenceToApi(values.languagePreference) } : {}),
	};
}

export function extractApiErrorMessage(error: unknown) {
	if (typeof error === "object" && error && "response" in error) {
		const response = (error as { response?: { data?: { message?: string | string[] } } }).response;
		const message = response?.data?.message;
		if (Array.isArray(message)) {
			return message[0] ?? "";
		}
		if (typeof message === "string") {
			return message;
		}
	}
	return "";
}

export function formatUserName(user: Pick<AdminUserDTO, "firstName" | "lastName">) {
	return `${user.firstName} ${user.lastName}`.trim();
}

export function formatUserPhone(phone: string | null) {
	return phone?.trim() || "—";
}

export function formatUserCreatedAt(value: string) {
	return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

export function normalizeUserRoleLabel(role: UserRole) {
	return role.toLowerCase();
}
