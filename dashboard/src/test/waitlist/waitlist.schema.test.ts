import { describe, expect, it } from "vitest";
import { availabilityWindowSchema } from "@/lib/waitlist";

describe("availabilityWindowSchema", () => {
	it("accepts both times as null (any available time)", () => {
		const result = availabilityWindowSchema.safeParse({
			doctorId: "doc-1",
			availableFrom: null,
			availableUntil: null,
		});
		expect(result.success).toBe(true);
	});

	it("accepts both times as undefined (any available time)", () => {
		const result = availabilityWindowSchema.safeParse({
			doctorId: "doc-1",
		});
		expect(result.success).toBe(true);
	});

	it("accepts both times as empty strings (any available time)", () => {
		const result = availabilityWindowSchema.safeParse({
			doctorId: "doc-1",
			availableFrom: "",
			availableUntil: "",
		});
		expect(result.success).toBe(true);
	});

	it("accepts a valid availability window with both times", () => {
		const result = availabilityWindowSchema.safeParse({
			doctorId: "doc-1",
			availableFrom: "09:00",
			availableUntil: "13:00",
		});
		expect(result.success).toBe(true);
	});

	it("rejects when only availableFrom is provided", () => {
		const result = availabilityWindowSchema.safeParse({
			doctorId: "doc-1",
			availableFrom: "09:00",
			availableUntil: null,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("waitlist.errors.windowIncomplete");
		}
	});

	it("rejects when only availableUntil is provided", () => {
		const result = availabilityWindowSchema.safeParse({
			doctorId: "doc-1",
			availableFrom: null,
			availableUntil: "13:00",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("waitlist.errors.windowIncomplete");
		}
	});

	it("rejects when end time is before start time", () => {
		const result = availabilityWindowSchema.safeParse({
			doctorId: "doc-1",
			availableFrom: "13:00",
			availableUntil: "09:00",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("waitlist.errors.windowInvalid");
		}
	});

	it("rejects when end time equals start time", () => {
		const result = availabilityWindowSchema.safeParse({
			doctorId: "doc-1",
			availableFrom: "09:00",
			availableUntil: "09:00",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("waitlist.errors.windowInvalid");
		}
	});

	it("rejects when doctorId is missing", () => {
		const result = availabilityWindowSchema.safeParse({
			availableFrom: null,
			availableUntil: null,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues).toBeDefined();
		}
	});

	it("rejects when doctorId is empty", () => {
		const result = availabilityWindowSchema.safeParse({
			doctorId: "",
			availableFrom: null,
			availableUntil: null,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0].message).toBe("waitlist.errors.doctorRequired");
		}
	});
});
