import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DoctorSelector } from "@/components/booking";
import { renderWithProviders } from "@/test/common-components/test-utils";

describe("DoctorSelector", () => {
	it("filters inactive doctors, shows fallback text, and supports retry", async () => {
		const onSelectDoctor = vi.fn();
		const onRetry = vi.fn();

		renderWithProviders(
			<DoctorSelector
				doctors={[
					{ id: "doc-1", firstName: "Sara", lastName: "Ahmed", specialization: "Orthodontics", bio: "Top doctor", isActive: true },
					{ id: "doc-2", firstName: "Omar", lastName: "Hassan", specialization: null, bio: null, isActive: true },
					{ id: "doc-3", firstName: "Leila", lastName: "Nasser", specialization: "Pediatric Dentistry", bio: "Inactive", isActive: false },
				]}
				isLoading={false}
				isError={false}
				onRetry={onRetry}
				selectedDoctorId={null}
				onSelectDoctor={onSelectDoctor}
			/>,
		);

		expect(screen.getByText("Sara Ahmed")).toBeInTheDocument();
		expect(screen.getByText("Orthodontics")).toBeInTheDocument();
		expect(screen.getByText("Top doctor")).toBeInTheDocument();
		expect(screen.getByText("Specialization not listed")).toBeInTheDocument();
		expect(screen.getByText("Bio not available")).toBeInTheDocument();
		expect(screen.queryByText("Leila Nasser")).not.toBeInTheDocument();
		expect(screen.queryByText(/email/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/phone/i)).not.toBeInTheDocument();

		await userEvent.click(screen.getAllByRole("option")[0]);
		expect(onSelectDoctor).toHaveBeenCalledWith("doc-1");
	});

	it("shows an error state with retry", async () => {
		const onRetry = vi.fn();

		renderWithProviders(
			<DoctorSelector
				doctors={[]}
				isLoading={false}
				isError={true}
				onRetry={onRetry}
				selectedDoctorId={null}
				onSelectDoctor={vi.fn()}
			/>,
		);

		await userEvent.click(screen.getByRole("button", { name: "Retry" }));
		expect(onRetry).toHaveBeenCalledOnce();
	});
});
