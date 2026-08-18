import { afterEach, describe, expect, it, vi } from "vitest";

const apiMock = vi.hoisted(() => ({
	get: vi.fn(),
	patch: vi.fn(),
}));

vi.mock("@/lib/axios-instance", () => ({ api: apiMock }));

import { getDoctorQueue } from "@/lib/doctor-queue";

afterEach(() => {
	vi.resetAllMocks();
});

describe("doctor queue api", () => {
	it("normalizes legacy appointment ids from the backend payload", async () => {
		apiMock.get.mockResolvedValueOnce({
			data: {
				data: {
					items: [
						{
							appointmentId: "appt-1",
							position: 1,
							startsAt: "2026-05-11T08:00:00.000Z",
							endsAt: "2026-05-11T08:30:00.000Z",
							status: "PENDING",
							needsFollowUp: false,
							followUpId: null,
							notes: null,
							updatedAt: "2026-05-11T07:00:00.000Z",
						},
					],
				},
			},
		});

		await expect(getDoctorQueue("2026-05-11")).resolves.toEqual([
			{
				id: "appt-1",
				appointmentId: "appt-1",
				position: 1,
				startsAt: "2026-05-11T08:00:00.000Z",
				endsAt: "2026-05-11T08:30:00.000Z",
				status: "PENDING",
				needsFollowUp: false,
				followUpId: null,
				notes: null,
				updatedAt: "2026-05-11T07:00:00.000Z",
			},
		]);
	});
});
