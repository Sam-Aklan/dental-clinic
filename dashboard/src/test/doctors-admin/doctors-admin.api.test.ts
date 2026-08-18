import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/axios-instance";
import { createDoctor, createScheduleOverride, deleteScheduleOverride, getDoctor, getDoctors, getScheduleOverrides, updateDoctor } from "@/lib/doctors-admin";

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

describe("doctors-admin api", () => {
	const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("loads doctors and unwraps response data", async () => {
		mockedApi.get.mockResolvedValueOnce({ data: { data: { data: [{ id: "1" }], total: 1, page: 1, pageSize: 10 } } });
		await expect(getDoctors()).resolves.toEqual({ data: [{ id: "1" }], total: 1, page: 1, pageSize: 10 });
	});

	it("loads a single doctor", async () => {
		mockedApi.get.mockResolvedValueOnce({ data: { data: { id: "1" } } });
		await expect(getDoctor("1")).resolves.toEqual({ id: "1" });
	});

	it("creates, updates, and deletes doctor resources", async () => {
		mockedApi.post.mockResolvedValueOnce({ data: { data: { id: "2" } } });
		mockedApi.patch.mockResolvedValueOnce({ data: { data: { id: "3" } } });
		mockedApi.post.mockResolvedValueOnce({ data: { data: { id: "4" } } });
		mockedApi.delete.mockResolvedValueOnce({ data: {} });
		await expect(createDoctor({ firstName: "A", lastName: "B", email: "a@example.com" })).resolves.toEqual({ id: "2" });
		await expect(updateDoctor("3", { phone: "+1 555 0100" })).resolves.toEqual({ id: "3" });
		await expect(createScheduleOverride("4", { date: "2099-01-01", isUnavailable: true, startTime: null, endTime: null, reason: "Holiday" })).resolves.toEqual({ id: "4" });
		await expect(deleteScheduleOverride("1", "2")).resolves.toBeUndefined();
	});

	it("loads schedule overrides and unwraps pagination", async () => {
		mockedApi.get.mockResolvedValueOnce({ data: { data: { data: [{ id: "ov-1" }], total: 1, page: 1, pageSize: 10 } } });
		await expect(getScheduleOverrides("doc-1")).resolves.toEqual({ data: [{ id: "ov-1" }], total: 1, page: 1, pageSize: 10 });
	});
});
