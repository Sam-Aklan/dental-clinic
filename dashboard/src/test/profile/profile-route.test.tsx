import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { renderWithProviders, createMockAuthContext, mockUser } from "@/test/common-components/test-utils";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () =>
    (options: Record<string, unknown>) => ({
      options,
    }),
  Link: ({ to, children, ...props }: Record<string, unknown>) => (
    <a href={String(to)} {...props}>{children as ReactNode}</a>
  ),
  useRouterState: vi.fn(() => ({ location: { pathname: "/profile" } })),
  useNavigate: vi.fn(() => vi.fn()),
  Outlet: () => <div data-testid="outlet">Outlet content</div>,
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
}));

vi.mock("@/components/profile/ProfilePage", () => ({
  ProfilePage: () => <div>Mock Profile Page</div>,
}));

import { Route } from "@/routes/_authenticated.profile";

const ProfileRoute = Route.options.component as ComponentType;

describe("Authenticated profile route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ["PATIENT", "Book Appointment"],
    ["DOCTOR", "My Queue"],
    ["RECEPTIONIST", "Queue"],
    ["ADMIN", "Dashboard"],
  ] as const)(
    "renders workspace navigation for %s users",
    (role, navLabel) => {
      renderWithProviders(<ProfileRoute />, {
        authValue: createMockAuthContext({ user: mockUser({ role }) }),
      });

      expect(
        screen.getByRole("navigation", { name: "Main navigation" }),
      ).toBeInTheDocument();
      expect(screen.getByText(navLabel)).toBeInTheDocument();
      expect(screen.getByText("Mock Profile Page")).toBeInTheDocument();
    },
  );
});
