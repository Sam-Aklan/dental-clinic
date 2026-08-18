import { describe, it, expect } from "vitest";
import { bookingKeys } from "@/lib/booking";

describe("bookingKeys", () => {
	it("separates reserved-inclusive slot queries from default slot queries", () => {
		expect(bookingKeys.slots("doc-1", "2026-05-10", "2026-05-10")).toEqual([
			"booking",
			"slots",
			"doc-1",
			{ from: "2026-05-10", to: "2026-05-10", includeReserved: false },
		]);

		expect(bookingKeys.slots("doc-1", "2026-05-10", "2026-05-10", true)).toEqual([
			"booking",
			"slots",
			"doc-1",
			{ from: "2026-05-10", to: "2026-05-10", includeReserved: true },
		]);
	});
});
