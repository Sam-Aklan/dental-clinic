import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/axios-instance";
import { auditLogKeys, auditLogQueryOptions, getAuditLog } from "@/lib/audit-log";
import { auditLogApiResponseFixture, auditLogEntryFixture, auditLogStateFixture } from "./audit-log-fixtures";

describe("audit log api", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it("unwraps the audit response envelope", async () => {
		vi.spyOn(api, "get").mockResolvedValueOnce({ data: { data: auditLogApiResponseFixture } } as never);

		await expect(getAuditLog(auditLogStateFixture)).resolves.toEqual({
			items: [auditLogEntryFixture],
			total: 1,
			page: 1,
			pageSize: 50,
			totalPages: 1,
		});
	});

	it("builds stable query options", () => {
		const options = auditLogQueryOptions(auditLogStateFixture);

		expect(options.queryKey).toEqual(auditLogKeys.list(auditLogStateFixture));
		expect(options.staleTime).toBe(30_000);
	});
});
