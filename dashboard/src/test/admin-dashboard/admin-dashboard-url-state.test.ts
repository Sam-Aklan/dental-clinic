import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultAdminDashboardUrlState, getEffectiveTrendBucket, parseAdminDashboardSearch, serializeAdminDashboardSearch } from "@/lib/admin-dashboard";

afterEach(() => {
	vi.useRealTimers();
});

describe("admin dashboard URL state helpers", () => {
	it("parses the default state from an empty search object", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-20T12:00:00Z"));
		const state = parseAdminDashboardSearch({});
		expect(state.tab).toBe("appointments");
		expect(state.bucket).toBe("auto");
		expect(state.page).toBe(1);
		expect(state.thresholdDays).toBe(90);
		expect(state.from).toBe("2026-05-01");
		expect(state.to).toBe("2026-05-20");
	});

	it("serializes and preserves explicit filter state", () => {
		const state = parseAdminDashboardSearch({
			from: "2026-05-01",
			to: "2026-05-10",
			bucket: "week",
			tab: "waitlist",
			doctorId: "doctor-1",
			status: "CONFIRMED",
			patientName: "Amina",
			thresholdDays: "120",
			page: "3",
			sortBy: "doctorName",
			sortDir: "desc",
		});

		expect(serializeAdminDashboardSearch(state)).toEqual({
			from: "2026-05-01",
			to: "2026-05-10",
			bucket: "week",
			tab: "waitlist",
			doctorId: "doctor-1",
			status: "CONFIRMED",
			patientName: "Amina",
			thresholdDays: "120",
			page: "3",
			sortBy: "doctorName",
			sortDir: "desc",
		});
	});

	it("computes an automatic trend bucket when requested", () => {
		expect(getEffectiveTrendBucket("2026-01-01", "2026-01-10", "auto")).toBe("day");
		expect(getEffectiveTrendBucket("2026-01-01", "2026-12-31", "auto")).toBe("week");
		expect(getEffectiveTrendBucket("2026-01-01", "2027-12-31", "auto")).toBe("month");
	});

	it("preserves valid defaults when filter values are invalid", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-05-20T12:00:00Z"));

		const state = parseAdminDashboardSearch({
			from: "",
			to: "",
			bucket: "invalid",
			tab: "invalid",
			doctorId: "   ",
			status: "invalid",
			patientName: "  Amina  ",
			thresholdDays: "0",
			page: "0",
			sortBy: "invalid",
			sortDir: "invalid",
		});

		expect(state).toMatchObject({
			from: "2026-05-01",
			to: "2026-05-20",
			bucket: "auto",
			tab: "appointments",
			doctorId: "",
			status: "",
			patientName: "Amina",
			thresholdDays: 90,
			page: 1,
			sortBy: "startsAt",
			sortDir: "asc",
		});
	});

	it("keeps explicit state defaults stable", () => {
		expect(createDefaultAdminDashboardUrlState().tab).toBe("appointments");
	});
});
