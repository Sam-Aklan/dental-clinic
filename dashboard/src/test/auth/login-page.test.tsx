import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { renderWithProviders } from "./test-utils";
import { LoginForm, LoginSection } from "@/components/auth";

const loginMutation = vi.hoisted(() => ({
	isPending: false,
	mutate: vi.fn(),
	onApiError: undefined as undefined | ((key: string) => void),
}));

vi.mock("@/hooks/auth/use-login-mutation", () => ({
	useLoginMutation: (onApiError?: (key: string) => void) => {
		loginMutation.onApiError = onApiError;
		return {
			mutate: loginMutation.mutate,
			isPending: loginMutation.isPending,
		};
	},
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ to, children, ...props }: { to: string; children: ReactNode; [key: string]: unknown }) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
}));

function setupLoginForm() {
	const user = userEvent.setup();
	return { ...renderWithProviders(<LoginForm />), user };
}

function setupLoginSection() {
	return renderWithProviders(<LoginSection />);
}

describe("LoginPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		loginMutation.isPending = false;
		loginMutation.onApiError = undefined;
	});

	it("renders the login shell with auth links", () => {
		setupLoginSection();

		expect(screen.getByRole("main")).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /forgot password\?/i })).toHaveAttribute("href", "/forgot-password");
		expect(screen.getByRole("link", { name: /register/i })).toHaveAttribute("href", "/register");
	});

	it("submits a normalized email payload", async () => {
		const { user } = setupLoginForm();

		await user.type(screen.getByLabelText(/email/i), "  USER@Example.com  ");
		await user.type(screen.getByLabelText(/^password$/i), "Password123!");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(loginMutation.mutate).toHaveBeenCalledWith({
				email: "user@example.com",
				password: "Password123!",
			});
		});
	});

	it("disables the submit button while pending", () => {
		loginMutation.isPending = true;
		setupLoginForm();

		expect(screen.getByRole("button", { name: /\.\.\./ })).toBeDisabled();
	});

	it("shows validation errors for missing fields", async () => {
		const { user } = setupLoginForm();

		await user.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
			expect(screen.getByText(/password is required/i)).toBeInTheDocument();
		});

		expect(loginMutation.mutate).not.toHaveBeenCalled();
	});

	it("renders invalid credentials and clears the alert when a field changes", async () => {
		const { user } = setupLoginForm();

		act(() => {
			loginMutation.onApiError?.("auth.errors.invalidCredentials");
		});

		expect(screen.getByRole("alert")).toHaveTextContent(/invalid email or password/i);

		await user.type(screen.getByLabelText(/email/i), "patient@example.com");

		await waitFor(() => {
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		});
	});

	it("renders account disabled feedback", () => {
		setupLoginForm();

		act(() => {
			loginMutation.onApiError?.("auth.errors.accountDisabled");
		});

		expect(screen.getByRole("alert")).toHaveTextContent(/your account has been disabled/i);
	});
});
