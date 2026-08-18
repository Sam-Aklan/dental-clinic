import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { User } from "@/types";
import { AccessDeniedSection } from "@/components/shared/access-denied-section";

const mockAuth = vi.hoisted(() => {
	let state = {
		isLoading: false,
		isAuthenticated: true,
		user: { id: "1", email: "patient@example.com", role: "PATIENT", isActive: true } as User,
	};

	return {
		setAuthState(overrides: Partial<typeof state>) {
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
		Link: (({ to, children }: { to: string; children: React.ReactNode }) => (
			<a href={to}>{children}</a>
		)) as never,
		useRouter: vi.fn(() => ({
			state: { location: { pathname: "/access-denied" } },
		})),
	};
});

vi.mock("@/hooks/auth", () => ({
	useAuth: () => mockAuth.useAuth(),
}));

beforeEach(() => {
	vi.clearAllMocks();
});

describe("AccessDeniedPage", () => {
	it("renders the access denied heading", () => {
		render(<AccessDeniedSection />);

		expect(screen.getByRole("heading", { name: /access denied/i })).toBeInTheDocument();
	});

	it("renders the access denied description", () => {
		render(<AccessDeniedSection />);

		expect(screen.getByText(/you do not have permission/i)).toBeInTheDocument();
	});

	it("renders a home link", () => {
		render(<AccessDeniedSection />);

		expect(screen.getByRole("link", { name: /go to home/i })).toBeInTheDocument();
	});
});
