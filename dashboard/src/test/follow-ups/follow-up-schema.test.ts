import { describe, expect, it } from "vitest";
import { followUpScheduleSchema } from "@/lib/follow-ups";

describe("follow-up schedule schema", () => {
	it("accepts trimmed reason and optional notes", () => {
		expect(followUpScheduleSchema.safeParse({ slotStartsAt: "2026-06-09T12:30:00.000Z", reason: "  Review healing  ", notes: "  Bring x-ray  " }).success).toBe(true);
	});

	it("rejects missing slot, blank reason, and oversized text", () => {
		expect(followUpScheduleSchema.safeParse({ slotStartsAt: "", reason: "Review healing" }).success).toBe(false);
		expect(followUpScheduleSchema.safeParse({ slotStartsAt: "2026-06-09T12:30:00.000Z", reason: "   " }).success).toBe(false);
		expect(followUpScheduleSchema.safeParse({ slotStartsAt: "2026-06-09T12:30:00.000Z", reason: "x".repeat(501) }).success).toBe(false);
		expect(followUpScheduleSchema.safeParse({ slotStartsAt: "2026-06-09T12:30:00.000Z", reason: "Review healing", notes: "x".repeat(2001) }).success).toBe(false);
	});
});
