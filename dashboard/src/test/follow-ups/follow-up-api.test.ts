import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/axios-instance";
import { APPOINTMENT_SLOTS, FOLLOW_UPS } from "@/lib/api-paths";
import { createFollowUp, getFollowUpSlots } from "@/lib/follow-ups";
import { followUpSuccessResponse, futureFollowUpSlots } from "./fixtures";

vi.mock("@/lib/axios-instance", () => ({
	api: { get: vi.fn(), post: vi.fn() },
}));

describe("follow-up api", () => {
	const mockedApi = api as unknown as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("loads and unwraps available slots", async () => {
		mockedApi.get.mockResolvedValueOnce({ data: { data: futureFollowUpSlots } });
		await expect(getFollowUpSlots({ doctorId: "doc-1", from: "2026-06-09", to: "2026-06-09" })).resolves.toEqual(futureFollowUpSlots);
		expect(mockedApi.get).toHaveBeenCalledWith(APPOINTMENT_SLOTS, { params: { doctorId: "doc-1", from: "2026-06-09", to: "2026-06-09" } });
	});

	it("creates a follow-up with an idempotency header", async () => {
		mockedApi.post.mockResolvedValueOnce({ data: { data: followUpSuccessResponse } });
		await expect(createFollowUp({ patientId: "pat-1", doctorId: "doc-1", startsAt: "2026-06-09T12:30:00.000Z", reason: "Review healing", notes: "Bring x-ray", sourceAppointmentId: "appt-src-1" }, "11111111-1111-4111-8111-111111111111")).resolves.toEqual(followUpSuccessResponse);
		expect(mockedApi.post).toHaveBeenCalledWith(FOLLOW_UPS, { patientId: "pat-1", doctorId: "doc-1", startsAt: "2026-06-09T12:30:00.000Z", reason: "Review healing", notes: "Bring x-ray", sourceAppointmentId: "appt-src-1" }, { headers: { "Idempotency-Key": "11111111-1111-4111-8111-111111111111" } });
	});

	it("propagates api errors", async () => {
		mockedApi.post.mockRejectedValueOnce(new Error("boom"));
		await expect(createFollowUp({ patientId: "pat-1", doctorId: "doc-1", startsAt: "2026-06-09T12:30:00.000Z", reason: "Review healing" }, "11111111-1111-4111-8111-111111111111")).rejects.toThrow("boom");
	});
});
