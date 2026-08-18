import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/common-components/test-utils";
import { WaitlistSummaryChart } from "@/components/admin-dashboard";

const summary = {
	totalActive: 12,
	byDoctor: [
		{ doctorId: "doctor-1", doctorName: "Omar Saleh", count: 7 },
		{ doctorId: "doctor-2", doctorName: "Lina Yusuf", count: 5 },
	],
};

describe("WaitlistSummaryChart", () => {
	it("renders loading state", () => {
		const { container } = renderWithProviders(
			<WaitlistSummaryChart
				title="Waitlist summary"
				totalActiveLabel="Total active"
				emptyLabel="No active waitlist entries right now"
				doctorCountLabel="Doctors with active waitlist"
				errorLabel="This chart failed to load"
				retryLabel="Retry"
				isLoading
			/>,
		);

		expect(screen.getByText("Waitlist summary")).toBeInTheDocument();
		expect(container.querySelector(".animate-pulse")).not.toBeNull();
	});

	it("renders error state with retry action", () => {
		const onRetry = vi.fn();
		renderWithProviders(
			<WaitlistSummaryChart
				title="Waitlist summary"
				totalActiveLabel="Total active"
				emptyLabel="No active waitlist entries right now"
				doctorCountLabel="Doctors with active waitlist"
				errorLabel="This chart failed to load"
				retryLabel="Retry"
				isError
				onRetry={onRetry}
			/>,
		);

		expect(screen.getByText("This chart failed to load")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
	});

	it("renders empty state", () => {
		renderWithProviders(
			<WaitlistSummaryChart
				title="Waitlist summary"
				data={{ totalActive: 0, byDoctor: [] }}
				totalActiveLabel="Total active"
				emptyLabel="No active waitlist entries right now"
				doctorCountLabel="Doctors with active waitlist"
				errorLabel="This chart failed to load"
				retryLabel="Retry"
			/>,
		);

		expect(screen.getByText("No active waitlist entries right now")).toBeInTheDocument();
	});

	it("renders per-doctor bars and total counts", () => {
		renderWithProviders(
			<WaitlistSummaryChart
				title="Waitlist summary"
				data={summary}
				totalActiveLabel="Total active"
				emptyLabel="No active waitlist entries right now"
				doctorCountLabel="Doctors with active waitlist"
				errorLabel="This chart failed to load"
				retryLabel="Retry"
			/>,
		);

		expect(screen.getByText("Total active")).toBeInTheDocument();
		expect(screen.getByText("12")).toBeInTheDocument();
		expect(screen.getByText("Omar Saleh")).toBeInTheDocument();
		expect(screen.getByText("Lina Yusuf")).toBeInTheDocument();
		expect(screen.getByText("Doctors with active waitlist: 2")).toBeInTheDocument();
	});
});
