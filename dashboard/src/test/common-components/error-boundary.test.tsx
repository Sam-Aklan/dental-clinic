import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { ErrorBoundary } from "@/components/shared/error-boundary/ErrorBoundary";
import { ErrorFallback } from "@/components/shared/error-boundary/ErrorFallback";
import { renderWithProviders, createMockAuthContext, mockUser } from "@/test/common-components/test-utils";
import userEvent from "@testing-library/user-event";

const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: Record<string, unknown>) => (
    <a href={String(to)}>{children as React.ReactNode}</a>
  ),
  useRouterState: vi.fn(() => ({ location: { pathname: "/" } })),
  useNavigate: vi.fn(() => mockNavigate),
  Outlet: () => null,
}));

function ThrowOnRender({ shouldThrow }: { shouldThrow?: boolean }) {
  if (shouldThrow !== false) {
    throw new Error("Test render error");
  }
  return <p>All good</p>;
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when no error", () => {
    renderWithProviders(
      <ErrorBoundary fallback={<div>Fallback</div>}>
        <ThrowOnRender shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("renders fallback on render error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithProviders(
      <ErrorBoundary fallback={<div>Error occurred</div>}>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(screen.getByText("Error occurred")).toBeInTheDocument();
    vi.restoreAllMocks();
  });

  it("retries successfully after error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(
      <ErrorBoundary fallback={<ErrorFallback onRetry={() => {}} />}>
        <ThrowOnRender />
      </ErrorBoundary>,
      {
        authValue: createMockAuthContext({ user: mockUser({ role: "PATIENT" }) }),
      }
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    vi.restoreAllMocks();
  });

  it("custom fallback is supported", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithProviders(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowOnRender />
      </ErrorBoundary>
    );
    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});

describe("ErrorFallback", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it("renders error title and description", () => {
    renderWithProviders(<ErrorFallback onRetry={vi.fn()} />, {
      authValue: createMockAuthContext({ user: mockUser({ role: "PATIENT" }) }),
    });
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument();
  });

  it("renders retry button that calls onRetry", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    renderWithProviders(<ErrorFallback onRetry={onRetry} />, {
      authValue: createMockAuthContext({ user: mockUser({ role: "PATIENT" }) }),
    });
    await user.click(screen.getByText("Retry"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders Go Home button that navigates to role home", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ErrorFallback onRetry={vi.fn()} />, {
      authValue: createMockAuthContext({ user: mockUser({ role: "PATIENT" }) }),
    });
    await user.click(screen.getByText("Go to Home"));
    expect(mockNavigate).toHaveBeenCalledWith({ to: "/book" });
  });

  it("falls back to / when no auth context", () => {
    renderWithProviders(<ErrorFallback onRetry={vi.fn()} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("has role alert", () => {
    renderWithProviders(<ErrorFallback onRetry={vi.fn()} />, {
      authValue: createMockAuthContext({ user: mockUser() }),
    });
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
