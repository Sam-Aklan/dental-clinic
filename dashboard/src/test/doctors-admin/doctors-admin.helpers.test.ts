import { describe, expect, it } from "vitest";
import { hasStatusSupport, normalizeApiError, parseDoctorsAdminSearch, toDoctorFilters, unwrapPaginated } from "@/lib/doctors-admin";

describe("doctors-admin helpers", () => {
	it("parses doctor admin search params", () => {
		expect(parseDoctorsAdminSearch({ q: "  ana ", specialization: "  ortho ", status: "active", page: "3", doctorId: "abc", tab: "overrides" })).toEqual({
			q: "ana",
			specialization: "ortho",
			status: "active",
			page: 3,
			doctorId: "abc",
			tab: "overrides",
		});
	});

	it("normalizes filters and pagination payloads", () => {
		expect(toDoctorFilters(parseDoctorsAdminSearch({ page: "1", q: "", specialization: "" }))).toEqual({ q: undefined, specialization: undefined, status: undefined, page: undefined });
		expect(unwrapPaginated([{ id: "1" }])).toEqual({ data: [{ id: "1" }], total: 1, page: 1, pageSize: 1 });
	});

	it("detects status support", () => {
		expect(hasStatusSupport([{ id: "1", firstName: "A", lastName: "B", email: null, phone: null, specialization: null, bio: null, isActive: true }])).toBe(true);
		expect(hasStatusSupport([{ id: "1", firstName: "A", lastName: "B", email: null, phone: null, specialization: null, bio: null }])).toBe(false);
	});

	it("normalizes API errors from strings, arrays, and fallback shapes", () => {
		expect(normalizeApiError("  duplicate email  ")).toBe("duplicate email");
		expect(normalizeApiError({ response: { data: { message: "invalid payload" } } })).toBe("invalid payload");
		expect(normalizeApiError({ response: { data: { message: ["first error", "second error"] } } })).toBe("first error, second error");
		expect(normalizeApiError(new Error("boom"))).toBe("boom");
		expect(normalizeApiError({})).toBe("Unknown error");
	});
});
