import type { DoctorQueueAppointment, DoctorQueueFilterState } from "@/types";

export const doctorQueueFixtures = {
	doctorA: {
		id: "doctor-a",
		name: "Doctor A",
	},
	doctorB: {
		id: "doctor-b",
		name: "Doctor B",
	},
	currentDayAppointments: [
		{ id: "appt-1", position: 1, startsAt: "2026-05-11T08:00:00.000Z", endsAt: "2026-05-11T08:30:00.000Z", status: "PENDING", needsFollowUp: false, followUpId: null, notes: null, updatedAt: "2026-05-11T07:00:00.000Z" },
		{ id: "appt-2", position: 2, startsAt: "2026-05-11T08:15:00.000Z", endsAt: "2026-05-11T08:45:00.000Z", status: "CONFIRMED", needsFollowUp: false, followUpId: null, notes: "Call patient on arrival", updatedAt: "2026-05-11T07:15:00.000Z" },
		{ id: "appt-3", position: 3, startsAt: "2026-05-11T09:30:00.000Z", endsAt: "2026-05-11T10:00:00.000Z", status: "CONFIRMED", needsFollowUp: false, followUpId: null, notes: null, updatedAt: "2026-05-11T07:30:00.000Z" },
		{ id: "appt-4", position: 4, startsAt: "2026-05-11T07:45:00.000Z", endsAt: "2026-05-11T08:15:00.000Z", status: "IN_PROGRESS", needsFollowUp: false, followUpId: null, notes: "Long note with PII removed", updatedAt: "2026-05-11T08:10:00.000Z" },
		{ id: "appt-5", position: 5, startsAt: "2026-05-11T06:30:00.000Z", endsAt: "2026-05-11T07:00:00.000Z", status: "COMPLETED", needsFollowUp: true, followUpId: null, notes: null, updatedAt: "2026-05-11T08:30:00.000Z" },
		{ id: "appt-7", position: 7, startsAt: "2026-05-11T06:35:00.000Z", endsAt: "2026-05-11T07:05:00.000Z", status: "COMPLETED", needsFollowUp: true, followUpId: "follow-up-7", notes: null, updatedAt: "2026-05-11T08:35:00.000Z" },
		{ id: "appt-6", position: 6, startsAt: "2026-05-11T06:45:00.000Z", endsAt: "2026-05-11T07:15:00.000Z", status: "NO_SHOW", needsFollowUp: false, followUpId: null, notes: null, updatedAt: "2026-05-11T08:45:00.000Z" },
	] satisfies DoctorQueueAppointment[],
	emptyAppointments: [] as DoctorQueueAppointment[],
	finishedOnlyAppointments: [
		{ id: "appt-7", position: 7, startsAt: "2026-05-11T06:30:00.000Z", endsAt: "2026-05-11T07:00:00.000Z", status: "COMPLETED", needsFollowUp: true, followUpId: "follow-up-7", notes: null, updatedAt: "2026-05-11T08:30:00.000Z" },
		{ id: "appt-8", position: 8, startsAt: "2026-05-11T06:45:00.000Z", endsAt: "2026-05-11T07:15:00.000Z", status: "NO_SHOW", needsFollowUp: false, followUpId: null, notes: null, updatedAt: "2026-05-11T08:45:00.000Z" },
	] satisfies DoctorQueueAppointment[],
	defaultFilters: {
		statuses: [],
		showFinished: false,
	} satisfies DoctorQueueFilterState,
	allFilters: {
		statuses: ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW", "CANCELED"],
		showFinished: true,
	} satisfies DoctorQueueFilterState,
};
