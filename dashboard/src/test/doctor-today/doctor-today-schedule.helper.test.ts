import { describe, expect, it } from "vitest";
import { buildDoctorTodayScheduleRows, formatDoctorTodayDurationLabel, isDoctorTodayInSession, sortDoctorTodayAppointments } from "@/lib/doctor-today";

const appointments = [
	{
		id: "b",
		startsAt: "2026-05-11T09:30:00.000Z",
		endsAt: "2026-05-11T09:45:00.000Z",
		status: "CONFIRMED",
		patientSequence: 2,
		notes: null,
		createdAt: "2026-05-11T00:00:00.000Z",
		updatedAt: "2026-05-11T00:00:00.000Z",
	},
	{
		id: "a",
		startsAt: "2026-05-11T08:00:00.000Z",
		endsAt: "2026-05-11T08:30:00.000Z",
		status: "IN_PROGRESS",
		patientSequence: 1,
		notes: null,
		createdAt: "2026-05-11T00:00:00.000Z",
		updatedAt: "2026-05-11T00:00:00.000Z",
	},
] as const;

describe("doctor today schedule helpers", () => {
	it("sorts appointments and inserts gap rows", () => {
		expect(sortDoctorTodayAppointments([...appointments])).toHaveLength(2);
		const rows = buildDoctorTodayScheduleRows([...appointments], 10);
		expect(rows[0]).toMatchObject({ kind: "appointment", data: { id: "a" } });
		expect(rows[1]).toMatchObject({ kind: "gap" });
		expect(rows[2]).toMatchObject({ kind: "appointment", data: { id: "b" } });
	});

	it("formats duration and session state", () => {
		expect(formatDoctorTodayDurationLabel("2026-05-11T08:00:00.000Z", "2026-05-11T09:30:00.000Z")).toBe("1h 30m");
		expect(isDoctorTodayInSession(appointments[1] as never)).toBe(true);
	});
});
