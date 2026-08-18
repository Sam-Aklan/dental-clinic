import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStaffAppointment } from "@/lib/booking";

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

import { api } from "@/lib/axios-instance";

const mockedPost = vi.mocked(api.post);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("createStaffAppointment", () => {
	it("posts the staff payload with idempotency key", async () => {
		const response = {
			id: "appointment-1",
			patientId: "patient-1",
			doctorId: "doctor-1",
			startsAt: "2026-05-10T07:00:00.000Z",
			endsAt: "2026-05-10T07:30:00.000Z",
			status: "PENDING" as const,
			bookedByRole: "RECEPTIONIST" as const,
			notes: null,
		};
		mockedPost.mockResolvedValueOnce({ data: { data: response } });

		const payload = {
			patientId: "patient-1",
			doctorId: "doctor-1",
			startsAt: "2026-05-10T07:00:00.000Z",
		};

		const result = await createStaffAppointment(payload, "idempotency-key-1");

		expect(mockedPost).toHaveBeenCalledWith("/appointments", payload, {
			headers: { "Idempotency-Key": "idempotency-key-1" },
		});
		expect(result).toEqual(response);
	});
});
