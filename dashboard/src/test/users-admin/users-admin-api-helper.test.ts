import { describe, expect, it } from "vitest";
import { extractApiErrorMessage, mapBackendUser, toUsersApiFilters } from "@/lib/users-admin";

describe("users admin api helpers", () => {
	it("maps backend users to admin users", () => {
		expect(mapBackendUser({ id: "1", firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: null, role: "RECEPTIONIST", preferredLocale: "AR", isActive: false, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" })).toEqual({ id: "1", firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: null, role: "RECEPTIONIST", languagePreference: "ar", isDisabled: true, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" });
	});

	it("maps backend users with missing or null preferredLocale", () => {
		expect(mapBackendUser({ id: "1", firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: null, role: "RECEPTIONIST", preferredLocale: null as any, isActive: false, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" })).toEqual({ id: "1", firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: null, role: "RECEPTIONIST", languagePreference: "en", isDisabled: true, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" });
	});

	it("maps filters for the API", () => {
		expect(toUsersApiFilters({ q: "alice", role: ["ADMIN"], status: "active", language: "en", page: 2, sortBy: "name", sortDir: "asc" })).toEqual({ q: "alice", role: "ADMIN", status: "active", preferredLocale: "EN", page: 2, sortBy: "firstName", sortDir: "asc" });
	});

	it("extracts api messages", () => {
		expect(extractApiErrorMessage({ response: { data: { message: "email_already_exists" } } })).toBe("email_already_exists");
	});
});
