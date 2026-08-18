import { describe, it, expect } from "vitest";
import {
	getClinicTodayDate,
	isPastClinicDate,
	getDayBounds,
	formatClinicDate,
	formatClinicTimeRange,
	filterFutureSlots,
	isFutureClinicSlot,
	groupSlotsByClinicTime,
	findSlotByStart,
	parseBookingSearch,
	validatePreselectedDoctor,
	validatePreselectedDate,
} from "@/lib/booking";
import { createDoctor, createSlot } from "@/test/booking/test-utils";

describe("getClinicTodayDate", () => {
	it("returns a string in YYYY-MM-DD format", () => {
		const today = getClinicTodayDate();
		expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});
});

describe("isPastClinicDate", () => {
	it("returns true for a date in the past", () => {
		expect(isPastClinicDate("2020-01-01")).toBe(true);
	});

	it("returns false for a date far in the future", () => {
		expect(isPastClinicDate("2099-12-31")).toBe(false);
	});
});

describe("getDayBounds", () => {
	it("returns from and to equal to the input date", () => {
		const bounds = getDayBounds("2026-05-10");
		expect(bounds).toEqual({ from: "2026-05-10", to: "2026-05-10" });
	});
});

describe("formatClinicDate", () => {
	it("formats a date string to a locale-specific format", () => {
		const formatted = formatClinicDate("2026-05-10", "en");
		expect(formatted).toBeTruthy();
		expect(typeof formatted).toBe("string");
	});
});

describe("formatClinicTimeRange", () => {
	it("formats start and end times in clinic timezone", () => {
		const result = formatClinicTimeRange(
			"2026-05-10T07:00:00.000Z",
			"2026-05-10T07:30:00.000Z",
			"en",
		);
		expect(result).toBeTruthy();
		expect(result).toContain(" - ");
	});

	it("returns a string for Arabic locale", () => {
		const result = formatClinicTimeRange(
			"2026-05-10T07:00:00.000Z",
			"2026-05-10T07:30:00.000Z",
			"ar",
		);
		expect(result).toBeTruthy();
		expect(result).toContain(" - ");
	});
});

	describe("filterFutureSlots", () => {
		it("filters out slots with startsAt in the past", () => {
			const pastSlot = createSlot({ startsAt: "2020-01-01T07:00:00.000Z" });
			const futureSlot = createSlot({ startsAt: "2099-12-31T07:00:00.000Z" });
			const result = filterFutureSlots([pastSlot, futureSlot]);
		expect(result).toHaveLength(1);
		expect(result[0]).toEqual(futureSlot);
	});

		it("returns empty array when all slots are in the past", () => {
			const pastSlot = createSlot({ startsAt: "2020-01-01T07:00:00.000Z" });
			expect(filterFutureSlots([pastSlot])).toHaveLength(0);
		});

		it("hides earlier same-day slots in clinic time", () => {
			const earlierSlot = createSlot({ startsAt: "2026-05-10T06:00:00.000Z" });
			const laterSlot = createSlot({ startsAt: "2026-05-10T13:00:00.000Z" });

			const result = filterFutureSlots([earlierSlot, laterSlot], new Date("2026-05-10T12:00:00.000Z"));

			expect(result).toEqual([laterSlot]);
		});
	});

describe("isFutureClinicSlot", () => {
	it("returns false for an earlier slot on the same clinic day", () => {
		expect(isFutureClinicSlot("2026-05-10T06:00:00.000Z", new Date("2026-05-10T12:00:00.000Z"))).toBe(false);
	});
});

describe("groupSlotsByClinicTime", () => {
	it("groups morning slots correctly (hour < 12 in clinic timezone)", () => {
		const morningSlot = createSlot({ startsAt: "2026-05-10T07:00:00.000Z" });
		const groups = groupSlotsByClinicTime([morningSlot]);
		expect(groups).toHaveLength(1);
		expect(groups[0].label).toBe("morning");
		expect(groups[0].slots).toHaveLength(1);
	});
});

describe("findSlotByStart", () => {
	it("finds a slot by its startsAt value", () => {
		const slot = createSlot({ startsAt: "2026-05-10T07:00:00.000Z" });
		const found = findSlotByStart([slot], "2026-05-10T07:00:00.000Z");
		expect(found).toEqual(slot);
	});

	it("returns undefined for a missing startsAt", () => {
		const found = findSlotByStart([], "2026-05-10T07:00:00.000Z");
		expect(found).toBeUndefined();
	});
});

describe("parseBookingSearch", () => {
	it("parses doctorId and date from search params", () => {
		const result = parseBookingSearch({
			doctorId: "doc-1",
			date: "2026-05-10",
		});
		expect(result).toEqual({ doctorId: "doc-1", date: "2026-05-10" });
	});

	it("handles missing params", () => {
		const result = parseBookingSearch({});
		expect(result).toEqual({ doctorId: undefined, date: undefined });
	});
});

describe("validatePreselectedDoctor", () => {
	it("returns doctorId if doctor exists and is active", () => {
		const doctor = createDoctor({ id: "doc-1", isActive: true });
		const result = validatePreselectedDoctor("doc-1", [doctor]);
		expect(result).toBe("doc-1");
	});

	it("returns null if doctor is inactive", () => {
		const doctor = createDoctor({ id: "doc-1", isActive: false });
		const result = validatePreselectedDoctor("doc-1", [doctor]);
		expect(result).toBeNull();
	});

	it("returns null if doctorId is undefined", () => {
		const result = validatePreselectedDoctor(undefined, [createDoctor()]);
		expect(result).toBeNull();
	});
});

describe("validatePreselectedDate", () => {
	it("returns date if valid and not in the past", () => {
		const result = validatePreselectedDate("2099-12-31");
		expect(result).toBe("2099-12-31");
	});

	it("returns null for invalid format", () => {
		expect(validatePreselectedDate("not-a-date")).toBeNull();
	});

	it("returns null for past date", () => {
		expect(validatePreselectedDate("2020-01-01")).toBeNull();
	});

	it("returns null for undefined", () => {
		expect(validatePreselectedDate(undefined)).toBeNull();
	});
});
