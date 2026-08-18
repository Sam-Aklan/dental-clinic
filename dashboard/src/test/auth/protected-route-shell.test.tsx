import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { Role, User } from "@/types";
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

vi.mock("@tanstack/react-router", async () => {
	const actual = await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");

	return {
		...actual,
		Navigate: vi.fn(() => null),
		useRouter: vi.fn(() => ({
			state: { location: { pathname: "/book" } },
		})),
	};
});

vi.mock("@/hooks/auth", () => ({
	useAuth: () => mockAuth.useAuth(),
}));

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

function renderShell({
	allowedRoles,
	children,
}: {
	allowedRoles?: Role[];
	children?: ReactNode;
} = {}) {
	return render(
		<ProtectedRouteGuard allowedRoles={allowedRoles}>
			<div data-testid="shell">
				<div data-testid="sidebar">Sidebar</div>
				<div data-testid="page-content">
					{children ?? <div>Page content</div>}
				</div>
			</div>
		</ProtectedRouteGuard>,
	);
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe("ProtectedRouteGuard - Shell Mounting", () => {
	it("PR-T013: does not mount the layout shell when auth is loading", () => {
		mockAuth.setAuthState({
			isLoading: true,
			isAuthenticated: false,
			user: null,
		});

		renderShell();

		expect(screen.queryByTestId("shell")).not.toBeInTheDocument();
		expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
	});

	it("PR-T014: does not mount the layout shell when user is signed out", () => {
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: false,
			user: null,
		});

		renderShell();

		expect(screen.queryByTestId("shell")).not.toBeInTheDocument();
		expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
	});

	it("PR-T015: does not mount the layout shell when user has a disallowed role", () => {
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: createTestUser("PATIENT"),
		});

		renderShell({ allowedRoles: ["ADMIN"] });

		expect(screen.queryByTestId("shell")).not.toBeInTheDocument();
		expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
	});

	it("PR-T016: mounts the layout shell and page content when user has an allowed role", () => {
		mockAuth.setAuthState({
			isLoading: false,
			isAuthenticated: true,
			user: createTestUser("PATIENT"),
		});

		renderShell({ allowedRoles: ["PATIENT"] });

		expect(screen.getByTestId("shell")).toBeInTheDocument();
		expect(screen.getByTestId("sidebar")).toBeInTheDocument();
		expect(screen.getByTestId("page-content")).toBeInTheDocument();
		expect(screen.getByText("Page content")).toBeInTheDocument();
	});
});
