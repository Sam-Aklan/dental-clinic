import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { AuditLogPage } from "@/components/audit-log";
import { renderWithAuditLogProviders } from "./audit-log-test-utils";
import { auditLogResponseFixture, auditLogStateFixture } from "./audit-log-fixtures";

vi.mock("@/hooks/audit-log", () => ({
	useAuditLogQuery: () => ({
		data: auditLogResponseFixture,
		isLoading: false,
		isError: false,
		isFetching: false,
		refetch: vi.fn(),
	}),
	useAuditLogUrlState: () => ({
		search: auditLogStateFixture,
		setSearch: vi.fn(),
		setPage: vi.fn(),
		setPageSize: vi.fn(),
		setSort: vi.fn(),
		reset: vi.fn(),
	}),
}));

describe("audit log page", () => {
	it("renders the title and recent entries", () => {
		renderWithAuditLogProviders(<AuditLogPage />);

		expect(screen.getByText("Audit Log")).toBeInTheDocument();
		expect(screen.getAllByText("appointment canceled · APPOINTMENT appt-1")).toHaveLength(2);
		expect(screen.getAllByRole("button", { name: /View details/ })).toHaveLength(2);
	});
});
