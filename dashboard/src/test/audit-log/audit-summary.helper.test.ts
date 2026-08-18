import { describe, expect, it } from "vitest";
import { buildAuditSummary } from "@/lib/audit-log";

	describe("audit summary helper", () => {
	it("builds the planned summary format with target id", () => {
		expect(buildAuditSummary("APPOINTMENT_CANCELED", "APPOINTMENT", "appt-12345678")).toBe("appointment canceled · APPOINTMENT appt-123");
	});

	it("omits the id when the target is singleton", () => {
		expect(buildAuditSummary("CLINIC_CONFIG_UPDATED", "CLINIC_CONFIG", null)).toBe("clinic config updated · CLINIC_CONFIG");
	});
});
