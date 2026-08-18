import { describe, expect, it } from "vitest";
import {
	buildAppointmentListParams,
	filterAppointmentsForState,
	getAppointmentDoctorOptions,
	groupAppointmentsByTab,
	parseAppointmentSearch,
	serializeAppointmentSearch,
} from "@/lib/appointments";
import type { AppointmentStatus } from "@/types";
import { appointmentFixtures, createAppointment, listWithMixedAppointments } from "./fixtures";

describe("appointment-filters.helper", () => {
	it("groups appointments into the correct tabs and orders them", () => {
		const result = groupAppointmentsByTab(listWithMixedAppointments().items, new Date("2026-05-08T00:00:00.000Z"));
		expect(result.upcoming.map((item) => item.id)).toEqual(["appt-confirmed-under", "appt-confirmed-24", "appt-pending-future", "appt-in-progress"]);
		expect(result.past.map((item) => item.id)).toEqual(["appt-completed", "appt-no-show"]);
		expect(result.canceled.map((item) => item.id)).toEqual(["appt-canceled"]);
	});

	it("parses and serializes search state safely", () => {
		const parsed = parseAppointmentSearch({ tab: "past", doctorId: " doc-2 ", status: "COMPLETED,NO_SHOW", page: "3", created: "appt-1" });
		expect(parsed.tab).toBe("past");
		expect(parsed.doctorId).toBe("doc-2");
		expect(parsed.statuses).toEqual(["COMPLETED", "NO_SHOW"]);
		expect(parsed.page).toBe(3);
		expect(parsed.createdAppointmentId).toBe("appt-1");
		expect(parsed.sortBy).toBe("startsAt");
		expect(parsed.sortDir).toBe("desc");
		expect(serializeAppointmentSearch(parsed)).toEqual({
			tab: "past",
			doctorId: "doc-2",
			status: "COMPLETED,NO_SHOW",
			page: "3",
			created: "appt-1",
			sortBy: "startsAt",
			sortDir: "desc"
		});
	});

	it("builds appointment list params from state", () => {
		const params = buildAppointmentListParams({
			tab: "upcoming",
			doctorId: null,
			statuses: ["PENDING"] as AppointmentStatus[],
			page: 2,
			createdAppointmentId: null,
			sortBy: "startsAt",
			sortDir: "asc"
		}, new Date("2026-05-08T00:00:00.000Z"));
		expect(params.sortBy).toBe("startsAt");
		expect(params.sortDir).toBe("asc");
		expect(params.from).toBe("2026-05-08");
		expect(params.to).toBeNull();
	});

	it("filters appointments by selected tab and doctor", () => {
		const state = {
			tab: "upcoming" as const,
			doctorId: "doc-1",
			statuses: ["PENDING", "CONFIRMED", "IN_PROGRESS"] as AppointmentStatus[],
			page: 1,
			createdAppointmentId: null,
			sortBy: "startsAt" as const,
			sortDir: "asc" as const
		};
		const filtered = filterAppointmentsForState(listWithMixedAppointments().items, state, new Date("2026-05-08T00:00:00.000Z"));
		expect(filtered.every((item) => item.doctorId === "doc-1")).toBe(true);
	});

	it("derives doctor options from available results", () => {
		const appointments = [
			appointmentFixtures.futurePending,
			createAppointment({ id: "appt-2", doctorId: "doc-2", doctor: appointmentFixtures.doctorWithoutSpecialization }),
			createAppointment({ id: "appt-3", doctorId: "doc-2", doctor: appointmentFixtures.doctorWithoutSpecialization }),
		];
		expect(getAppointmentDoctorOptions(appointments)).toHaveLength(2);
	});
});
