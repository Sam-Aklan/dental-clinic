import { describe, expect, it } from "vitest";
import { formatAppointmentDateTime, formatAvailabilityWindow, formatDelta, formatDoctorName, formatEmptyValue, formatLocalizedDate, formatPatientName, formatPercent, formatWeekdayLabel } from "@/lib/admin-dashboard";

describe("admin dashboard formatters", () => {
	it("formats percent and delta values", () => {
		expect(formatPercent(0)).toBe("0%");
		expect(formatPercent(0.126)).toBe("13%");
		expect(formatPercent(undefined)).toBe("—");
		expect(formatDelta(0.12)).toBe("↑ +12%");
		expect(formatDelta(-0.08)).toBe("↓ -8%");
		expect(formatDelta(undefined)).toBe("Current period");
	});

	it("formats dates and names", () => {
		expect(formatLocalizedDate("2026-05-10T00:00:00.000Z")).toContain("2026");
		expect(formatAppointmentDateTime("2026-05-10T09:30:00.000Z")).toContain("2026-05-10");
		expect(formatDoctorName({ id: "d1", firstName: "Jane", lastName: "Smith" })).toBe("Jane Smith");
		expect(formatPatientName({ id: "p1", firstName: "Layla", lastName: "Hassan" })).toBe("Layla Hassan");
		expect(formatDoctorName(undefined)).toBe("—");
		expect(formatPatientName(undefined)).toBe("—");
	});

	it("formats availability windows and weekday labels", () => {
		expect(formatAvailabilityWindow(null, null)).toBe("Any time");
		expect(formatAvailabilityWindow("09:00", "17:00")).toBe("09:00 - 17:00");
		expect(formatWeekdayLabel(1)).toBe("Monday");
		expect(formatWeekdayLabel(1, "ar")).toBe("الاثنين");
		expect(formatEmptyValue()).toBe("—");
	});
});
