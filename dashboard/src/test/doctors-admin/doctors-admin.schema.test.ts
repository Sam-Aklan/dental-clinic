import { describe, expect, it } from "vitest";
import { doctorProfileSchema, scheduleOverrideSchema } from "@/lib/doctors-admin";

describe("doctors-admin schemas", () => {
	it("validates doctor profile fields", () => {
		const parsed = doctorProfileSchema.safeParse({ firstName: "A", lastName: "B", email: "a@example.com", phone: "+1 555 000 0000", specialization: "Ortho", bio: "Bio", isActive: true, preferredLocale: "EN" });
		expect(parsed.success).toBe(true);
		expect(parsed.success ? "preferredLocale" in parsed.data : false).toBe(false);
		expect(doctorProfileSchema.safeParse({ firstName: "A", lastName: "B", email: "a@example.com", phone: "+1 555 000 0000", specialization: "Ortho", bio: "Bio", isActive: true }).success).toBe(true);
		expect(doctorProfileSchema.safeParse({ firstName: "", lastName: "B", email: "bad", phone: "x" }).success).toBe(false);
		expect(doctorProfileSchema.safeParse({ firstName: "A", lastName: "B", email: "a@example.com", phone: "123" }).success).toBe(false);
	});

	it("validates schedule override fields", () => {
		expect(scheduleOverrideSchema.safeParse({ date: "2099-01-01", isUnavailable: true, startTime: null, endTime: null, reason: "Vacation" }).success).toBe(true);
		expect(scheduleOverrideSchema.safeParse({ date: "2099-01-01", isUnavailable: false, startTime: "09:00", endTime: "17:00" }).success).toBe(true);
		expect(scheduleOverrideSchema.safeParse({ date: "2099-01-01", isUnavailable: false, startTime: undefined, endTime: undefined }).success).toBe(false);
		expect(scheduleOverrideSchema.safeParse({ date: "2000-01-01", isUnavailable: false, startTime: "09:00", endTime: "17:00" }).success).toBe(false);
		expect(scheduleOverrideSchema.safeParse({ date: "2099-01-01", isUnavailable: false, startTime: "17:00", endTime: "09:00" }).success).toBe(false);
	});
});
