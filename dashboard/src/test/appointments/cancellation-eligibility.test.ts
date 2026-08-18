import { describe, expect, it } from "vitest";
import { getCancelAppointmentErrorCode, isAppointmentCancelable } from "@/lib/appointments";
import { appointmentFixtures } from "./fixtures";

describe("cancellation-eligibility.helper", () => {
	it("allows pending and confirmed appointments at least 24 hours away", () => {
		expect(isAppointmentCancelable(appointmentFixtures.futurePending, new Date("2026-05-08T10:00:00.000Z"))).toBe(true);
		expect(isAppointmentCancelable(appointmentFixtures.futureConfirmedAt24Hours, new Date("2026-05-08T08:00:00.000Z"))).toBe(true);
	});

	it("blocks appointments inside the 24 hour window or with ineligible statuses", () => {
		expect(isAppointmentCancelable(appointmentFixtures.futureConfirmedUnder24Hours, new Date("2026-05-08T10:00:00.000Z"))).toBe(false);
		expect(isAppointmentCancelable(appointmentFixtures.futureInProgress, new Date("2026-05-08T10:00:00.000Z"))).toBe(false);
		expect(isAppointmentCancelable(appointmentFixtures.pastCompleted, new Date("2026-05-08T10:00:00.000Z"))).toBe(false);
	});

	it("maps cancellation errors to stable codes", () => {
		expect(getCancelAppointmentErrorCode({ response: { status: 403 } })).toBe("not-owned");
		expect(getCancelAppointmentErrorCode({ response: { status: 409, data: { code: "APPOINTMENT_ALREADY_CANCELED" } } })).toBe("already-canceled");
		expect(getCancelAppointmentErrorCode({ response: { status: 400, data: { code: "APPOINTMENT_CANCELLATION_TOO_LATE" } } })).toBe("too-late");
		expect(getCancelAppointmentErrorCode(new Error("network"))).toBe("network");
	});
});
