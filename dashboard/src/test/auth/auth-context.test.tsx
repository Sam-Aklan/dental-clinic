import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18next from "@/i18n";
import { AuthProvider } from "@/contexts/auth";
import { useAuth } from "@/hooks/auth/use-auth";
import { useAuthStore } from "@/stores";
import {
	authUserAr,
	authUserEn,
	authUserWithoutLocale,
	deferredPromise,
	flushPromises,
	registerPayload,
} from "./test-utils";

const mocks = vi.hoisted(() => ({
	mockGetCurrentUser: vi.fn(),
	mockLoginUser: vi.fn(),
	mockRegisterUser: vi.fn(),
	mockLogoutUser: vi.fn(),
	mockRefreshAccessToken: vi.fn(),
	mockClearAccessToken: vi.fn(),
	mockGetAccessToken: vi.fn(),
}));

vi.mock("@/lib/auth/actions", () => ({
	getCurrentUser: mocks.mockGetCurrentUser,
	loginUser: mocks.mockLoginUser,
	registerUser: mocks.mockRegisterUser,
	logoutUser: mocks.mockLogoutUser,
	refreshAccessToken: mocks.mockRefreshAccessToken,
}));

vi.mock("@/lib/axios-instance", () => ({
	clearAccessToken: mocks.mockClearAccessToken,
	getAccessToken: mocks.mockGetAccessToken,
}));

function AuthConsumer() {
	const { user, isLoading, isAuthenticated, login, register, logout, refreshUser } = useAuth();

	return (
		<div>
			<div data-testid="user">{user?.email ?? "none"}</div>
			<div data-testid="loading">{String(isLoading)}</div>
			<div data-testid="authenticated">{String(isAuthenticated)}</div>
			<button type="button" onClick={() => void login("user@example.com", "Password123!").catch(() => {})}>login</button>
			<button type="button" onClick={() => void register(registerPayload).catch(() => {})}>register</button>
			<button type="button" onClick={() => logout()}>logout</button>
			<button type="button" onClick={() => void refreshUser().catch(() => {})}>refresh</button>
		</div>
	);
}

function renderAuth() {
	return render(
		<AuthProvider>
			<AuthConsumer />
		</AuthProvider>,
	);
}

describe("AuthProvider", () => {
	beforeEach(async () => {
		vi.clearAllMocks();
		mocks.mockGetAccessToken.mockReturnValue(null);
		mocks.mockRefreshAccessToken.mockResolvedValue({ accessToken: "token-123" });
		useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
		localStorage.clear();
		await i18next.changeLanguage("en");
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("shows pending loading state while current user is unresolved", () => {
		localStorage.setItem("auth_user", JSON.stringify(authUserEn));
		const pending = deferredPromise<typeof authUserEn>();
		mocks.mockRefreshAccessToken.mockResolvedValueOnce({ accessToken: "token-123" });
		mocks.mockGetCurrentUser.mockReturnValueOnce(pending.promise);

		renderAuth();

		expect(screen.getByTestId("loading")).toHaveTextContent("true");
		expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
	});

	it("restores a snapshot before reconciling with the server", async () => {
		localStorage.setItem("auth_user", JSON.stringify(authUserEn));
		const pending = deferredPromise<typeof authUserEn>();
		mocks.mockRefreshAccessToken.mockResolvedValueOnce({ accessToken: "token-123" });
		mocks.mockGetCurrentUser.mockReturnValueOnce(pending.promise);

		renderAuth();

		expect(screen.getByTestId("user")).toHaveTextContent(authUserEn.email);
		expect(screen.getByTestId("loading")).toHaveTextContent("true");
	});

	it("refreshes the access token before loading the current user from a stored session", async () => {
		localStorage.setItem("auth_user", JSON.stringify(authUserEn));
		mocks.mockRefreshAccessToken.mockResolvedValueOnce({ accessToken: "token-123" });
		mocks.mockGetCurrentUser.mockResolvedValueOnce(authUserEn);

		renderAuth();

		await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
		expect(mocks.mockRefreshAccessToken).toHaveBeenCalledTimes(1);
		expect(mocks.mockGetCurrentUser).toHaveBeenCalledTimes(1);
	});

	it("loads the current user from the server on startup", async () => {
		localStorage.setItem("auth_user", JSON.stringify(authUserEn));
		mocks.mockRefreshAccessToken.mockResolvedValueOnce({ accessToken: "token-123" });
		mocks.mockGetCurrentUser.mockResolvedValueOnce(authUserEn);

		renderAuth();

		await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
		expect(screen.getByTestId("user")).toHaveTextContent(authUserEn.email);
		expect(localStorage.getItem("auth_user")).toBe(JSON.stringify(authUserEn));
	});

	it("clears an unauthorized snapshot after startup reconciliation", async () => {
		localStorage.setItem("auth_user", JSON.stringify(authUserEn));
		mocks.mockRefreshAccessToken.mockResolvedValueOnce({ accessToken: "token-123" });
		mocks.mockGetCurrentUser.mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } });

		renderAuth();

		await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
		expect(screen.getByTestId("user")).toHaveTextContent("none");
		expect(localStorage.getItem("auth_user")).toBeNull();
	});

	it("clears a failed generic startup lookup", async () => {
		localStorage.setItem("auth_user", JSON.stringify(authUserEn));
		mocks.mockRefreshAccessToken.mockResolvedValueOnce({ accessToken: "token-123" });
		mocks.mockGetCurrentUser.mockRejectedValueOnce({ isAxiosError: true, response: { status: 500 } });

		renderAuth();

		await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));
		expect(screen.getByTestId("user")).toHaveTextContent("none");
		expect(localStorage.getItem("auth_user")).toBeNull();
	});

	it("logs in, updates storage, and syncs the locale", async () => {
		mocks.mockGetCurrentUser.mockResolvedValueOnce({ user: null });
		mocks.mockLoginUser.mockResolvedValueOnce({ accessToken: "token-123", user: authUserAr });

		renderAuth();
		await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

		fireEvent.click(screen.getByRole("button", { name: "login" }));

		await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(authUserAr.email));
		await waitFor(() => expect(document.documentElement.lang).toBe("ar"));
		expect(document.documentElement.dir).toBe("rtl");
		expect(localStorage.getItem("auth_user")).toBe(JSON.stringify(authUserAr));
	});

	it("registers a user and keeps the current locale when preferredLocale is missing", async () => {
		mocks.mockGetCurrentUser.mockResolvedValueOnce(null);
		mocks.mockRegisterUser.mockResolvedValueOnce({ accessToken: "token-456", user: authUserWithoutLocale });

		await i18next.changeLanguage("ar");
		renderAuth();
		await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

		fireEvent.click(screen.getByRole("button", { name: "register" }));

		await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(authUserWithoutLocale.email));
		expect(document.documentElement.lang).toBe("ar");
		expect(document.documentElement.dir).toBe("rtl");
	});

	it("leaves the unauthenticated state unchanged when login fails", async () => {
		mocks.mockGetCurrentUser.mockResolvedValueOnce(null);
		mocks.mockLoginUser.mockRejectedValueOnce({ isAxiosError: true, response: { status: 401 } });

		renderAuth();
		await waitFor(() => expect(screen.getByTestId("loading")).toHaveTextContent("false"));

		fireEvent.click(screen.getByRole("button", { name: "login" }));

		await flushPromises();
		expect(screen.getByTestId("user")).toHaveTextContent("none");
		expect(localStorage.getItem("auth_user")).toBeNull();
	});

	it("logs out even when the server rejects the logout request", async () => {
		localStorage.setItem("auth_user", JSON.stringify(authUserEn));
		mocks.mockRefreshAccessToken.mockResolvedValueOnce({ accessToken: "token-123" });
		mocks.mockGetCurrentUser.mockResolvedValueOnce(authUserEn);
		mocks.mockLogoutUser.mockRejectedValueOnce(new Error("server down"));

		renderAuth();
		await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(authUserEn.email));

		fireEvent.click(screen.getByRole("button", { name: "logout" }));

		await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("none"));
		expect(mocks.mockClearAccessToken).toHaveBeenCalled();
		expect(localStorage.getItem("auth_user")).toBeNull();
	});

	it("refreshes the current user on demand", async () => {
		localStorage.setItem("auth_user", JSON.stringify(authUserEn));
		mocks.mockRefreshAccessToken.mockResolvedValueOnce({ accessToken: "token-123" });
		mocks.mockGetCurrentUser.mockResolvedValueOnce(authUserEn);

		renderAuth();
		await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(authUserEn.email));
		mocks.mockGetCurrentUser.mockReset();
		mocks.mockGetCurrentUser.mockResolvedValueOnce(authUserAr);

		fireEvent.click(screen.getByRole("button", { name: "refresh" }));

		await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent(authUserAr.email));
		expect(localStorage.getItem("auth_user")).toBe(JSON.stringify(authUserAr));
	});
});
