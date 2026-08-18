import { describe, expect, it, vi } from "vitest";
import { api } from "@/lib/axios-instance";
import { appointmentPath, appointmentStatusPath, ANALYTICS_MY_HOURLY_LOAD, ANALYTICS_MY_STATS, ANALYTICS_MY_STATUS_DISTRIBUTION, ANALYTICS_MY_TRENDS } from "@/lib/api-paths";
import { doctorTodayKeys, getDoctorSchedule, getMyHourlyLoad, getMyStats, getMyStatusDistribution, getMyTrends, updateDoctorTodayAppointmentNotes, updateDoctorTodayAppointmentStatus } from "@/lib/doctor-today";

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: vi.fn(),
		patch: vi.fn(),
	},
}));

describe("doctor today api helpers", () => {
	it("builds paths and keys", () => {
		expect(appointmentStatusPath("appt-1")).toBe("/appointments/appt-1/status");
		expect(appointmentPath("appt-1")).toBe("/appointments/appt-1");
		expect(doctorTodayKeys.stats("2026-05-11")).toEqual(["doctor-today", "stats", "2026-05-11"]);
		expect(doctorTodayKeys.statusDistribution("2026-05-01", "2026-05-31")).toEqual(["doctor-today", "status-distribution", "2026-05-01", "2026-05-31"]);
	});

	it("unwraps api responses", async () => {
		const getMock = vi.mocked(api.get);
		getMock.mockResolvedValueOnce({ data: { data: { total: 1, page: 1, pageSize: 20, data: [] } } } as never);
		getMock.mockResolvedValueOnce({ data: { data: { todayTotal: 1, completed: 0, remaining: 1, inSession: 0, noShows: 0 } } } as never);
		getMock.mockResolvedValueOnce({ data: { data: [] } } as never);
		getMock.mockResolvedValueOnce({ data: { data: [] } } as never);
		getMock.mockResolvedValueOnce({ data: { data: [] } } as never);
		await expect(getDoctorSchedule({ from: "2026-05-11", to: "2026-05-11" })).resolves.toEqual({ total: 1, page: 1, pageSize: 20, data: [] });
		await expect(getMyStats("2026-05-11")).resolves.toMatchObject({ todayTotal: 1 });
		await expect(getMyTrends("2026-05-11")).resolves.toEqual([]);
		await expect(getMyStatusDistribution("2026-05-01", "2026-05-31")).resolves.toEqual([]);
		await expect(getMyHourlyLoad("2026-05-01", "2026-05-31")).resolves.toEqual([]);
	});

	it("normalizes backend doctor today payloads", async () => {
		const getMock = vi.mocked(api.get);
		getMock.mockResolvedValueOnce({ data: { data: { total: 1, page: 1, pageSize: 20, items: [{ id: "appt-1", startsAt: "2026-05-11T08:00:00.000Z", endsAt: "2026-05-11T08:30:00.000Z", status: "PENDING", patient: { firstName: "Amina", lastName: "Ali" }, notes: null, createdAt: "2026-05-11T00:00:00.000Z", updatedAt: "2026-05-11T00:00:00.000Z" }] } } } as never);
		getMock.mockResolvedValueOnce({ data: { data: [{ date: "2026-05-11", dayLabel: "Mon", count: 2 }] } } as never);
		getMock.mockResolvedValueOnce({ data: { data: { PENDING: 1, CONFIRMED: 2, IN_PROGRESS: 0, COMPLETED: 0, CANCELED: 0, NO_SHOW: 0 } } } as never);
		getMock.mockResolvedValueOnce({ data: { data: [{ hour: 8, count: 1 }, { hour: 9, count: 3 }] } } as never);

		await expect(getDoctorSchedule({ from: "2026-05-11", to: "2026-05-11" })).resolves.toEqual({
			total: 1,
			page: 1,
			pageSize: 20,
			data: [{ id: "appt-1", startsAt: "2026-05-11T08:00:00.000Z", endsAt: "2026-05-11T08:30:00.000Z", status: "PENDING", patientName: null, patient: { firstName: "Amina", lastName: "Ali" }, patientSequence: 1, notes: null, createdAt: "2026-05-11T00:00:00.000Z", updatedAt: "2026-05-11T00:00:00.000Z" }],
		});
		await expect(getMyTrends("2026-05-11")).resolves.toEqual([{ date: "2026-05-11", total: 2, dominantStatus: null, confirmed: 0, completed: 0, canceled: 0, noShow: 0 }]);
		await expect(getMyStatusDistribution("2026-05-01", "2026-05-31")).resolves.toEqual([{ status: "PENDING", count: 1 }, { status: "CONFIRMED", count: 2 }]);
		await expect(getMyHourlyLoad("2026-05-01", "2026-05-31")).resolves.toEqual([{ hour: 8, count: 1, percentage: 25 }, { hour: 9, count: 3, percentage: 75 }]);
	});

	it("calls mutations with the expected payloads", async () => {
		const patchMock = vi.mocked(api.patch);
		patchMock.mockResolvedValue({ data: {} } as never);
		await updateDoctorTodayAppointmentStatus("appt-1", "CONFIRMED");
		await updateDoctorTodayAppointmentNotes("appt-1", "note");
		expect(patchMock).toHaveBeenNthCalledWith(1, appointmentStatusPath("appt-1"), { status: "CONFIRMED" });
		expect(patchMock).toHaveBeenNthCalledWith(2, appointmentPath("appt-1"), { notes: "note" });
	});

	it("exposes analytics endpoint constants", () => {
		expect(ANALYTICS_MY_STATS).toBe("/analytics/my-stats");
		expect(ANALYTICS_MY_TRENDS).toBe("/analytics/my-trends");
		expect(ANALYTICS_MY_STATUS_DISTRIBUTION).toBe("/analytics/my-status-distribution");
		expect(ANALYTICS_MY_HOURLY_LOAD).toBe("/analytics/my-hourly-load");
	});
});
