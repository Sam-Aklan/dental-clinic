import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Role, User } from "@/types";
import { ROUTE_FORBIDDEN, ROUTE_LOGIN } from "@/constants/routes";
import { ProtectedRouteGuard } from "@/components/shared/protected-route-guard";

type AuthState = {
	isLoading: boolean;
	isAuthenticated: boolean;
	user: User | null;
};

const mockAuth = vi.hoisted(() => {
	let state: AuthState = { isLoading: true, isAuthenticated: false, user: null };

	return {
		setAuthState(overrides: Partial<AuthState>) {
			state = { ...state, ...overrides };
		},
		useAuth() {
			return state;
		},
	};
});

const navigateCalls = vi.hoisted(() => [] as Array<{ to: string; search?: Record<string, string>; replace?: boolean }>);

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

	return {
		...actual,
		Navigate: vi.fn((props: { to: string; search?: Record<string, string>; replace?: boolean }) => {
			navigateCalls.push({ to: props.to, search: props.search, replace: props.replace });
			return null;
		}),
	};
});

vi.mock("@/hooks/auth", () => ({
	useAuth: () => mockAuth.useAuth(),
}));

function renderGuard({
	allowedRoles,
	children,
}: {
	allowedRoles?: Role[];
	children?: ReactNode;
} = {}) {
	return render(
		<ProtectedRouteGuard allowedRoles={allowedRoles}>
			{children ?? <div>Protected content</div>}
		</ProtectedRouteGuard>,
	);
}

function createTestUser(role: Role): User {
	return {
		id: `test-${role.toLowerCase()}`,
		email: `${role.toLowerCase()}@example.com`,
		role,
		isActive: true,
		firstName: role,
		lastName: "User",
		preferredLocale: "EN",
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	navigateCalls.length = 0;
});

describe("ProtectedRouteGuard - Loading State", () => {
	beforeEach(() => {
		mockAuth.setAuthState({
			isLoading: true,
			isAuthenticated: false,
			user: null,
		});
	});

	it("PR-T001: renders full-page loading indicator when auth is loading", () => {
		renderGuard();

		expect(screen.getByRole("status")).toBeInTheDocument();
	});

	it("PR-T002: does not render protected children when auth is loading", () => {
		renderGuard();

		expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
	});

	it("PR-T003: does not redirect to login or access-denied when auth is loading", () => {
		renderGuard();

		expect(navigateCalls).toHaveLength(0);
	});
});

describe("ProtectedRouteGuard - Signed-Out Redirect", () => {
	beforeEach(() => {
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: false,
			user: null,
		});
		window.history.pushState({}, "", "/doctor/queue?tab=today");
	});

	it("PR-T004: redirects to login with encoded redirect param when signed out", () => {
		renderGuard();

		expect(navigateCalls).toHaveLength(1);
		expect(navigateCalls[0].to).toBe(ROUTE_LOGIN);
		expect(navigateCalls[0].search).toEqual({
			redirect: encodeURIComponent("/doctor/queue?tab=today"),
		});
		expect(navigateCalls[0].replace).toBe(true);
	});

	it("PR-T005: does not render protected children when signed out and redirecting", () => {
		renderGuard();

		expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
	});

	it("PR-T006: redirects to login without mounting protected content", () => {
		renderGuard();

		expect(navigateCalls[0].to).toBe(ROUTE_LOGIN);
		expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
	});
});

describe("ProtectedRouteGuard - Authenticated Access Without Role Restrictions", () => {
	it("PR-T007: renders protected children for an authenticated patient with no role restriction", () => {
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: createTestUser("PATIENT"),
		});

		renderGuard();

		expect(screen.getByText("Protected content")).toBeInTheDocument();
		expect(navigateCalls).toHaveLength(0);
	});

	it("PR-T008: renders protected children for an authenticated administrator with no role restriction", () => {
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: createTestUser("ADMIN"),
		});

		renderGuard();

		expect(screen.getByText("Protected content")).toBeInTheDocument();
		expect(navigateCalls).toHaveLength(0);
	});
});

describe("ProtectedRouteGuard - Role-Restricted Access", () => {
	it("PR-T009: renders protected children when authenticated admin matches allowed [ADMIN]", () => {
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: createTestUser("ADMIN"),
		});

		renderGuard({ allowedRoles: ["ADMIN"] });

		expect(screen.getByText("Protected content")).toBeInTheDocument();
	});

	it("PR-T010: renders protected children for receptionist when allowed roles are [ADMIN, RECEPTIONIST]", () => {
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: createTestUser("RECEPTIONIST"),
		});

		renderGuard({ allowedRoles: ["ADMIN", "RECEPTIONIST"] });

		expect(screen.getByText("Protected content")).toBeInTheDocument();
	});

	it("Doctor role: renders protected children when allowed roles include DOCTOR", () => {
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: createTestUser("DOCTOR"),
		});

		renderGuard({ allowedRoles: ["DOCTOR"] });

		expect(screen.getByText("Protected content")).toBeInTheDocument();
	});

	it("PR-T013: blocks /admin/settings/doctors for non-admin users", () => {
		window.history.pushState({}, "", "/admin/settings/doctors");
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: createTestUser("PATIENT"),
		});

		renderGuard({ allowedRoles: ["ADMIN"] });

		expect(navigateCalls).toHaveLength(1);
		expect(navigateCalls[0].to).toBe(ROUTE_FORBIDDEN);
	});

	it("PR-T014: blocks /doctor/queue and /doctor/today for non-doctors", () => {
		window.history.pushState({}, "", "/doctor/today");
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: createTestUser("PATIENT"),
		});

		renderGuard({ allowedRoles: ["DOCTOR"] });

		expect(navigateCalls).toHaveLength(1);
		expect(navigateCalls[0].to).toBe(ROUTE_FORBIDDEN);
	});

	it.each([
		["/admin/dashboard", ["ADMIN"]],
		["/staff/queue", ["ADMIN", "RECEPTIONIST"]],
		["/doctor/today", ["DOCTOR"]],
	])("blocks patient access to %s", (pathname, allowedRoles) => {
		window.history.pushState({}, "", pathname);
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: createTestUser("PATIENT"),
		});

		renderGuard({ allowedRoles: allowedRoles as Role[] });

		expect(navigateCalls).toHaveLength(1);
		expect(navigateCalls[0].to).toBe(ROUTE_FORBIDDEN);
	});

	it("PR-T011: redirects to /access-denied when patient tries admin-only route", () => {
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: createTestUser("PATIENT"),
		});

		renderGuard({ allowedRoles: ["ADMIN"] });

		expect(navigateCalls).toHaveLength(1);
		expect(navigateCalls[0].to).toBe(ROUTE_FORBIDDEN);
		expect(navigateCalls[0].replace).toBe(true);
		expect(screen.queryByText("Protected content")).not.toBeInTheDocument();
	});

	it("PR-T012: redirects to /access-denied when user has no confirmed role on a role-restricted route", () => {
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: { ...createTestUser("PATIENT"), role: undefined as unknown as Role },
		});

		renderGuard({ allowedRoles: ["ADMIN"] });

		expect(navigateCalls).toHaveLength(1);
		expect(navigateCalls[0].to).toBe(ROUTE_FORBIDDEN);
	});
});
