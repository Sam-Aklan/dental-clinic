import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMyAppointments, cancelMyAppointment } from "@/lib/appointments";

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: vi.fn(),
		delete: vi.fn(),
		patch: vi.fn(),
	},
}));

import { api } from "@/lib/axios-instance";

const mockedGet = vi.mocked(api.get);
const mockedPatch = vi.mocked(api.patch);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("appointments.api", () => {
	it("fetches appointments with serialized filters", async () => {
		mockedGet.mockResolvedValueOnce({
			data: { data: { items: [], page: 1, pageSize: 10, total: 0 } },
		});

		await getMyAppointments({
			tab: "upcoming",
			doctorId: "doc-1",
			statuses: ["PENDING", "CONFIRMED"],
			page: 2,
			pageSize: 10,
			sortBy: "startsAt",
			sortDir: "asc",
			from: "2026-05-08",
			to: null,
		});

			expect(mockedGet).toHaveBeenCalledWith("/appointments", {
			params: {
				from: "2026-05-08",
				to: undefined,
				status: ["PENDING", "CONFIRMED"],
				doctorId: "doc-1",
				page: 2,
				pageSize: 10,
				sortBy: "startsAt",
				sortDir: "asc",
			},
			paramsSerializer: expect.any(Function),
		});
	});

	it("cancels an appointment by updating status", async () => {
		mockedPatch.mockResolvedValueOnce({ data: undefined });

		await cancelMyAppointment("appt-1");

		expect(mockedPatch).toHaveBeenCalledWith("/appointments/appt-1/status", { status: "CANCELED" });
	});
});
