import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { AuditLogPage } from "@/components/audit-log";
import { renderWithAuditLogProviders } from "./audit-log-test-utils";
import { auditLogEntryFixture, auditLogResponseFixture, auditLogStateFixture } from "./audit-log-fixtures";

const mocks = vi.hoisted(() => ({
	query: {
		data: undefined,
		isLoading: false,
		isError: false,
		isFetching: false,
		refetch: vi.fn(),
	},
	url: {
		search: undefined,
		setSearch: vi.fn(),
		setPage: vi.fn(),
		setPageSize: vi.fn(),
		setSort: vi.fn(),
		reset: vi.fn(),
	},
})) as { query: any; url: any };

vi.mock("@/hooks/audit-log", () => ({
	useAuditLogQuery: () => mocks.query,
	useAuditLogUrlState: () => mocks.url,
}));

describe("audit log page behavior", () => {
	beforeEach(() => {
		mocks.query.data = auditLogResponseFixture;
		mocks.query.isLoading = false;
		mocks.query.isError = false;
		mocks.query.isFetching = false;
		mocks.url.search = auditLogStateFixture;
		mocks.query.refetch.mockReset();
		mocks.url.reset.mockReset();
	});

	it("shows an error banner but keeps existing rows when a refetch fails", () => {
		mocks.query = {
			...mocks.query,
			data: { ...auditLogResponseFixture, items: [auditLogEntryFixture] },
			isError: true,
		};

		renderWithAuditLogProviders(<AuditLogPage />);

		expect(screen.getByRole("alert")).toHaveTextContent("Could not load audit log");
		expect(screen.getAllByText("appointment canceled · APPOINTMENT appt-1")).toHaveLength(2);
		expect(screen.getAllByRole("button", { name: /View details/ })).toHaveLength(2);
	});

	it("shows a resettable empty state when no rows are returned", () => {
		mocks.query = {
			...mocks.query,
			data: { items: [], total: 0, page: 1, pageSize: 50, totalPages: 0 },
		};

		renderWithAuditLogProviders(<AuditLogPage />);

		expect(screen.getAllByText("No audit entries found")).toHaveLength(1);
		expect(screen.getByText("Try clearing the filters or refreshing the log.")).toBeInTheDocument();
		expect(screen.getAllByRole("button", { name: "Reset" }).length).toBeGreaterThan(0);
		expect(screen.getAllByRole("button", { name: "Refresh" }).length).toBeGreaterThan(0);
	});
});
