import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { WorkspaceShell } from "@/components/shared/workspace-shell/WorkspaceShell";
import { PublicShell } from "@/components/shared/public-shell";
import { renderWithProviders, createMockAuthContext, mockUser } from "@/test/common-components/test-utils";
import { PATIENT_NAV_ITEMS, DOCTOR_NAV_ITEMS, RECEPTIONIST_NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/constants/nav-items";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...props }: Record<string, unknown>) => (
    <a href={String(to)} {...props}>{children as React.ReactNode}</a>
  ),
  useRouterState: vi.fn(() => ({ location: { pathname: "/book" } })),
  useNavigate: vi.fn(() => vi.fn()),
  Outlet: () => <div data-testid="outlet">Outlet content</div>,
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}));

function renderShell(navItems = PATIENT_NAV_ITEMS, homeRoute = "/book") {
  return renderWithProviders(
    <WorkspaceShell navItems={navItems} homeRoute={homeRoute} />,
    {
      authValue: createMockAuthContext({ user: mockUser({ role: "PATIENT" }) }),
    }
  );
}

describe("WorkspaceShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders skip-to-content link", () => {
    renderShell();
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute("href", "#main-content");
  });

  it("renders nav landmark with accessible label", () => {
    renderShell();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
  });

  it("renders main landmark with correct id", () => {
    renderShell();
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
  });

  it("renders child route outlet", () => {
    renderShell();
    expect(screen.getByTestId("outlet")).toBeInTheDocument();
  });

  it("shows patient nav items for patient role", () => {
    renderShell(PATIENT_NAV_ITEMS);
    expect(screen.getByText("Book Appointment")).toBeInTheDocument();
    expect(screen.getByText("My Appointments")).toBeInTheDocument();
    expect(screen.getByText("Waitlist")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("shows doctor nav items for doctor role", () => {
    renderShell(DOCTOR_NAV_ITEMS, "/doctor/queue");
    expect(screen.getByText("My Queue")).toBeInTheDocument();
    expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
  });

  it("shows receptionist nav items for receptionist role", () => {
    renderShell(RECEPTIONIST_NAV_ITEMS, "/staff/queue");
    expect(screen.getByText("Queue")).toBeInTheDocument();
    expect(screen.getByText("Walk-In Booking")).toBeInTheDocument();
  });

  it("shows admin nav items for admin role", () => {
    renderShell(ADMIN_NAV_ITEMS, "/admin/dashboard");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Clinic Settings")).toBeInTheDocument();
    expect(screen.getByText("Audit Log")).toBeInTheDocument();
  });

  it("renders language switcher in header", () => {
    renderShell();
    expect(screen.getByText("AR")).toBeInTheDocument();
  });
});

describe("Public vs Authenticated shell separation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("public shell renders without authenticated navigation", () => {
    renderWithProviders(
      <PublicShell>
        <p>Public page</p>
      </PublicShell>
    );
    expect(screen.getByText("Public page")).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("authenticated shell renders with navigation", () => {
    renderShell(PATIENT_NAV_ITEMS);
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
  });

  it("public shell does not render user menu", () => {
    renderWithProviders(
      <PublicShell>
        <p>Public page</p>
      </PublicShell>
    );
    expect(screen.queryByText("View Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Sign Out")).not.toBeInTheDocument();
  });

  it("public shell works signed-out without stale user data", () => {
    renderWithProviders(
      <PublicShell>
        <p>Welcome guest</p>
      </PublicShell>
    );
    expect(screen.getByText("Welcome guest")).toBeInTheDocument();
  });
});
