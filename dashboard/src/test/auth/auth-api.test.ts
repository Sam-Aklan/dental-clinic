import { beforeEach, describe, expect, it, vi } from "vitest";
import { authUserEn, registerPayload } from "./test-utils";

const mocks = vi.hoisted(() => ({
	mockGet: vi.fn(),
	mockPost: vi.fn(),
	mockSetAccessToken: vi.fn(),
}));

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: mocks.mockGet,
		post: mocks.mockPost,
	},
	setAccessToken: mocks.mockSetAccessToken,
}));

import {
	forgotPassword,
	getCurrentUser,
	loginUser,
	logoutUser,
	refreshAccessToken,
	registerUser,
	resetPassword,
} from "@/lib/auth/actions";

describe("auth api actions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns the current-user payload from GET /auth/me", async () => {
		mocks.mockGet.mockResolvedValueOnce({ data: { data: authUserEn } });

		await expect(getCurrentUser()).resolves.toEqual(authUserEn);
		expect(mocks.mockGet).toHaveBeenCalledWith("/auth/me");
	});

	it("logs in with email and password and stores the token", async () => {
		mocks.mockPost.mockResolvedValueOnce({
			data: { data: { accessToken: "token-123", user: authUserEn } },
		});

		await expect(loginUser("user@example.com", "Password123!")).resolves.toEqual({
			accessToken: "token-123",
			user: authUserEn,
		});
		expect(mocks.mockPost).toHaveBeenCalledWith("/auth/login", {
			email: "user@example.com",
			password: "Password123!",
		});
		expect(mocks.mockSetAccessToken).toHaveBeenCalledWith("token-123");
	});

	it("registers a user and stores the token", async () => {
		mocks.mockPost.mockResolvedValueOnce({
			data: { data: { accessToken: "token-456", user: authUserEn } },
		});

		await expect(registerUser(registerPayload)).resolves.toEqual({
			accessToken: "token-456",
			user: authUserEn,
		});
		expect(mocks.mockPost).toHaveBeenCalledWith("/auth/register", registerPayload);
		expect(mocks.mockSetAccessToken).toHaveBeenCalledWith("token-456");
	});

	it("logs out without returning data", async () => {
		mocks.mockPost.mockResolvedValueOnce({ data: {} });

		await expect(logoutUser()).resolves.toBeUndefined();
		expect(mocks.mockPost).toHaveBeenCalledWith("/auth/logout");
	});

	it("refreshes the access token and stores it", async () => {
		mocks.mockPost.mockResolvedValueOnce({
			data: { data: { accessToken: "token-789" } },
		});

		await expect(refreshAccessToken()).resolves.toEqual({ accessToken: "token-789" });
		expect(mocks.mockPost).toHaveBeenCalledWith("/auth/refresh");
		expect(mocks.mockSetAccessToken).toHaveBeenCalledWith("token-789");
	});

	it("supports string and object forgot-password payloads", async () => {
		mocks.mockPost.mockResolvedValueOnce({ data: { message: "ok" } });
		mocks.mockPost.mockResolvedValueOnce({ data: { message: "ok-2" } });

		await expect(forgotPassword("user@example.com")).resolves.toEqual({ message: "ok" });
		await expect(forgotPassword({ email: "second@example.com" })).resolves.toEqual({ message: "ok-2" });
		expect(mocks.mockPost).toHaveBeenNthCalledWith(1, "/auth/forgot-password", { email: "user@example.com" });
		expect(mocks.mockPost).toHaveBeenNthCalledWith(2, "/auth/forgot-password", { email: "second@example.com" });
	});

	it("supports tuple and object reset-password payloads", async () => {
		mocks.mockPost.mockResolvedValueOnce({ data: { message: "ok" } });
		mocks.mockPost.mockResolvedValueOnce({ data: { message: "ok-2" } });

		await expect(resetPassword(["token-123", "NewPassword123!"])).resolves.toEqual({ message: "ok" });
		await expect(resetPassword({ token: "token-456", newPassword: "NewPassword456!" })).resolves.toEqual({ message: "ok-2" });
		expect(mocks.mockPost).toHaveBeenNthCalledWith(1, "/auth/reset-password", {
			token: "token-123",
			newPassword: "NewPassword123!",
		});
		expect(mocks.mockPost).toHaveBeenNthCalledWith(2, "/auth/reset-password", {
			token: "token-456",
			newPassword: "NewPassword456!",
		});
	});
});
