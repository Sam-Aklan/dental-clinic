import { describe, expect, it } from "vitest";
import { doctorQueueKeys } from "@/lib/doctor-queue";
import { appointmentNotesPath, appointmentStatusPath } from "@/lib/api-paths";

describe("doctor queue API helpers", () => {
	it("builds status and note paths", () => {
		expect(appointmentStatusPath("appt-1")).toBe("/appointments/appt-1/status");
		expect(appointmentNotesPath("appt-1")).toBe("/appointments/appt-1/notes");
	});

	it("builds query keys", () => {
		expect(doctorQueueKeys.all).toEqual(["doctor-queue"]);
		expect(doctorQueueKeys.date("2026-05-11")).toEqual(["doctor-queue", "date", "2026-05-11"]);
		expect(doctorQueueKeys.filters({ statuses: ["CONFIRMED"], showFinished: true })).toEqual(["doctor-queue", "filters", "finished", "CONFIRMED"]);
	});
});
