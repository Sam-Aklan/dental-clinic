import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { WorkspaceHeader } from "@/components/shared/workspace-shell/WorkspaceHeader";
import { UserMenu } from "@/components/shared/workspace-shell/UserMenu";
import { renderWithProviders, mockUser, createMockAuthContext } from "@/test/common-components/test-utils";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: Record<string, unknown>) => (
    <a href={String(to)} {...props}>{children as React.ReactNode}</a>
  ),
  useRouterState: vi.fn(() => ({ location: { pathname: "/book" } })),
  useNavigate: vi.fn(() => vi.fn()),
  Outlet: () => null,
}));

const mockAuthValue = createMockAuthContext({ user: mockUser({ firstName: "Amina", lastName: "Saleh" }) });

describe("WorkspaceHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title and subtitle", () => {
    renderWithProviders(
      <WorkspaceHeader
        title="Dashboard"
        subtitle="Welcome back"
        mobileOpen={false}
        onMobileToggle={vi.fn()}
      />,
      { authValue: mockAuthValue }
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Welcome back")).toBeInTheDocument();
  });

  it("renders mobile menu button with accessible label", () => {
    renderWithProviders(
      <WorkspaceHeader
        mobileOpen={false}
        onMobileToggle={vi.fn()}
      />,
      { authValue: mockAuthValue }
    );
    const button = screen.getByRole("button", { name: /open menu/i });
    expect(button).toBeInTheDocument();
  });

  it("sets aria-expanded on mobile menu button", () => {
    renderWithProviders(
      <WorkspaceHeader
        mobileOpen={true}
        onMobileToggle={vi.fn()}
      />,
      { authValue: mockAuthValue }
    );
    const button = screen.getByRole("button", { name: /close menu/i });
    expect(button).toHaveAttribute("aria-expanded", "true");
  });

  it("sets aria-controls on mobile menu button", () => {
    renderWithProviders(
      <WorkspaceHeader
        mobileOpen={false}
        onMobileToggle={vi.fn()}
      />,
      { authValue: mockAuthValue }
    );
    const button = screen.getByRole("button", { name: /open menu/i });
    expect(button).toHaveAttribute("aria-controls", "workspace-sidebar");
  });

  it("renders language switcher", () => {
    renderWithProviders(
      <WorkspaceHeader
        mobileOpen={false}
        onMobileToggle={vi.fn()}
      />,
      { authValue: mockAuthValue }
    );
    expect(screen.getByText("AR")).toBeInTheDocument();
  });
});

describe("UserMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows user display name", () => {
    const user = mockUser({ firstName: "Amina", lastName: "Saleh" });
    renderWithProviders(<UserMenu />, {
      authValue: createMockAuthContext({ user }),
    });
    expect(screen.getByText("Amina Saleh")).toBeInTheDocument();
  });

  it("shows email fallback when no name", () => {
    const user = mockUser({ firstName: undefined, lastName: undefined, email: "test@example.com" });
    renderWithProviders(<UserMenu />, {
      authValue: createMockAuthContext({ user }),
    });
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows loading placeholder when isLoading", () => {
    renderWithProviders(<UserMenu />, {
      authValue: createMockAuthContext({ isLoading: true }),
    });
    const trigger = screen.getByRole("button");
    expect(trigger).toBeInTheDocument();
  });
});
