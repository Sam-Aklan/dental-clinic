import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMyWaitlist, joinWaitlist, updateWaitlistWindow, leaveWaitlist } from "@/lib/waitlist";

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: vi.fn(),
		post: vi.fn(),
		patch: vi.fn(),
		delete: vi.fn(),
	},
}));

import { api } from "@/lib/axios-instance";

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);
const mockedPatch = vi.mocked(api.patch);
const mockedDelete = vi.mocked(api.delete);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("waitlist.api", () => {
		describe("getMyWaitlist", () => {
			it("fetches active waitlist entries and unwraps the envelope", async () => {
			const mockEntries = [
				{
					id: "entry-1",
					doctorId: "doc-1",
					patientId: "patient-1",
					position: 3,
					availableFrom: "09:00",
					availableUntil: "13:00",
					createdAt: "2026-05-08T08:00:00.000Z",
					doctor: {
						id: "doc-1",
						firstName: "Ahmad",
						lastName: "Al-Rashid",
						specialization: "Orthodontics",
					},
				},
			];

				mockedGet.mockResolvedValueOnce({
					data: { data: { items: mockEntries, total: 1, page: 1, pageSize: 20 }, statusCode: 200 },
				});

			const result = await getMyWaitlist();

			expect(mockedGet).toHaveBeenCalledWith("/waitlist");
			expect(result).toEqual(mockEntries);
		});

			it("returns an empty array when no entries exist", async () => {
				mockedGet.mockResolvedValueOnce({
					data: { data: { items: [], total: 0, page: 1, pageSize: 20 }, statusCode: 200 },
				});

			const result = await getMyWaitlist();
			expect(result).toEqual([]);
		});
	});

	describe("joinWaitlist", () => {
		it("sends a POST request with the join payload and returns the created entry", async () => {
			const payload = { doctorId: "doc-1", availableFrom: null, availableUntil: null };
			const mockResponse = {
				id: "entry-new",
				doctorId: "doc-1",
				patientId: "patient-1",
				position: 5,
				availableFrom: null,
				availableUntil: null,
				createdAt: "2026-05-09T10:00:00.000Z",
				doctor: { id: "doc-1", firstName: "Ahmad", lastName: "Al-Rashid", specialization: "Orthodontics" },
			};

			mockedPost.mockResolvedValueOnce({
				data: { data: mockResponse, statusCode: 201 },
			});

			const result = await joinWaitlist(payload);

			expect(mockedPost).toHaveBeenCalledWith("/waitlist", payload);
			expect(result).toEqual(mockResponse);
		});

		it("exposes 409 conflict errors from the backend", async () => {
			const conflictError = {
				response: {
					status: 409,
					data: { message: "waitlist.alreadyJoined" },
				},
			};

			mockedPost.mockRejectedValueOnce(conflictError);

			await expect(joinWaitlist({ doctorId: "doc-1" })).rejects.toEqual(conflictError);
		});
	});

	describe("updateWaitlistWindow", () => {
		it("sends a PATCH request with the window payload and returns the updated entry", async () => {
			const mockResponse = {
				id: "entry-1",
				doctorId: "doc-1",
				patientId: "patient-1",
				position: 3,
				availableFrom: "10:00",
				availableUntil: "14:00",
				createdAt: "2026-05-08T08:00:00.000Z",
				doctor: { id: "doc-1", firstName: "Ahmad", lastName: "Al-Rashid", specialization: "Orthodontics" },
			};

			mockedPatch.mockResolvedValueOnce({
				data: { data: mockResponse, statusCode: 200 },
			});

			const result = await updateWaitlistWindow("entry-1", {
				availableFrom: "10:00",
				availableUntil: "14:00",
			});

			expect(mockedPatch).toHaveBeenCalledWith("/waitlist/entry-1", {
				availableFrom: "10:00",
				availableUntil: "14:00",
			});
			expect(result).toEqual(mockResponse);
		});
	});

	describe("leaveWaitlist", () => {
		it("sends a DELETE request for the given entry id", async () => {
			mockedDelete.mockResolvedValueOnce({
				data: { statusCode: 204 },
			});

			await leaveWaitlist("entry-1");

			expect(mockedDelete).toHaveBeenCalledWith("/waitlist/entry-1");
		});
	});
});
