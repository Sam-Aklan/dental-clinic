import type { LobbyQueueEntry } from "@/types";

export const lobbyDoctorFixture = {
	doctorId: "doctor-1",
	displayName: "Dr. Amina Hassan",
};

	export const lobbyActiveEntriesFixture: LobbyQueueEntry[] = [
	{ appointmentId: "appt-3", position: 3, startsAt: "2026-05-11T08:10:00Z", endsAt: "2026-05-11T08:25:00Z", notes: null, status: "IN_PROGRESS", startedTime: "2026-05-11T08:12:00Z" },
	{ appointmentId: "appt-4", position: 4, startsAt: "2026-05-11T08:30:00Z", endsAt: "2026-05-11T08:45:00Z", notes: null, status: "CONFIRMED" },
	{ appointmentId: "appt-5", position: 5, startsAt: "2026-05-11T08:45:00Z", endsAt: "2026-05-11T09:00:00Z", notes: null, status: "PENDING" },
	{ appointmentId: "appt-6", position: 6, startsAt: "2026-05-11T09:00:00Z", endsAt: "2026-05-11T09:15:00Z", notes: null, status: "CONFIRMED" },
	{ appointmentId: "appt-7", position: 7, startsAt: "2026-05-11T09:15:00Z", endsAt: "2026-05-11T09:30:00Z", notes: null, status: "PENDING" },
	{ appointmentId: "appt-8", position: 8, startsAt: "2026-05-11T09:30:00Z", endsAt: "2026-05-11T09:45:00Z", notes: null, status: "PENDING" },
	{ appointmentId: "appt-9", position: 9, startsAt: "2026-05-11T09:45:00Z", endsAt: "2026-05-11T10:00:00Z", notes: null, status: "CONFIRMED" },
	{ appointmentId: "appt-10", position: 10, startsAt: "2026-05-11T10:00:00Z", endsAt: "2026-05-11T10:15:00Z", notes: null, status: "PENDING" },
	{ appointmentId: "appt-11", position: 11, startsAt: "2026-05-11T10:15:00Z", endsAt: "2026-05-11T10:30:00Z", notes: null, status: "CONFIRMED" },
	{ appointmentId: "appt-12", position: 12, startsAt: "2026-05-11T10:30:00Z", endsAt: "2026-05-11T10:45:00Z", notes: null, status: "PENDING" },
	{ appointmentId: "appt-13", position: 13, startsAt: "2026-05-11T10:45:00Z", endsAt: "2026-05-11T11:00:00Z", notes: null, status: "CONFIRMED" },
	{ appointmentId: "appt-14", position: 14, startsAt: "2026-05-11T11:00:00Z", endsAt: "2026-05-11T11:15:00Z", notes: null, status: "PENDING" },
];

	export const lobbyHiddenEntriesFixture: LobbyQueueEntry[] = [
	{ appointmentId: "appt-1", position: 1, startsAt: "2026-05-11T07:00:00Z", endsAt: "2026-05-11T07:15:00Z", notes: null, status: "COMPLETED" },
	{ appointmentId: "appt-2", position: 2, startsAt: "2026-05-11T07:30:00Z", endsAt: "2026-05-11T07:45:00Z", notes: null, status: "CANCELED" },
	{ appointmentId: "appt-15", position: 15, startsAt: "2026-05-11T11:00:00Z", endsAt: "2026-05-11T11:15:00Z", notes: null, status: "NO_SHOW" },
];

export const lobbyEmptyEntriesFixture: LobbyQueueEntry[] = [];

export const lobbyPrivateEntryFixture = {
	appointmentId: "appt-4",
	position: 4,
	startsAt: "2026-05-11T08:30:00Z",
	endsAt: "2026-05-11T08:45:00Z",
	notes: null,
	status: "CONFIRMED" as const,
	patientName: "Hidden Patient",
	patientId: "patient-4",
	email: "hidden@example.com",
	phone: "+123456789",
} satisfies LobbyQueueEntry & Record<string, unknown>;
