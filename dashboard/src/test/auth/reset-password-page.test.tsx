import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";
import { roleHomeMap } from "@/constants";

const routerMocks = vi.hoisted(() => ({
	redirect: vi.fn((value: unknown) => value),
}));
const authState = vi.hoisted(() => ({
	isAuthenticated: false,
	user: null as null | { role: keyof typeof roleHomeMap },
}));

const mockPost = vi.fn();
vi.mock("@/lib/axios-instance", () => ({
	get api() {
		return { post: mockPost };
	},
}));

vi.mock("@/stores", () => ({
	useAuthStore: {
		getState: () => authState,
	},
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		to,
		children,
		...props
	}: {
		to: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={to} {...props}>
			{children}
		</a>
	),
	useNavigate: () => vi.fn(),
	useSearch: () => ({}),
	redirect: routerMocks.redirect,
	createFileRoute: () => (opts: Record<string, unknown>) => ({ options: opts }),
}));

import { ResetPasswordSection } from "@/components/auth/ResetPasswordSection";
import { Route as ResetPasswordRoute } from "@/routes/reset-password";

function setup(token?: string) {
	const user = userEvent.setup();
	const navigate = vi.fn();
	return {
		...renderWithProviders(
			<ResetPasswordSection
				token={token ?? ""}
				navigate={navigate}
			/>,
		),
		user,
		navigate,
	};
}

describe("ResetPasswordPage happy-path (US1)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
		localStorage.clear();
		authState.isAuthenticated = false;
		authState.user = null;
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("renders the form when token is present (RP-VT-003)", () => {
		setup("valid-reset-token");

		expect(
			screen.getByRole("form", { name: /set new password/i }),
		).toBeInTheDocument();
		expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
		expect(
			screen.getByLabelText(/confirm new password/i),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /reset password/i }),
		).toBeInTheDocument();
	});

	it("sends token and newPassword on valid submit (RP-VT-010)", async () => {
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(mockPost).toHaveBeenCalledWith("/auth/reset-password", {
				token: "valid-reset-token",
				newPassword: "newStrongPassword1",
			});
		});
	});

	it("disables submit button and shows pending state while submitting (RP-VT-011)", async () => {
		let resolvePromise: (value: unknown) => void;
		const deferred = new Promise((resolve) => {
			resolvePromise = resolve;
		});
		mockPost.mockReturnValueOnce(deferred);

		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			const buttons = screen.getAllByRole("button");
			const submitButton = buttons.find(
				(btn) => btn.getAttribute("type") === "submit",
			);
			expect(submitButton).toBeDisabled();
		});

		expect(screen.getByRole("form")).toHaveAttribute("aria-busy", "true");

		act(() => {
			resolvePromise!({ data: { message: "ok" } });
		});
	}, 10000);

	it("shows success message and status after successful reset (RP-VT-012, RP-VT-014)", async () => {
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("status")).toBeInTheDocument();
		});

		expect(screen.getByText(/password updated/i)).toBeInTheDocument();
	});

	it("auto-redirects to /login after 2 seconds on success (RP-VT-013)", async () => {
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		const { user, navigate } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("status")).toBeInTheDocument();
		});

		expect(navigate).not.toHaveBeenCalled();

		await waitFor(
			() => {
				expect(navigate).toHaveBeenCalledWith({
					to: "/login",
					replace: true,
				});
			},
			{ timeout: 3000 },
		);
	}, 5000);

	it("shows manual sign-in link in success state", async () => {
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("status")).toBeInTheDocument();
		});

		expect(
			screen.getByRole("link", { name: /sign in now/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /sign in now/i }),
		).toHaveAttribute("href", "/login");
	});
});

describe("ResetPasswordPage invalid-link (US2)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
		localStorage.clear();
	});

	it("shows invalid-link state immediately when no token query param (RP-VT-001)", () => {
		setup();

		expect(screen.getByRole("alert")).toBeInTheDocument();
		expect(
			screen.getByText(/link invalid or expired/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/request a new link/i),
		).toBeInTheDocument();
		expect(screen.queryByRole("form")).not.toBeInTheDocument();
	});

	it("does not make any validation API call when token is missing", () => {
		setup();

		expect(mockPost).not.toHaveBeenCalled();
	});

	it("transitions to invalid state after 400 token rejection on submit (RP-VT-004, RP-VT-005)", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 400 },
		});

		const { user } = setup("expired-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
			expect(
				screen.getByText(/link invalid or expired/i),
			).toBeInTheDocument();
		});

		expect(screen.queryByRole("form")).not.toBeInTheDocument();
	});

	it("transitions to invalid state after 404 token rejection on submit", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 404 },
		});

		const { user } = setup("expired-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});
	});

	it("transitions to invalid state after 410 token rejection", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 410 },
		});

		const { user } = setup("used-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});
	});

	it("does not reveal account existence in invalid-link state (RP-VT-018)", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 400, data: { error: "Token belongs to no account" } },
		});

		const { user } = setup("invalid-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});

		const alertText = screen.getByRole("alert").textContent ?? "";
		expect(alertText).not.toMatch(/not found|no account|does not exist/i);
	});

	it("request-new-link points to /forgot-password (RP-VT-023)", () => {
		setup();

		const link = screen.getByRole("link", { name: /request a new link/i });
		expect(link).toHaveAttribute("href", "/forgot-password");
	});

	it("invalid-link message is exposed as role=alert (RP-VT-023)", () => {
		setup();

		expect(screen.getByRole("alert")).toBeInTheDocument();
	});
});

describe("ResetPasswordPage validation and errors (US3)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
		localStorage.clear();
	});

	it("shows field error when submitting empty fields (RP-VT-006)", async () => {
		const { user } = setup("valid-reset-token");

		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			const allErrors = screen.getAllByText(/password is required/i);
			expect(allErrors.length).toBeGreaterThan(0);
		});

		expect(mockPost).not.toHaveBeenCalled();
	});

	it("shows too-short error for short password (RP-VT-007)", async () => {
		const { user } = setup("valid-reset-token");

		await user.type(screen.getByLabelText(/^new password$/i), "short");
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"short",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(
				screen.getByText(/password must be at least 8 characters/i),
			).toBeInTheDocument();
		});

		expect(mockPost).not.toHaveBeenCalled();
	});

	it("shows mismatch error for different confirmation (RP-VT-008)", async () => {
		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"StrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"differentPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(
				screen.getByText(/passwords do not match/i),
			).toBeInTheDocument();
		});

		expect(mockPost).not.toHaveBeenCalled();
	});

	it("toggle shows/hides newPassword field and preserves value (RP-VT-009)", async () => {
		const { user } = setup("valid-reset-token");

		const newPasswordInput = screen.getByLabelText(/^new password$/i);

		await user.type(newPasswordInput, "mySecret123");
		expect(newPasswordInput).toHaveAttribute("type", "password");
		expect(newPasswordInput).toHaveValue("mySecret123");

		const showButton = screen.getByRole("button", {
			name: /show new password/i,
		});
		await user.click(showButton);

		expect(newPasswordInput).toHaveAttribute("type", "text");
		expect(newPasswordInput).toHaveValue("mySecret123");

		const hideButton = screen.getByRole("button", {
			name: /hide new password/i,
		});
		expect(hideButton).toBeInTheDocument();
	});

	it("toggle shows/hides confirmPassword field independently (RP-VT-024)", async () => {
		const { user } = setup("valid-reset-token");

		const confirmInput = screen.getByLabelText(/confirm new password/i);

		await user.type(confirmInput, "mySecret123");
		expect(confirmInput).toHaveAttribute("type", "password");

		const showButton = screen.getByRole("button", {
			name: /show confirm password/i,
		});
		await user.click(showButton);

		expect(confirmInput).toHaveAttribute("type", "text");
	});

	it("newPassword toggle does not affect confirmPassword input", async () => {
		const { user } = setup("valid-reset-token");

		const newPasswordInput = screen.getByLabelText(/^new password$/i);
		const confirmInput = screen.getByLabelText(/confirm new password/i);

		const showNewPasswordBtn = screen.getByRole("button", {
			name: /show new password/i,
		});
		await user.click(showNewPasswordBtn);

		expect(newPasswordInput).toHaveAttribute("type", "text");
		expect(confirmInput).toHaveAttribute("type", "password");
	});

	it("shows inline error on 422 validation failure and keeps form (RP-VT-016)", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 422 },
		});

		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});

		expect(screen.getByRole("form")).toBeInTheDocument();
		const inputs = screen.getAllByDisplayValue("newStrongPassword1");
		expect(inputs.length).toBeGreaterThan(0);
	});

	it("shows inline error on network failure and keeps form (RP-VT-017)", async () => {
		mockPost.mockRejectedValueOnce(new Error("Network Error"));

		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});

		expect(screen.getByRole("form")).toBeInTheDocument();
	});

	it("clears inline API error when field changes", async () => {
		mockPost.mockRejectedValueOnce(new Error("Network Error"));

		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});

		await user.clear(screen.getByLabelText(/^new password$/i));
		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newPassword123",
		);

		await waitFor(() => {
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		});
	});

	it("disables all fields and toggles while pending (RP-VT-011)", async () => {
		let resolvePromise: (value: unknown) => void;
		const deferred = new Promise((resolve) => {
			resolvePromise = resolve;
		});
		mockPost.mockReturnValueOnce(deferred);

		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(
				screen.getByLabelText(/^new password$/i),
			).toBeDisabled();
			expect(
				screen.getByLabelText(/confirm new password/i),
			).toBeDisabled();
			const submitButton = screen.getByRole("button", { name: /\.\.\./ });
			expect(submitButton).toBeDisabled();
		});

		resolvePromise!({ data: { message: "ok" } });
	}, 10000);
});

describe("ResetPasswordPage localization and accessibility (US4)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
		localStorage.clear();
	});

	it("renders form using English keys by default (RP-VT-019)", () => {
		setup("valid-reset-token");

		expect(
			screen.getByText(/set new password/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/enter and confirm your new password below/i),
		).toBeInTheDocument();
		expect(
			screen.getByLabelText(/^new password$/i),
		).toBeInTheDocument();
		expect(
			screen.getByLabelText(/confirm new password/i),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /reset password/i }),
		).toBeInTheDocument();
	});

	it("renders invalid-link state with English copy", () => {
		setup();

		expect(
			screen.getByText(/link invalid or expired/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/this password reset link is invalid or has expired/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/request a new link/i),
		).toBeInTheDocument();
	});

	it("renders success state with English copy", async () => {
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("status")).toBeInTheDocument();
		});

		expect(
			screen.getByText(/password updated/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/your password has been updated/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/sign in now/i),
		).toBeInTheDocument();
	});

	it("form has logical layout classes for RTL support", () => {
		setup("valid-reset-token");

		const heading = screen.getByRole("heading", {
			name: /set new password/i,
		});
		expect(heading.parentElement?.className).toMatch(/text-center/);
	});

	it("success state uses role=status for accessibility", async () => {
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("status")).toBeInTheDocument();
		});
	});

	it("invalid state uses role=alert for accessibility", () => {
		setup();

		expect(screen.getByRole("alert")).toBeInTheDocument();
	});

	it("inline API error uses role=alert", async () => {
		mockPost.mockRejectedValueOnce(new Error("Network Error"));

		const { user } = setup("valid-reset-token");

		await user.type(
			screen.getByLabelText(/^new password$/i),
			"newStrongPassword1",
		);
		await user.type(
			screen.getByLabelText(/confirm new password/i),
			"newStrongPassword1",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);

		await waitFor(() => {
			expect(screen.getByRole("alert")).toBeInTheDocument();
		});
	});
});

describe("ResetPasswordRoute authenticated redirect", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		authState.isAuthenticated = true;
		authState.user = { role: "ADMIN" };
	});

	it("redirects authenticated users to their role home before rendering", () => {
		expect(() => ResetPasswordRoute.options.beforeLoad?.({} as never)).toThrow();

		expect(routerMocks.redirect).toHaveBeenCalledWith({
			to: roleHomeMap.ADMIN,
			replace: true,
		});
	});
});
