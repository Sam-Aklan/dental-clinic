import { describe, expect, it } from "vitest";
import type { AppointmentUrlState } from "@/types";
import { createDefaultStaffAppointmentState, decodeStaffAppointmentSearch, encodeStaffAppointmentSearch } from "@/lib/staff-appointments";

describe("staff appointment URL state helpers", () => {
	it("encodes and decodes the default state", () => {
		const state = createDefaultStaffAppointmentState();
		expect(decodeStaffAppointmentSearch(encodeStaffAppointmentSearch(state))).toEqual(state);
	});

	it("preserves selected filters in the query string model", () => {
		const state: AppointmentUrlState = {
			...createDefaultStaffAppointmentState("upcoming"),
			from: "2026-05-09",
			to: "2026-05-16",
			doctorIds: ["doctor-1", "doctor-2"],
			statuses: ["CONFIRMED", "PENDING"],
			patientName: "Amina",
			page: 3,
			sortBy: "createdAt" as const,
			sortDir: "desc" as const,
		};

		expect(encodeStaffAppointmentSearch(state)).toEqual({
			tab: "upcoming",
			from: "2026-05-09",
			to: "2026-05-16",
			doctorId: "doctor-1,doctor-2",
			status: "CONFIRMED,PENDING",
			patientName: "Amina",
			page: "3",
			sortBy: "createdAt",
			sortDir: "desc",
		});
	});
});
