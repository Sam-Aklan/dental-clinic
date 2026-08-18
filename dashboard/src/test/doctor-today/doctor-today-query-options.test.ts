import { describe, expect, it } from "vitest";
import { doctorTodayScheduleQueryOptions, myHourlyLoadQueryOptions, myStatsQueryOptions, myStatusDistributionQueryOptions, myTrendsQueryOptions } from "@/lib/doctor-today";

describe("doctor today query options", () => {
	it("polls doctor stats every 30 seconds", () => {
		expect(myStatsQueryOptions("2026-05-20").refetchInterval).toBe(30_000);
		expect(myStatsQueryOptions("2026-05-20").staleTime).toBe(60_000);
	});

	it("keeps personal chart stale-time behavior for other queries", () => {
		expect(myTrendsQueryOptions("2026-05-20").staleTime).toBe(60_000);
		expect(myTrendsQueryOptions("2026-05-20").refetchInterval).toBeUndefined();
		expect(myStatusDistributionQueryOptions("2026-05-01", "2026-05-20").staleTime).toBe(60_000);
		expect(myHourlyLoadQueryOptions("2026-05-01", "2026-05-20").staleTime).toBe(60_000);
		expect(doctorTodayScheduleQueryOptions({ from: "2026-05-20", to: "2026-05-20", status: [], page: 1, pageSize: 20, sortBy: "startsAt", sortDir: "asc" }).refetchInterval).toBe(60_000);
	});
});
