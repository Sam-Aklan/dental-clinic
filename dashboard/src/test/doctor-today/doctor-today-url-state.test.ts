import { describe, expect, it } from "vitest";
import { createDefaultDoctorTodayState, parseDoctorTodaySearch, serializeDoctorTodaySearch, updateDoctorTodayState } from "@/lib/doctor-today";

describe("doctor today url state", () => {
	it("uses stable defaults", () => {
		expect(createDefaultDoctorTodayState("2026-05-11T00:00:00.000Z" as never)).toMatchObject({
			date: "2026-05-11",
			week: "2026-05-11",
			tab: "today",
			page: 1,
			sortBy: "startsAt",
			sortDir: "asc",
			status: [],
		});
	});

	it("parses invalid values safely", () => {
		expect(parseDoctorTodaySearch({ date: "", week: "2026-05-12", tab: "bad", status: "CONFIRMED,NO_SHOW,INVALID", page: "-2", sortBy: "status", sortDir: "desc" })).toMatchObject({
			date: expect.any(String),
			week: "2026-05-12",
			tab: "today",
			status: ["CONFIRMED", "NO_SHOW"],
			page: 1,
			sortBy: "status",
			sortDir: "desc",
		});
	});

	it("serializes and patches state without dropping unrelated values", () => {
		const parsed = parseDoctorTodaySearch({ status: "CONFIRMED" });
		const next = updateDoctorTodayState(parsed, { tab: "thisWeek", page: 3, sortDir: "desc" });
		expect(next.tab).toBe("thisWeek");
		expect(next.page).toBe(1);
		expect(serializeDoctorTodaySearch(next)).toEqual(expect.objectContaining({ status: "CONFIRMED", sortDir: "desc" }));
	});
});
