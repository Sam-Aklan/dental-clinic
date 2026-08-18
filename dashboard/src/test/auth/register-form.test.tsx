import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { renderWithProviders } from "./test-utils";
import { RegisterForm } from "@/components/auth/RegisterForm";

const mutateSpy = vi.fn();

vi.mock("@/hooks/auth/use-register-mutation", () => ({
	useRegisterMutation: () => ({ mutate: mutateSpy, isPending: false }),
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children, ...props }: { to: string; children: ReactNode; [key: string]: unknown }) => (
		<a href={to} {...props}>{children}</a>
	),
}));

function setup() {
	const user = userEvent.setup();
	return { ...renderWithProviders(<RegisterForm />), user };
}

describe("RegisterForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
	});

	it("omits phone and date of birth from the submit payload", async () => {
		const { user } = setup();

		await user.type(screen.getByLabelText(/first name/i), "Sara");
		await user.type(screen.getByLabelText(/last name/i), "Ali");
		await user.type(screen.getByLabelText(/email/i), "sara@example.com");
		await user.type(screen.getByLabelText(/^password$/i), "Password123");
		await user.type(screen.getByLabelText(/^confirm password$/i), "Password123");
		await user.type(screen.getByLabelText(/phone number/i), "+966555555555");
		await user.type(screen.getByLabelText(/date of birth/i), "1990-01-01");
		await user.click(screen.getByLabelText(/agree to the terms/i));
		await user.click(screen.getByRole("button", { name: /create account/i }));

		await waitFor(() => expect(mutateSpy).toHaveBeenCalledTimes(1));
		expect(mutateSpy).toHaveBeenCalledWith({
			firstName: "Sara",
			lastName: "Ali",
			email: "sara@example.com",
			password: "Password123",
		});
	});
});
