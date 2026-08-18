import { afterEach, describe, expect, it, vi } from "vitest";
import { apiMock } from "./mocks";
import { backendQueueAppointmentFixture, byDoctorFixture, normalizedBackendQueueAppointmentFixture, summaryFixture } from "./fixtures";

vi.mock("@/lib/axios-instance", () => ({ api: apiMock }));

import { cancelStaffAppointment, getStaffQueue, getTodayByDoctor, getTodaySummary, updateAppointmentStatus } from "@/lib/queue";

afterEach(() => {
	vi.resetAllMocks();
});

describe("queue api", () => {
	it("loads queue and analytics data", async () => {
		apiMock.get
			.mockResolvedValueOnce({ data: { data: { items: [backendQueueAppointmentFixture], total: 1, page: 1, pageSize: 20 } } })
			.mockResolvedValueOnce({ data: { data: summaryFixture } })
			.mockResolvedValueOnce({ data: { data: byDoctorFixture } });

		await expect(getStaffQueue({ date: "2026-05-09", doctorIds: [], statuses: [], search: "" })).resolves.toEqual([normalizedBackendQueueAppointmentFixture]);
		await expect(getTodaySummary("2026-05-09")).resolves.toEqual(summaryFixture);
		await expect(getTodayByDoctor("2026-05-09")).resolves.toEqual(byDoctorFixture);
	});

	it("normalizes summary aliases used by the backend", async () => {
		apiMock.get.mockResolvedValueOnce({
			data: {
				data: {
					total: 12,
					inProgress: 2,
					waiting: 4,
					completed: 3,
					canceled: 1,
					noShow: 2,
					pending: 1,
				},
			},
		});

		await expect(getTodaySummary("2026-05-09")).resolves.toEqual({
			total: 12,
			inProgress: 2,
			waiting: 4,
			completed: 3,
			canceledToday: 1,
			noShow: 2,
			pendingConfirmation: 1,
		});
	});

	it("sends staff queue filters in the backend format", async () => {
		apiMock.get.mockResolvedValueOnce({ data: { data: { items: [backendQueueAppointmentFixture], total: 1, page: 1, pageSize: 20 } } });

		await getStaffQueue({ date: "2026-05-09", doctorIds: ["doctor-1", "doctor-2"], statuses: ["CONFIRMED", "IN_PROGRESS"], search: "Amina" });

		expect(apiMock.get).toHaveBeenCalledWith("/appointments", {
			params: {
				date: "2026-05-09",
				doctorId: ["doctor-1", "doctor-2"],
				status: ["CONFIRMED", "IN_PROGRESS"],
				patientName: "Amina",
			},
			paramsSerializer: expect.any(Function),
		});
	});

	it("returns an empty queue when the appointments payload is not an array", async () => {
		apiMock.get.mockResolvedValueOnce({ data: { data: null } });

		await expect(getStaffQueue({ date: "2026-05-09", doctorIds: [], statuses: [], search: "" })).resolves.toEqual([]);
	});

	it("supports legacy array queue payloads", async () => {
		apiMock.get.mockResolvedValueOnce({ data: { data: [backendQueueAppointmentFixture] } });

		await expect(getStaffQueue({ date: "2026-05-09", doctorIds: [], statuses: [], search: "" })).resolves.toEqual([normalizedBackendQueueAppointmentFixture]);
	});

	it("updates and cancels appointments", async () => {
		apiMock.patch.mockResolvedValueOnce({});
		apiMock.delete.mockResolvedValueOnce({});

		await updateAppointmentStatus("appt-1", "CONFIRMED");
		await cancelStaffAppointment("appt-1", "Patient requested");

		expect(apiMock.patch).toHaveBeenCalled();
		expect(apiMock.delete).toHaveBeenCalled();
	});
});
