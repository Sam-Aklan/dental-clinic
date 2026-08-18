import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { UserForm } from "@/components/users-admin/UserForm";
import { renderWithProviders, setupUser, mockAdminUser } from "./test-utils";
import { toast } from "sonner";

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("UserForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});
	it("renders user form and handles role and language selection with custom select components", async () => {
		const user = setupUser();
		const handleSubmit = vi.fn();

		renderWithProviders(
			<UserForm
				mode="create"
				onSubmit={handleSubmit}
			/>
		);

		// Fill text fields
		await user.type(screen.getByLabelText(/First name/i), "John");
		await user.type(screen.getByLabelText(/Last name/i), "Doe");
		await user.type(screen.getByLabelText(/Email/i), "john.doe@example.com");
		await user.type(screen.getByLabelText(/Phone/i), "+962-79-1234567");
		await user.type(screen.getByLabelText(/Temporary password/i), "SecurePassword1!");

		// Click and select role using custom select
		const roleSelect = screen.getByRole("combobox", { name: /Role/i });
		await user.click(roleSelect);
		const doctorOption = await screen.findByRole("option", { name: /Doctor/i });
		await user.click(doctorOption);

		// Click and select language using custom select
		const langSelect = screen.getByRole("combobox", { name: /Language/i });
		await user.click(langSelect);
		const arOption = await screen.findByRole("option", { name: /Arabic/i });
		await user.click(arOption);

		// Submit form
		const submitBtn = screen.getByRole("button", { name: /Create/i });
		await user.click(submitBtn);

		await waitFor(() => {
			expect(handleSubmit).toHaveBeenCalledWith({
				firstName: "John",
				lastName: "Doe",
				email: "john.doe@example.com",
				phone: "+962-79-1234567",
				role: "DOCTOR",
				languagePreference: "ar",
				password: "SecurePassword1!",
			});
			expect(toast.success).toHaveBeenCalledWith("User created successfully");
		});
	});

	it("shows error toast when onSubmit fails", async () => {
		const user = setupUser();
		const handleSubmit = vi.fn().mockRejectedValue({
			response: {
				data: {
					message: "email_already_exists"
				}
			}
		});

		renderWithProviders(
			<UserForm
				mode="create"
				onSubmit={handleSubmit}
			/>
		);

		await user.type(screen.getByLabelText(/First name/i), "John");
		await user.type(screen.getByLabelText(/Last name/i), "Doe");
		await user.type(screen.getByLabelText(/Email/i), "john.doe@example.com");
		await user.type(screen.getByLabelText(/Phone/i), "+962-79-1234567");
		await user.type(screen.getByLabelText(/Temporary password/i), "SecurePassword1!");

		const submitBtn = screen.getByRole("button", { name: /Create/i });
		await user.click(submitBtn);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("email_already_exists");
		});
	});

	it("disables the role select when currentUserId matches the edited user id", async () => {
		const handleSubmit = vi.fn();
		const targetUser = mockAdminUser({ id: "user-123", role: "ADMIN" });

		renderWithProviders(
			<UserForm
				mode="edit"
				user={targetUser}
				currentUserId="user-123"
				onSubmit={handleSubmit}
			/>
		);

		const roleSelect = screen.getByRole("combobox", { name: /Role/i });
		expect(roleSelect).toBeDisabled();
	});
});
