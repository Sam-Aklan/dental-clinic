import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "@/test/common-components/test-utils";
import { DashboardFilters } from "@/components/admin-dashboard/DashboardFilters";

vi.mock("@/hooks/admin-dashboard", () => ({
	useAdminDashboardDoctorOptions: () => ({
		isOpen: false,
		handleOpenChange: vi.fn(),
		searchQuery: "",
		setSearchQuery: vi.fn(),
		selectedDoctorName: "All Doctors",
		options: [],
		isLoading: false,
	}),
}));

describe("DashboardFilters", () => {
	const mockOnApply = vi.fn();
	const mockOnReset = vi.fn();

	const defaultProps = {
		state: {
			from: "2026-06-01",
			to: "2026-06-30",
			doctorId: "",
			status: "",
			patientName: "",
			bucket: "auto" as const,
			page: 1,
			pageSize: 20,
			sortBy: "startsAt" as const,
			sortDir: "asc" as const,
		},
		onApply: mockOnApply,
		onReset: mockOnReset,
		labels: {
			title: "Filters",
			from: "From",
			to: "To",
			doctorId: "Doctor",
			doctorAll: "All Doctors",
			doctorSearchPlaceholder: "Search doctor...",
			doctorLoading: "Loading...",
			doctorEmpty: "No doctors found",
			status: "Status",
			patientName: "Patient Name",
			bucket: "Bucket",
			apply: "Apply",
			reset: "Reset",
		},
		statusOptions: [
			{ value: "PENDING", label: "Pending" },
			{ value: "CONFIRMED", label: "Confirmed" },
		],
		bucketOptions: [
			{ value: "auto", label: "Auto" },
			{ value: "day", label: "Day" },
		],
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders filters with default values", () => {
		renderWithProviders(<DashboardFilters {...defaultProps} />);

		expect(screen.getByText("Filters")).toBeInTheDocument();
		expect(screen.getByRole("combobox", { name: "Status" })).toBeInTheDocument();
		expect(screen.getByRole("combobox", { name: "Bucket" })).toBeInTheDocument();
	});

	it("applies status and bucket selection correctly", async () => {
		const user = setupUser();
		renderWithProviders(<DashboardFilters {...defaultProps} />);

		// Open Status dropdown and select 'Confirmed'
		const statusSelect = screen.getByRole("combobox", { name: "Status" });
		await user.click(statusSelect);
		const confirmedOption = await screen.findByRole("option", { name: "Confirmed" });
		await user.click(confirmedOption);

		// Open Bucket dropdown and select 'Day'
		const bucketSelect = screen.getByRole("combobox", { name: "Bucket" });
		await user.click(bucketSelect);
		const dayOption = await screen.findByRole("option", { name: "Day" });
		await user.click(dayOption);

		// Click apply button
		const applyBtn = screen.getByRole("button", { name: "Apply" });
		await user.click(applyBtn);

		expect(mockOnApply).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "CONFIRMED",
				bucket: "day",
			}),
		);
	});

	it("resets status selection to empty string when placeholder/all option is chosen", async () => {
		const user = setupUser();
		// Initial state has status: "CONFIRMED"
		renderWithProviders(
			<DashboardFilters
				{...defaultProps}
				state={{
					...defaultProps.state,
					status: "CONFIRMED",
				}}
			/>,
		);

		// Open Status dropdown and select 'Status' (the placeholder / ALL value)
		const statusSelect = screen.getByRole("combobox", { name: "Status" });
		await user.click(statusSelect);
		const allOption = await screen.findByRole("option", { name: "Status" });
		await user.click(allOption);

		// Click apply button
		const applyBtn = screen.getByRole("button", { name: "Apply" });
		await user.click(applyBtn);

		expect(mockOnApply).toHaveBeenCalledWith(
			expect.objectContaining({
				status: "",
			}),
		);
	});

	it("triggers reset callback when Reset button is clicked", async () => {
		const user = setupUser();
		renderWithProviders(<DashboardFilters {...defaultProps} />);

		const resetBtn = screen.getByRole("button", { name: "Reset" });
		await user.click(resetBtn);

		expect(mockOnReset).toHaveBeenCalled();
	});
});
