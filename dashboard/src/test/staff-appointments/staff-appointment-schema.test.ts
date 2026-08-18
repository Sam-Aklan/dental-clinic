import { describe, expect, it } from "vitest";
import { cancelStaffAppointmentSchema, rescheduleStaffAppointmentSchema } from "@/lib/staff-appointments";

describe("staff appointment schemas", () => {
	it("requires a non-empty cancel reason", () => {
		expect(cancelStaffAppointmentSchema.safeParse({ reason: "" }).success).toBe(false);
		expect(cancelStaffAppointmentSchema.safeParse({ reason: "Changed plans" }).success).toBe(true);
	});

	it("validates reschedule payload fields", () => {
		expect(
			rescheduleStaffAppointmentSchema.safeParse({
				doctorId: "not-a-uuid",
				date: "2026-05-09",
				startsAt: "2026-05-09T10:00:00.000Z",
			}).success,
		).toBe(false);

		expect(
			rescheduleStaffAppointmentSchema.safeParse({
				doctorId: "550e8400-e29b-41d4-a716-446655440000",
				date: "2026-05-09",
				startsAt: "2026-05-09T10:00:00.000Z",
			}).success,
		).toBe(true);
	});
});
