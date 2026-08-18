import { describe, expect, it } from "vitest";
import { resolveLoginDestination } from "@/lib/auth/helpers";

describe("email redirect round-trip", () => {
	it("preserves the protected offer redirect after login", () => {
		const redirect = encodeURIComponent("/offers/offer-1");

		expect(resolveLoginDestination(redirect, "PATIENT")).toBe(decodeURIComponent(redirect));
	});

	it("preserves wildcard offer redirects that include slash-separated tokens", () => {
		const redirect = encodeURIComponent("/offers/offer/token-1");

		expect(resolveLoginDestination(redirect, "PATIENT")).toBe(decodeURIComponent(redirect));
	});

	it("falls back to the role home route for unsafe redirects", () => {
		expect(resolveLoginDestination("https://example.com", "PATIENT")).toBe("/book");
	});

	it("falls back to the role home route if the redirect target is '/'", () => {
		expect(resolveLoginDestination("/", "PATIENT")).toBe("/book");
		expect(resolveLoginDestination(encodeURIComponent("/"), "PATIENT")).toBe("/book");
	});
});
