import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { WorkspaceSidebar } from "@/components/shared/workspace-shell/WorkspaceSidebar";
import { renderWithProviders } from "@/test/common-components/test-utils";
import { PATIENT_NAV_ITEMS, DOCTOR_NAV_ITEMS, RECEPTIONIST_NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/constants/nav-items";
import type { NavItem } from "@/types";

const { useRouterState } = vi.hoisted(() => ({
  useRouterState: vi.fn(() => ({ location: { pathname: "/book" } })),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, onClick, ...props }: Record<string, unknown>) => (
    <a href={String(to)} onClick={onClick as () => void} {...props}>
      {children as React.ReactNode}
    </a>
  ),
  useRouterState,
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}));

function renderSidebar(navItems: NavItem[] = PATIENT_NAV_ITEMS) {
  return renderWithProviders(
    <WorkspaceSidebar
      navItems={navItems}
      mobileOpen={false}
      onMobileClose={vi.fn()}
    />
  );
}

describe("WorkspaceSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders patient nav labels", () => {
    renderSidebar(PATIENT_NAV_ITEMS);
    expect(screen.getByText("Book Appointment")).toBeInTheDocument();
    expect(screen.getByText("My Appointments")).toBeInTheDocument();
    expect(screen.getByText("Waitlist")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("renders doctor nav labels", () => {
    renderSidebar(DOCTOR_NAV_ITEMS);
    expect(screen.getByText("My Queue")).toBeInTheDocument();
    expect(screen.getByText("Today's Schedule")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("renders receptionist nav labels", () => {
    renderSidebar(RECEPTIONIST_NAV_ITEMS);
    expect(screen.getByText("Queue")).toBeInTheDocument();
    expect(screen.getByText("Appointments")).toBeInTheDocument();
    expect(screen.getByText("Patients")).toBeInTheDocument();
    expect(screen.getByText("Walk-In Booking")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("renders admin nav labels", () => {
    renderSidebar(ADMIN_NAV_ITEMS);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Clinic Settings")).toBeInTheDocument();
    expect(screen.getByText("Doctors")).toBeInTheDocument();
    expect(screen.getByText("Users")).toBeInTheDocument();
    expect(screen.getByText("Audit Log")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });

  it("sets aria-current page on active exact match", () => {
    const exactItem: NavItem = { key: "nav.bookAppointment", to: "/book", icon: () => null, exact: true };
    renderSidebar([exactItem]);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("activates link via prefix match by default", () => {
    useRouterState.mockReturnValue({ location: { pathname: "/book" } });
    renderSidebar([{ key: "nav.bookAppointment", to: "/book", icon: () => null }]);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("does not set aria-current on inactive link", () => {
    useRouterState.mockReturnValue({ location: { pathname: "/waitlist" } });
    renderSidebar([
      { key: "nav.bookAppointment", to: "/book", icon: () => null, exact: true },
      { key: "nav.waitlist", to: "/waitlist", icon: () => null },
    ]);
    const links = screen.getAllByRole("link");
    const bookLink = links.find((l) => l.getAttribute("href") === "/book");
    expect(bookLink).not.toHaveAttribute("aria-current");
  });

  it("has nav landmark with accessible label", () => {
    renderSidebar();
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(nav).toHaveAttribute("id", "workspace-sidebar");
  });
});
