import { describe, expect, it } from "vitest";
import { formatDoctorName, formatPosition, formatAvailability, formatJoinedDate } from "@/lib/waitlist";
import { createWaitlistEntry } from "@/test/waitlist/fixtures";

describe("waitlist-display.helper", () => {
	describe("formatDoctorName", () => {
		it("returns the full doctor name with first and last name", () => {
			const entry = createWaitlistEntry();
			expect(formatDoctorName(entry)).toBe("Ahmad Al-Rashid");
		});

		it("returns only what is available for partial doctor names", () => {
			const entry = createWaitlistEntry({
				doctor: { id: "doc-x", firstName: "Only", lastName: "", specialization: null },
			});
			expect(formatDoctorName(entry)).toBe("Only");
		});
	});

	describe("formatPosition", () => {
		it("returns formatted position when position is positive", () => {
			expect(formatPosition(3)).toBe("Position #3");
		});

		it("returns null when position is 0", () => {
			expect(formatPosition(0)).toBeNull();
		});

		it("returns null when position is negative", () => {
			expect(formatPosition(-1)).toBeNull();
		});

		it("returns null when position is undefined", () => {
			expect(formatPosition(undefined)).toBeNull();
		});
	});

	describe("formatAvailability", () => {
		it("returns the any-time label when both fields are null", () => {
			expect(formatAvailability(null, null)).toBe("waitlist.anyTime");
		});

		it("returns the any-time label when both fields are empty strings", () => {
			expect(formatAvailability("", "")).toBe("waitlist.anyTime");
		});

		it("returns a formatted window when both times are present", () => {
			expect(formatAvailability("09:00", "13:00")).toBe("09:00 - 13:00");
		});
	});

	describe("formatJoinedDate", () => {
		it("formats an ISO date string into a locale-aware display", () => {
			const result = formatJoinedDate("2026-05-08T08:00:00.000Z");
			expect(result).toContain("2026");
			expect(result).toContain("8");
		});

		it("handles a date without a time part", () => {
			const result = formatJoinedDate("2026-01-15");
			expect(result).toContain("2026");
		});
	});
});
