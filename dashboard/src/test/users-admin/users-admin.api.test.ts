import { describe, expect, it, vi, beforeEach } from "vitest";
import { api } from "@/lib/axios-instance";
import { createUser, disableUser, enableUser, getUsers, updateUser } from "@/lib/users-admin";

describe("users admin api", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("unwraps user lists", async () => {
		vi.spyOn(api, "get").mockResolvedValueOnce({ data: { data: { items: [{ id: "1", firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: null, role: "ADMIN", preferredLocale: "EN", isActive: true, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" }], total: 1, page: 1, pageSize: 20 } } } as never);
		await expect(getUsers({ q: "", role: [], status: "active", language: "", page: 1, sortBy: "", sortDir: "asc" })).resolves.toMatchObject({ total: 1, items: [{ email: "jane@example.com", isDisabled: false }] });
	});

	it("delegates create, update, disable, and enable", async () => {
		vi.spyOn(api, "post").mockResolvedValueOnce({ data: { data: { id: "1", firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: null, role: "ADMIN", preferredLocale: "EN", isActive: true, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-01T00:00:00.000Z" } } } as never);
		vi.spyOn(api, "patch")
			.mockResolvedValueOnce({ data: { data: { id: "1", firstName: "Janet", lastName: "Doe", email: "jane@example.com", phone: null, role: "ADMIN", preferredLocale: "EN", isActive: true, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-02T00:00:00.000Z" } } } as never)
			.mockResolvedValueOnce({ data: { data: { id: "1", firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: null, role: "ADMIN", preferredLocale: "EN", isActive: false, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-02T00:00:00.000Z" } } } as never)
			.mockResolvedValueOnce({ data: { data: { id: "1", firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: null, role: "ADMIN", preferredLocale: "EN", isActive: true, createdAt: "2026-05-01T00:00:00.000Z", updatedAt: "2026-05-02T00:00:00.000Z" } } } as never);

		await expect(createUser({ firstName: "Jane", lastName: "Doe", email: "jane@example.com", role: "ADMIN", password: "Password1" })).resolves.toMatchObject({ email: "jane@example.com" });
		await expect(updateUser("1", { firstName: "Janet" })).resolves.toMatchObject({ firstName: "Janet" });
		await expect(disableUser("1")).resolves.toMatchObject({ isDisabled: true });
		await expect(enableUser("1")).resolves.toMatchObject({ isDisabled: false });
	});
});
