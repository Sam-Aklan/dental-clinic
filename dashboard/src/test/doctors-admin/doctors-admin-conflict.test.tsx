import { useState } from "react";
import { describe, expect, it } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@/test/auth/test-utils";
import { DoctorProfileForm, ScheduleOverrideForm } from "@/components/doctors-admin";
import { renderDoctorsAdmin } from "./doctors-admin.test-utils";

function DoctorCreateConflictHarness() {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	return (
		<DoctorProfileForm
			mode="create"
			submitLabel="Create doctor"
			errorMessage={errorMessage}
			onSubmit={async () => {
				setErrorMessage("That email already exists.");
			}}
		/>
	);
}

function OverrideConflictHarness() {
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	return (
		<ScheduleOverrideForm
			submitLabel="Save override"
			errorMessage={errorMessage}
			onSubmit={async () => {
				setErrorMessage("A schedule override already exists for that date.");
			}}
		/>
	);
}

describe("doctors-admin conflict handling", () => {
	it("preserves create form values when the backend reports a duplicate email", async () => {
		renderDoctorsAdmin(<DoctorCreateConflictHarness />);
		const user = userEvent.setup();

		await user.type(screen.getByLabelText("First name"), "Sara");
		await user.type(screen.getByLabelText("Last name"), "Ahmed");
		await user.type(screen.getByLabelText("Email"), "sara@example.com");
		await user.click(screen.getByRole("button", { name: "Create doctor" }));

		expect(await screen.findByText("That email already exists.")).toBeInTheDocument();
		expect(screen.getByLabelText("First name")).toHaveValue("Sara");
		expect(screen.getByLabelText("Email")).toHaveValue("sara@example.com");
	});

	it("preserves override form values when the backend reports a duplicate date", async () => {
		renderDoctorsAdmin(<OverrideConflictHarness />);
		const user = userEvent.setup();

		const dateInput = document.querySelector('input[name="date"]') as HTMLInputElement;
		fireEvent.change(dateInput, { target: { value: "2099-06-01" } });

		await user.type(screen.getByLabelText("Reason"), "Public holiday");
		await user.click(screen.getByRole("button", { name: "Save override" }));

		expect(await screen.findByText("A schedule override already exists for that date.")).toBeInTheDocument();
		expect(dateInput.value).toBe("2099-06-01");
		expect(screen.getByLabelText("Reason")).toHaveValue("Public holiday");
	});
});
