import { beforeEach, describe, expect, it, vi } from "vitest";
import { cancelAdminAppointment, exportAdminAppointments, getAdminAppointments, getAdminFollowUps, getAdminKpiSummary, getAdminWaitlist, getAdminWaitlistSummary } from "@/lib/admin-dashboard";

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: vi.fn(),
		delete: vi.fn(),
	},
}));

import { api } from "@/lib/axios-instance";

const mockedGet = vi.mocked(api.get);
const mockedDelete = vi.mocked(api.delete);

beforeEach(() => {
	vi.clearAllMocks();
});

describe("admin dashboard api", () => {
	it("fetches the KPI summary with date range params", async () => {
		mockedGet.mockResolvedValueOnce({ data: { data: { totalAppointments: 3, completed: 2, cancellationRate: 0.1, noShowRate: 0.05, activePatients: 2, waitlistSize: 1 } } });

		await getAdminKpiSummary({ from: "2026-05-01", to: "2026-05-31" });

		expect(mockedGet).toHaveBeenCalledWith("/analytics/kpi-summary", { params: { from: "2026-05-01", to: "2026-05-31", bucket: undefined } });
	});

	it("serializes appointment filters for the appointments endpoint", async () => {
		mockedGet.mockResolvedValueOnce({ data: { data: { items: [{ id: "appointment-1" }], total: 1, page: 2, pageSize: 20 } } });

		await expect(getAdminAppointments({
			from: "2026-05-01",
			to: "2026-05-31",
			doctorId: "doctor-1",
			status: "CONFIRMED",
			patientName: "Amina",
			page: 2,
			pageSize: 20,
			sortBy: "startsAt",
			sortDir: "desc",
		})).resolves.toEqual({ data: [{ id: "appointment-1" }], total: 1, page: 2, pageSize: 20 });

		expect(mockedGet).toHaveBeenCalledWith("/appointments", {
			params: {
				from: "2026-05-01",
				to: "2026-05-31",
				doctorId: "doctor-1",
				status: "CONFIRMED",
				patientName: "Amina",
				page: 2,
				pageSize: 20,
				sortBy: "startsAt",
				sortDir: "desc",
			},
		});
	});

	it("normalizes follow-up responses that return items arrays", async () => {
		mockedGet.mockResolvedValueOnce({ data: { data: { items: [{ id: "follow-up-1" }], total: 1, page: 1, pageSize: 10 } } });

		await expect(getAdminFollowUps({ thresholdDays: 30, page: 1, pageSize: 10 })).resolves.toEqual({
			data: [{ id: "follow-up-1" }],
			total: 1,
			page: 1,
			pageSize: 10,
		});

		expect(mockedGet).toHaveBeenCalledWith("/analytics/follow-ups", {
			params: { thresholdDays: 30, page: 1, pageSize: 10 },
		});
	});

	it("normalizes waitlist responses that return items arrays", async () => {
		mockedGet.mockResolvedValueOnce({ data: { data: { items: [{ id: "waitlist-1", patient: { id: "patient-1", firstName: "Amina", lastName: "Ali" }, doctor: { id: "doctor-1", firstName: "Omar", lastName: "Saleh" } }], total: 1, page: 3, pageSize: 25 } } });

		await expect(getAdminWaitlist({ page: 3, pageSize: 25 })).resolves.toEqual({
			data: [{ id: "waitlist-1", patient: { id: "patient-1", firstName: "Amina", lastName: "Ali" }, doctor: { id: "doctor-1", firstName: "Omar", lastName: "Saleh" } }],
			total: 1,
			page: 3,
			pageSize: 25,
		});

		expect(mockedGet).toHaveBeenCalledWith("/waitlist", {
			params: { page: 3, pageSize: 25 },
		});
	});

	it("requests CSV export as a blob", async () => {
		mockedGet.mockResolvedValueOnce({ data: new Blob(["csv"], { type: "text/csv" }) });

		await exportAdminAppointments({ from: "2026-05-01", to: "2026-05-31", doctorId: "doctor-1", status: "CONFIRMED", patientName: "Amina", sortBy: "startsAt", sortDir: "desc" });

		expect(mockedGet).toHaveBeenCalledWith("/appointments/export", {
			params: { from: "2026-05-01", to: "2026-05-31", doctorId: "doctor-1", status: "CONFIRMED", patientName: "Amina", sortBy: "startsAt", sortDir: "desc" },
			responseType: "blob",
		});
	});

	it("unwraps the waitlist summary response", async () => {
		mockedGet.mockResolvedValueOnce({ data: { data: { totalActive: 5, byDoctor: [{ doctorId: "doctor-1", doctorName: "Omar Saleh", count: 3 }] } } });

		await expect(getAdminWaitlistSummary()).resolves.toEqual({ totalActive: 5, byDoctor: [{ doctorId: "doctor-1", doctorName: "Omar Saleh", count: 3 }] });

		expect(mockedGet).toHaveBeenCalledWith("/analytics/waitlist-summary");
	});

	it("cancels an admin appointment through the appointment delete endpoint", async () => {
		mockedDelete.mockResolvedValueOnce({ data: undefined });

		await cancelAdminAppointment("appointment-1");

		expect(mockedDelete).toHaveBeenCalledWith("/appointments/appointment-1");
	});
});
