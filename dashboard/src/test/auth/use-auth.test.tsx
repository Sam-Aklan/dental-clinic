import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider } from "@/contexts/auth";
import { useAuth } from "@/hooks/auth/use-auth";
import { useAuthStore } from "@/stores";

const mocks = vi.hoisted(() => ({
	mockGetCurrentUser: vi.fn(),
}));
vi.mock("@/lib/auth/actions", () => ({
	getCurrentUser: mocks.mockGetCurrentUser,
	loginUser: vi.fn(),
	registerUser: vi.fn(),
	logoutUser: vi.fn(),
}));

function Consumer() {
	const { user, isLoading, isAuthenticated, login, register, logout, refreshUser } = useAuth();
	return (
		<div>
			<div>{String(Boolean(user))}</div>
			<div>{String(isLoading)}</div>
			<div>{String(isAuthenticated)}</div>
			<div>{String(typeof login)}</div>
			<div>{String(typeof register)}</div>
			<div>{String(typeof logout)}</div>
			<div>{String(typeof refreshUser)}</div>
		</div>
	);
}

describe("useAuth", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
		mocks.mockGetCurrentUser.mockResolvedValue(null);
	});

	it("returns the auth context inside the provider", async () => {
		render(
			<AuthProvider>
				<Consumer />
			</AuthProvider>,
		);

		expect(screen.getByText("true")).toBeInTheDocument();
		expect(screen.getAllByText("function")).toHaveLength(4);
	});

	it("throws outside the provider", () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		expect(() => render(<Consumer />)).toThrow("useAuth must be used within AuthProvider");
		errorSpy.mockRestore();
	});
});
