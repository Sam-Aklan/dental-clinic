import { describe, expect, it } from "vitest";
import { queueAppointmentFixture } from "./fixtures";
import { STAFF_TRANSITIONS, getVisibleStaffTransitions, isValidTransition } from "@/lib/queue";

describe("queue transitions", () => {
	it("exposes the expected transition map", () => {
		expect(STAFF_TRANSITIONS.PENDING).toEqual(["CONFIRMED", "CANCELED"]);
		expect(isValidTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
		expect(isValidTransition("COMPLETED", "CONFIRMED")).toBe(false);
	});

	it("hides no-show before start time", () => {
		const visible = getVisibleStaffTransitions(queueAppointmentFixture, new Date("2026-05-09T07:30:00.000Z"));
		expect(visible).not.toContain("NO_SHOW");
	});
});
