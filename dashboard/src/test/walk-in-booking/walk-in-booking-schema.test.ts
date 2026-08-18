import { describe, expect, it } from "vitest";
import { walkInBookingSchema } from "@/lib/walk-in";

describe("walkInBookingSchema", () => {
	it("requires patient, doctor, and slot", () => {
		const result = walkInBookingSchema.safeParse({ patientId: "", doctorId: "", startsAt: "" });
		expect(result.success).toBe(false);
	});
});
