import { describe, expect, it } from "vitest";
import { parseStaffQueueSearch, serializeStaffQueueSearch } from "@/lib/queue";

describe("queue search helper", () => {
	it("parses and serializes filter state", () => {
		const parsed = parseStaffQueueSearch({ doctorId: "d1,d2", status: "PENDING,CONFIRMED", q: " Amina " });
		expect(parsed.doctorIds).toEqual(["d1", "d2"]);
		expect(parsed.statuses).toEqual(["PENDING", "CONFIRMED"]);
		expect(parsed.search).toBe("Amina");
		expect(serializeStaffQueueSearch(parsed)).toEqual({ doctorId: "d1,d2", status: "PENDING,CONFIRMED", q: "Amina" });
	});
});
