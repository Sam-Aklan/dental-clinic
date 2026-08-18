import { describe, expect, it } from "vitest";
import { filterFutureFollowUpSlots, groupFollowUpSlotsByPeriod, isFutureFollowUpSlot, getFollowUpClinicDayBounds, canScheduleFollowUp } from "@/lib/follow-ups";
import { mixedFollowUpSlots } from "./fixtures";

describe("follow-up slot helpers", () => {
	it("filters past slots and groups by period", () => {
		const reference = new Date("2026-06-09T07:00:00.000Z");
		const future = filterFutureFollowUpSlots(mixedFollowUpSlots, reference);
		expect(future).toHaveLength(3);
		expect(groupFollowUpSlotsByPeriod(future).map((group) => group.period)).toEqual(["morning", "afternoon", "evening"]);
	});

	it("builds date bounds and checks future slots", () => {
		expect(getFollowUpClinicDayBounds("2026-06-09")).toEqual({ from: "2026-06-09", to: "2026-06-09" });
		expect(isFutureFollowUpSlot("2026-06-09T08:00:00.000Z", new Date("2026-06-09T07:00:00.000Z"))).toBe(true);
	});

	it("allows follow-up scheduling only for completed appointments", () => {
		expect(canScheduleFollowUp("COMPLETED")).toBe(true);
		expect(canScheduleFollowUp("PENDING" as never)).toBe(false);
	});
});
