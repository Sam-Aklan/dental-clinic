import { describe, expect, it } from "vitest";
import { parseUserFilters, resetUserFilters, serializeUserFilters } from "@/lib/users-admin";

describe("users admin url state", () => {
	it("parses defaults", () => {
		expect(parseUserFilters({})).toEqual(resetUserFilters());
	});

	it("parses and serializes filters", () => {
		const parsed = parseUserFilters({ q: " alice ", role: "DOCTOR,ADMIN", status: "disabled", language: "ar", page: "2", sortBy: "name", sortDir: "desc" });
		expect(parsed).toEqual({ q: "alice", role: ["DOCTOR", "ADMIN"], status: "disabled", language: "ar", page: 2, sortBy: "name", sortDir: "desc" });
		expect(serializeUserFilters(parsed)).toMatchObject({ q: "alice", role: "DOCTOR,ADMIN", status: "disabled", language: "ar", page: "2", sortBy: "name", sortDir: "desc" });
	});

	it("accepts array-based search params without crashing", () => {
		const parsed = parseUserFilters({
			q: [" bob "],
			role: ["DOCTOR,ADMIN"],
			status: ["all"],
			language: ["en"],
			page: ["3"],
			sortBy: ["email"],
			sortDir: ["desc"],
		});

		expect(parsed).toEqual({ q: "bob", role: ["DOCTOR", "ADMIN"], status: "all", language: "en", page: 3, sortBy: "email", sortDir: "desc" });
	});
});
