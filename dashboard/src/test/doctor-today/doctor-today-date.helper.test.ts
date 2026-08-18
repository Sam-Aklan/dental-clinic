import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { monthEnd, monthStart, todayClinicDate, toClinicDate, toClinicTime, weekEnd, weekStart } from "@/lib/doctor-today";

describe("doctor today date helpers", () => {
	it("formats clinic date and time", () => {
		expect(toClinicDate("2026-05-11T00:00:00.000Z", "Asia/Riyadh")).toBe("2026-05-11");
		expect(toClinicTime("2026-05-11T09:15:00.000Z", "Asia/Riyadh")).toBe("12:15");
	});

	it("returns clinic date boundaries", () => {
		const reference = dayjs("2026-05-11T12:00:00.000Z").toDate();
		expect(todayClinicDate(reference, "Asia/Riyadh")).toBe("2026-05-11");
		expect(weekStart(reference, "Asia/Riyadh")).toMatch(/2026-05/);
		expect(weekEnd(reference, "Asia/Riyadh")).toMatch(/2026-05/);
		expect(monthStart(reference, "Asia/Riyadh")).toBe("2026-05-01");
		expect(monthEnd(reference, "Asia/Riyadh")).toBe("2026-05-31");
	});
});
