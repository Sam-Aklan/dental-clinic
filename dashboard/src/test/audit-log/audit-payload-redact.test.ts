import { describe, expect, it } from "vitest";
import { redactPayload } from "@/lib/audit-log";

describe("audit payload redaction", () => {
	it("redacts nested sensitive keys without mutating the original payload", () => {
		const input = { token: "abc", nested: { refresh_token: "def", ok: true }, list: [{ Authorization: "secret" }] };
		const copy = structuredClone(input);

		const redacted = redactPayload(input) as Record<string, unknown>;

		expect(redacted.token).toBe("[REDACTED]");
		expect((redacted.nested as Record<string, unknown>).refresh_token).toBe("[REDACTED]");
		expect(((redacted.list as Array<Record<string, unknown>>)[0]).Authorization).toBe("[REDACTED]");
		expect(input).toEqual(copy);
	});
});
