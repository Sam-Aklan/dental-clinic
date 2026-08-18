import type { Role } from "@/types";
import { roleHomeMap } from "@/constants";

export function isSafeInternalRedirect(redirect: string | null): redirect is string {
	if (!redirect) return false;
	return decodeURIComponent(redirect).startsWith("/");
}

export function resolveLoginDestination(redirect: string | null, role: Role): string {
	const decoded = redirect ? decodeURIComponent(redirect) : null;
	if (decoded && decoded !== "/" && isSafeInternalRedirect(redirect)) {
		return decoded;
	}
	return roleHomeMap[role];
}
