import { describe, expect, it } from "vitest";
import { addHolidaySchema, bookingRulesSchema, weeklyScheduleSchema } from "@/lib/clinic-settings";

const timezone = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone")[0] ?? "UTC" : "UTC";

describe("clinic settings schemas", () => {
	it("accepts valid booking rules", () => {
		expect(bookingRulesSchema.safeParse({
			timeZone: timezone,
			slotDurationMinutes: 30,
			reminderHoursBefore: 24,
			waitlistOfferWindowMinutes: 60,
			minArrivalBufferMinutes: 15,
		}).success).toBe(true);
	});

	it("rejects invalid slot duration", () => {
		const result = bookingRulesSchema.safeParse({
			timeZone: timezone,
			slotDurationMinutes: 7,
			reminderHoursBefore: 24,
			waitlistOfferWindowMinutes: 60,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("clinicSettings.bookingRules.slotDurationStep");
		}
	});

	it("accepts a seven-day schedule with open and closed days", () => {
		const result = weeklyScheduleSchema.safeParse({
			weekdays: Array.from({ length: 7 }, (_, dayOfWeek) => ({
				dayOfWeek,
				isClosed: dayOfWeek === 0 || dayOfWeek === 6,
				startTime: dayOfWeek === 0 || dayOfWeek === 6 ? "" : "08:00",
				endTime: dayOfWeek === 0 || dayOfWeek === 6 ? "" : "16:00",
			})),
		});

		expect(result.success).toBe(true);
	});

	it("rejects duplicate weekdays", () => {
		const result = weeklyScheduleSchema.safeParse({
			weekdays: [
				{ dayOfWeek: 0, isClosed: true, startTime: "", endTime: "" },
				{ dayOfWeek: 0, isClosed: true, startTime: "", endTime: "" },
				{ dayOfWeek: 2, isClosed: true, startTime: "", endTime: "" },
				{ dayOfWeek: 3, isClosed: true, startTime: "", endTime: "" },
				{ dayOfWeek: 4, isClosed: true, startTime: "", endTime: "" },
				{ dayOfWeek: 5, isClosed: true, startTime: "", endTime: "" },
				{ dayOfWeek: 6, isClosed: true, startTime: "", endTime: "" },
			],
		});

		expect(result.success).toBe(false);
	});

	it("accepts valid holiday payloads", () => {
		expect(addHolidaySchema.safeParse({ date: "2026-05-10", name: "Founding Day" }).success).toBe(true);
	});

	it("rejects malformed holiday dates", () => {
		const result = addHolidaySchema.safeParse({ date: "10-05-2026", name: "Founding Day" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("clinicSettings.holidays.invalidDate");
		}
	});
});
