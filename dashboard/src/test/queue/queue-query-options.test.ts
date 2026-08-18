import { describe, expect, it } from "vitest";
import { todayByDoctorQueryOptions, todaySummaryQueryOptions } from "@/lib/queue";

describe("queue query options", () => {
	it("polls today summary and today-by-doctor every 30 seconds", () => {
		expect(todaySummaryQueryOptions("2026-05-20").refetchInterval).toBe(30_000);
		expect(todayByDoctorQueryOptions("2026-05-20").refetchInterval).toBe(30_000);
	});
});
