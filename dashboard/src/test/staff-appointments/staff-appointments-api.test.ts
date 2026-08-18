import { describe, expect, it } from "vitest";
import { appointmentSlotsQueryOptions, staffAppointmentsKeys, staffAppointmentsQueryOptions, staffWaitlistQueryOptions } from "@/lib/staff-appointments";

describe("staff appointments API contracts", () => {
	it("builds stable appointment and waitlist query keys", () => {
		expect(staffAppointmentsKeys.appointmentList({ tab: "today", pageSize: 10 })).toEqual([
			"staff-appointments",
			"appointments",
			{ tab: "today", pageSize: 10 },
		]);
		expect(staffAppointmentsKeys.waitlistList({ page: 1, pageSize: 10 })).toEqual([
			"staff-appointments",
			"waitlist",
			{ page: 1, pageSize: 10 },
		]);
	});

	it("creates query options for appointments, waitlist, and slots", () => {
		expect(staffAppointmentsQueryOptions({ tab: "today" }).queryKey).toEqual([
			"staff-appointments",
			"appointments",
			{ tab: "today" },
		]);
		expect(staffWaitlistQueryOptions({}).queryKey).toEqual(["staff-appointments", "waitlist", {}]);
		expect(appointmentSlotsQueryOptions("doctor-1", "2026-05-09").queryKey).toEqual([
			"staff-appointments",
			"slots",
			"doctor-1",
			"2026-05-09",
		]);
	});
});
