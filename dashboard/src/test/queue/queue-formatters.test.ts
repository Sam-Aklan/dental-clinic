import { describe, expect, it } from "vitest";
import { anotherQueueAppointmentFixture, queueAppointmentFixture } from "./fixtures";
import { formatDoctorName, formatPatientName, formatQueueTime, getPatientPhoneDisplay, groupByDoctor } from "@/lib/queue";

describe("queue formatters", () => {
	it("groups appointments by doctor and sorts by time", () => {
		const groups = groupByDoctor([anotherQueueAppointmentFixture, queueAppointmentFixture]);
		expect(groups).toHaveLength(1);
		expect(groups[0].appointments[0].id).toBe("appt-1");
		expect(groups[0].appointments[1].id).toBe("appt-2");
	});

	it("returns empty groups when appointments are missing", () => {
		expect(groupByDoctor(undefined)).toEqual([]);
		expect(groupByDoctor(null)).toEqual([]);
	});

	it("formats names and fallback values", () => {
		expect(formatDoctorName(queueAppointmentFixture.doctor)).toBe("Omar Saleh");
		expect(formatPatientName(queueAppointmentFixture.patient)).toBe("Amina Hassan");
		expect(formatQueueTime(queueAppointmentFixture.startsAt, queueAppointmentFixture.endsAt)).toContain("-");
		expect(getPatientPhoneDisplay(null)).toBe("—");
	});
});
