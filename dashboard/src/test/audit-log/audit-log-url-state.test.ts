import { describe, expect, it } from "vitest";
import { parseAuditLogSearch, serializeAuditLogSearch, updateAuditLogState } from "@/lib/audit-log";

describe("audit log url state", () => {
	it("falls back to defaults for invalid values", () => {
		const search = parseAuditLogSearch({ from: "bad", to: "also-bad", page: "0", pageSize: "999", sortBy: "nope", sortDir: "sideways" }, "UTC");

		expect(search.page).toBe(1);
		expect(search.pageSize).toBe(50);
		expect(search.sortBy).toBe("createdAt");
		expect(search.sortDir).toBe("desc");
	});

	it("serializes without empty optional params", () => {
		const serialized = serializeAuditLogSearch({ from: "2026-05-04", to: "2026-05-11", page: 1, pageSize: 50, sortBy: "createdAt", sortDir: "desc", actorId: "", targetId: undefined });

		expect(serialized).not.toHaveProperty("actorId");
		expect(serialized).not.toHaveProperty("targetId");
	});

	it("resets page when a filter changes", () => {
		const next = updateAuditLogState({ from: "2026-05-04", to: "2026-05-11", page: 3, pageSize: 50, sortBy: "createdAt", sortDir: "desc" }, { actorId: "abc" });

		expect(next.page).toBe(1);
		expect(next.actorId).toBe("abc");
	});
});
