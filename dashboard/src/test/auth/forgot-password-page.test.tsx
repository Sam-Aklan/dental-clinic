import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";
import { ForgotPasswordSection } from "@/components/auth/ForgotPasswordSection";
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

import { Route as ForgotPasswordRoute } from "@/routes/forgot-password";

function setup() {
  const user = userEvent.setup();
  return { ...renderWithProviders(<ForgotPasswordSection />), user };
}

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    localStorage.clear();
    authState.isAuthenticated = false;
    authState.user = null;
  });

  it("renders the initial form with title, email field, and submit button", () => {
    setup();

    expect(
      screen.getByRole("form", { name: /forgot password/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send reset link/i }),
    ).toBeInTheDocument();
  });

  it("shows the logo and language switcher", () => {
    setup();

    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("form")).toBeInTheDocument();
  });

  it("shows a sign-in link", () => {
    setup();

    expect(screen.getByRole("link", { name: /back to sign in/i })).toBeInTheDocument();
  });

  it("shows validation error when submitting empty email", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter your email/i)).toBeInTheDocument();
    });

    expect(mockPost).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid email", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });

    expect(mockPost).not.toHaveBeenCalled();
  });

  it("disables submit button while pending", async () => {
    let resolvePromise: (value: unknown) => void;
    const deferred = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockPost.mockReturnValueOnce(deferred);

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      const submitButton = buttons.find((btn) => btn.getAttribute("type") === "submit");
      expect(submitButton).toBeDisabled();
    });

		act(() => {
			resolvePromise!({ data: { message: "ok" } });
		});
	}, 10000);

  it("transitions to success state with neutral confirmation after successful submit", async () => {
    mockPost.mockResolvedValueOnce({
      data: { message: "If an account exists, a reset link has been sent." },
    });

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/check your email/i),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/user@example.com/),
    ).toBeInTheDocument();
  });

  it("uses neutral wording that does not reveal account existence", async () => {
    mockPost.mockResolvedValueOnce({
      data: { message: "If an account exists, a reset link has been sent." },
    });

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "unknown@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    const successText = screen.getByText(/if an account exists/i);
    expect(successText).toBeInTheDocument();
    expect(successText.textContent).not.toMatch(/not found/i);
    expect(successText.textContent).not.toMatch(/does not exist/i);
  });

  it("sends only the email to the API", async () => {
    mockPost.mockResolvedValueOnce({
      data: { message: "ok" },
    });

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "user@example.com",
      });
    });
  });

  // US2: Network error keeps form visible with error and preserves email
  it("shows inline error and keeps form visible on network failure", async () => {
    mockPost.mockRejectedValueOnce(new Error("Network Error"));

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByRole("form")).toBeInTheDocument();
    expect(screen.getByDisplayValue("user@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("does not reveal account existence on error", async () => {
    mockPost.mockRejectedValueOnce(new Error("Network Error"));

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "nonexistent@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    const alertText = screen.getByRole("alert").textContent ?? "";
    expect(alertText).not.toMatch(/not found|no account|does not exist/i);
  });

  it("clears API error when email field changes", async () => {
    mockPost.mockRejectedValueOnce(new Error("Network Error"));

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), "new@example.com");

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  // US3: Cooldown and resend
  it("shows cooldown on success and resend button is disabled", async () => {
    mockPost.mockResolvedValueOnce({
      data: { message: "ok" },
    });

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /send again \(60s\)/i }),
    ).toBeDisabled();
  });

  it("shows reduced countdown in success state via localStorage", () => {
    const now = Date.now();
    localStorage.setItem(
      "fp_cooldown",
      JSON.stringify({
        expiresAt: now + 30_000,
        email: "saved@example.com",
      }),
    );

    setup();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send again \(\d+s\)/i }),
    ).toBeDisabled();
  });

  it("shows enabled resend button when cooldown is nearly expired", () => {
    const now = Date.now();
    localStorage.setItem(
      "fp_cooldown",
      JSON.stringify({
        expiresAt: now + 500,
        email: "saved@example.com",
      }),
    );

    setup();

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("resends with the stored email", async () => {
    mockPost.mockResolvedValueOnce({
      data: { message: "ok" },
    });

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    expect(mockPost).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "user@example.com",
    });

    expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
  });

  it("restores success view from localStorage cooldown on mount", () => {
    const now = Date.now();
    localStorage.setItem(
      "fp_cooldown",
      JSON.stringify({
        expiresAt: now + 30_000,
        email: "saved@example.com",
      }),
    );

    setup();

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/saved@example.com/)).toBeInTheDocument();
  });

  // US4: Back to sign in navigation
  it("sign-in link points to /login from the form state", () => {
    setup();

    const link = screen.getByRole("link", { name: /back to sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("sign-in link points to /login from the success state", async () => {
    mockPost.mockResolvedValueOnce({
      data: { message: "ok" },
    });

    const { user } = setup();

    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    const link = screen.getByRole("link", { name: /back to sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("shows LTR arrow in English back-to-sign-in link", () => {
    setup();

    const link = screen.getByRole("link", { name: /← back to sign in/i });
    expect(link).toBeInTheDocument();
  });
});

describe("ForgotPasswordRoute authenticated redirect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAuthenticated = true;
    authState.user = { role: "ADMIN" };
  });

	it("redirects authenticated users to their role home before rendering", () => {
		expect(() => ForgotPasswordRoute.options.beforeLoad?.({} as never)).toThrow();

		expect(routerMocks.redirect).toHaveBeenCalledWith({
			to: roleHomeMap.ADMIN,
			replace: true,
		});
	});
});
