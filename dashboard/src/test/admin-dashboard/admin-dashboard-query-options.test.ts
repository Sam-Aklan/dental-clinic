import { describe, expect, it } from "vitest";
import {
	adminDashboardAppointmentsByWeekdayQueryOptions,
	adminDashboardCancellationTrendsQueryOptions,
	adminDashboardDoctorUtilizationQueryOptions,
	adminDashboardKpiSummaryQueryOptions,
	adminDashboardStatusDistributionQueryOptions,
	adminDashboardTrendsQueryOptions,
	adminDashboardWaitlistSummaryQueryOptions,
} from "@/lib/admin-dashboard";

const params = { from: "2026-05-01", to: "2026-05-20", bucket: "week" as const };

describe("admin dashboard query options", () => {
	it("polls analytics queries every 60 seconds", () => {
		expect(adminDashboardKpiSummaryQueryOptions(params).refetchInterval).toBe(60_000);
		expect(adminDashboardTrendsQueryOptions(params).refetchInterval).toBe(60_000);
		expect(adminDashboardStatusDistributionQueryOptions(params).refetchInterval).toBe(60_000);
		expect(adminDashboardDoctorUtilizationQueryOptions(params).refetchInterval).toBe(60_000);
		expect(adminDashboardAppointmentsByWeekdayQueryOptions(params).refetchInterval).toBe(60_000);
		expect(adminDashboardCancellationTrendsQueryOptions(params).refetchInterval).toBe(60_000);
		expect(adminDashboardWaitlistSummaryQueryOptions().refetchInterval).toBe(60_000);
	});

	it("keys the waitlist summary query separately", () => {
		expect(adminDashboardWaitlistSummaryQueryOptions().queryKey).toEqual(["admin-dashboard", "waitlist-summary"]);
	});
});
