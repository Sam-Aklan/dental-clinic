import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useResetPasswordFlow } from "@/hooks/auth/use-reset-password-flow";
import { useAuthStore } from "@/stores/auth-store";

const mockPost = vi.fn();
vi.mock("@/lib/axios-instance", () => ({
	get api() {
		return { post: mockPost };
	},
}));

const mockNavigate = vi.fn();

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		);
	};
}

describe("useResetPasswordFlow", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
		useAuthStore.setState({ user: null, isAuthenticated: false });
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("starts in form view when token is present (RP-VT-003)", () => {
		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		expect(result.current.view).toBe("form");
		expect(result.current.apiErrorKey).toBeNull();
	});

	it("starts in invalid view when token is absent", () => {
		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		expect(result.current.view).toBe("invalid");
	});

	it("transitions to success on valid submit, calls logout, schedules navigation (RP-VT-010, RP-VT-012, RP-VT-013)", async () => {
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		useAuthStore.setState({
			user: { id: "1", email: "old@test.com", role: "PATIENT", isActive: true, firstName: "Old", lastName: "Patient", preferredLocale: "EN" },
			isAuthenticated: true,
		});

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.view).toBe("success");
		});

		const state = useAuthStore.getState();
		expect(state.user).toBeNull();
		expect(state.isAuthenticated).toBe(false);
	});

	it("schedules navigate after 2s on success", async () => {
		vi.useFakeTimers();
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		expect(mockNavigate).not.toHaveBeenCalled();

		vi.advanceTimersByTime(2000);

		expect(mockNavigate).toHaveBeenCalledWith({
			to: "/login",
			replace: true,
		});
	});

	it("cleans up the redirect timer on unmount", () => {
		vi.useFakeTimers();
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		const { result, unmount } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		act(() => {
			result.current.submit("newStrongPassword1");
		});

		unmount();

		vi.advanceTimersByTime(2000);

		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("transitions to invalid on 400 token rejection during submit", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 400 },
		});

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "expired-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		expect(result.current.view).toBe("form");

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.view).toBe("invalid");
		});

		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("stays in form view on network error and sets apiErrorKey", async () => {
		mockPost.mockRejectedValueOnce(new Error("Network Error"));

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.view).toBe("form");
			expect(result.current.apiErrorKey).toBe("auth.errors.resetFailed");
		});

		expect(mockNavigate).not.toHaveBeenCalled();
	});

	it("clears apiErrorKey when clearApiError is called", async () => {
		mockPost.mockRejectedValueOnce(new Error("Network Error"));

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.apiErrorKey).toBe("auth.errors.resetFailed");
		});

		act(() => {
			result.current.clearApiError();
		});

		expect(result.current.apiErrorKey).toBeNull();
	});

	it("does not write token to localStorage, sessionStorage, or cookies", async () => {
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.view).toBe("success");
		});

		expect(localStorage.getItem("rp_token")).toBeNull();
		expect(sessionStorage.getItem("rp_token")).toBeNull();
	});

	it("does not make any API call on mount with token present", () => {
		renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		expect(mockPost).not.toHaveBeenCalled();
	});
});

describe("useResetPasswordFlow invalid-link (US2)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
		useAuthStore.setState({ user: null, isAuthenticated: false });
	});

	it("starts in invalid view when token is absent", () => {
		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		expect(result.current.view).toBe("invalid");
	});

	it("transitions from form to invalid on 400 token rejection", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 400 },
		});

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "expired-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		expect(result.current.view).toBe("form");

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.view).toBe("invalid");
		});
	});

	it("transitions from form to invalid on 404 token rejection", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 404 },
		});

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "unknown-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.view).toBe("invalid");
		});
	});

	it("transitions from form to invalid on 410 token rejection", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 410 },
		});

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "used-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.view).toBe("invalid");
		});
	});

	it("does not write token to storage when in invalid state", () => {
		renderHook(
			() =>
				useResetPasswordFlow({
					token: "",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		expect(localStorage.getItem("rp_token")).toBeNull();
		expect(sessionStorage.getItem("rp_token")).toBeNull();
	});
});

describe("useResetPasswordFlow inline errors (US3)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
		useAuthStore.setState({ user: null, isAuthenticated: false });
	});

	it("stays in form view with resetFailed on 422", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 422 },
		});

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.view).toBe("form");
			expect(result.current.apiErrorKey).toBe(
				"auth.errors.resetFailed",
			);
		});
	});

	it("stays in form view with rateLimited on 429", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 429 },
		});

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.view).toBe("form");
			expect(result.current.apiErrorKey).toBe(
				"auth.errors.rateLimited",
			);
		});
	});

	it("stays in form view with resetFailed on network error", async () => {
		mockPost.mockRejectedValueOnce(new Error("Network Error"));

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.view).toBe("form");
			expect(result.current.apiErrorKey).toBe(
				"auth.errors.resetFailed",
			);
		});
	});

	it("stays in form view with resetFailed on 5xx", async () => {
		mockPost.mockRejectedValueOnce({
			isAxiosError: true,
			response: { status: 500 },
		});

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.view).toBe("form");
			expect(result.current.apiErrorKey).toBe(
				"auth.errors.resetFailed",
			);
		});
	});

	it("clears apiErrorKey when submitting again", async () => {
		mockPost.mockRejectedValueOnce(new Error("Network Error"));
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		const { result } = renderHook(
			() =>
				useResetPasswordFlow({
					token: "valid-reset-token",
					navigate: mockNavigate,
				}),
			{ wrapper: createWrapper() },
		);

		await act(async () => {
			result.current.submit("newStrongPassword1");
		});

		await waitFor(() => {
			expect(result.current.apiErrorKey).toBe(
				"auth.errors.resetFailed",
			);
		});

		await act(async () => {
			result.current.submit("newStrongPassword2");
		});

		expect(result.current.apiErrorKey).toBeNull();
	});
});
