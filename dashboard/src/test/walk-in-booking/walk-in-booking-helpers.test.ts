import { describe, expect, it } from "vitest";
import { buildWalkInSummaryState, findWalkInSlotByStart, getPatientDisplayName, getDoctorDisplayName, validateWalkInDate } from "@/lib/walk-in";
import { createWalkInDoctor, createWalkInPatient, createWalkInSlot } from "./walk-in-booking.fixtures";

describe("walk-in helpers", () => {
	it("validates non-past dates", () => {
		expect(validateWalkInDate("2099-12-31")).toBe("2099-12-31");
		expect(validateWalkInDate("2020-01-01")).toBeNull();
		expect(validateWalkInDate("bad-date")).toBeNull();
	});

	it("formats display names with fallbacks", () => {
		expect(getPatientDisplayName(createWalkInPatient())).toBe("Sara Ahmed");
		expect(getDoctorDisplayName(createWalkInDoctor())).toBe("Omar Ali");
	});

	it("finds slots by exact start time", () => {
		const slot = createWalkInSlot();
		expect(findWalkInSlotByStart([slot], slot.startsAt)).toEqual(slot);
	});

	it("builds summary state with readiness", () => {
		const patient = createWalkInPatient();
		const doctor = createWalkInDoctor();
		const slot = createWalkInSlot();
		const summary = buildWalkInSummaryState({
			patient,
			doctor,
			selectedDate: "2026-05-10",
			selectedSlot: slot,
			locale: "en",
		});
		expect(summary.canConfirm).toBe(true);
		expect(summary.patientName).toBe("Sara Ahmed");
	});
});
