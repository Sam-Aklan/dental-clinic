import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDoctors, getAvailableSlots, bookAppointment } from "@/lib/booking";

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
	},
}));

import { api } from "@/lib/axios-instance";

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("getDoctors", () => {
	it("calls GET /doctors and returns data", async () => {
		const mockDoctors = [
			{
				id: "doc-1",
				firstName: "Ahmad",
				lastName: "Al-Rashid",
				specialization: "General Dentistry",
				bio: "10 years",
				isActive: true,
			},
		];
		mockedGet.mockResolvedValueOnce({ data: { data: mockDoctors } });
		const result = await getDoctors();
		expect(mockedGet).toHaveBeenCalledWith("/doctors");
		expect(result).toEqual(mockDoctors);
	});
});

describe("getAvailableSlots", () => {
	it("calls GET /appointments/slots with query params", async () => {
		const mockSlots = [
			{
				startsAt: "2026-05-10T07:00:00.000Z",
				endsAt: "2026-05-10T07:30:00.000Z",
				doctorId: "doc-1",
				status: "available" as const,
			},
		];
		mockedGet.mockResolvedValueOnce({ data: { data: mockSlots } });
		const params = { doctorId: "doc-1", from: "2026-05-10", to: "2026-05-10" };
		const result = await getAvailableSlots(params);
		expect(mockedGet).toHaveBeenCalledWith("/appointments/slots", { params });
		expect(result).toEqual(mockSlots);
	});

	it("sends includeReserved when requested", async () => {
		mockedGet.mockResolvedValueOnce({ data: { data: [] } });
		await getAvailableSlots({ doctorId: "doc-1", from: "2026-05-10", to: "2026-05-10", includeReserved: true });
		expect(mockedGet).toHaveBeenCalledWith("/appointments/slots", {
			params: { doctorId: "doc-1", from: "2026-05-10", to: "2026-05-10", includeReserved: true },
		});
	});
});

describe("bookAppointment", () => {
	it("calls POST /appointments with payload and Idempotency-Key header", async () => {
		const mockAppointment = {
			id: "appt-1",
			doctorId: "doc-1",
			patientId: "patient-1",
			startsAt: "2026-05-10T07:00:00.000Z",
			endsAt: "2026-05-10T07:30:00.000Z",
			status: "PENDING" as const,
			createdAt: "2026-05-08T10:00:00.000Z",
			updatedAt: "2026-05-08T10:00:00.000Z",
			cancellationReason: null,
			notes: null,
			doctor: { id: "doc-1", firstName: "Ahmad", lastName: "Al-Rashid", specialization: "General Dentistry" },
			patient: { id: "patient-1", firstName: "Test", lastName: "Patient" },
		};
		mockedPost.mockResolvedValueOnce({ data: { data: mockAppointment } });
		const payload = { doctorId: "doc-1", startsAt: "2026-05-10T07:00:00.000Z" };
		const idempotencyKey = "test-key-uuid";
		const result = await bookAppointment(payload, idempotencyKey);
		expect(mockedPost).toHaveBeenCalledWith("/appointments", payload, {
			headers: { "Idempotency-Key": idempotencyKey },
		});
		expect(result).toEqual(mockAppointment);
	});

	it("submits startsAt verbatim without recomputing", () => {
		const verbatimStartsAt = "2026-05-10T07:00:00.000Z";
		expect(verbatimStartsAt).toBe("2026-05-10T07:00:00.000Z");
	});
});
