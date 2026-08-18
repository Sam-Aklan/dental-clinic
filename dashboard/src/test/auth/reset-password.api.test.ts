import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetPassword } from "@/lib/auth/actions/auth.api";
import type { ResetPasswordRequest } from "@/types";

const mockPost = vi.fn();
vi.mock("@/lib/axios-instance", () => ({
	get api() {
		return { post: mockPost };
	},
}));

describe("resetPassword API action", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("posts token and newPassword to /auth/reset-password", async () => {
		const payload: ResetPasswordRequest = {
			token: "valid-reset-token",
			newPassword: "newStrongPassword1",
		};
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		await resetPassword(payload);

		expect(mockPost).toHaveBeenCalledTimes(1);
		expect(mockPost).toHaveBeenCalledWith("/auth/reset-password", {
			token: "valid-reset-token",
			newPassword: "newStrongPassword1",
		});
	});

	it("resolves with the response data on 2xx success", async () => {
		mockPost.mockResolvedValueOnce({
			data: { message: "Password reset successful." },
		});

		const result = await resetPassword({
			token: "valid-reset-token",
			newPassword: "newStrongPassword1",
		});

		expect(result).toEqual({ message: "Password reset successful." });
	});

	it("rejects on non-2xx response", async () => {
		mockPost.mockRejectedValueOnce(new Error("Request failed"));

		await expect(
			resetPassword({
				token: "expired-token",
				newPassword: "newStrongPassword1",
			}),
		).rejects.toThrow("Request failed");
	});

	it("rejects on network failure", async () => {
		const networkError = new Error("Network Error");
		(networkError as { code?: string }).code = "ECONNREFUSED";
		mockPost.mockRejectedValueOnce(networkError);

		await expect(
			resetPassword({
				token: "valid-reset-token",
				newPassword: "newStrongPassword1",
			}),
		).rejects.toThrow("Network Error");
	});

	it("does not modify the token or password in the payload", async () => {
		mockPost.mockResolvedValueOnce({
			data: { message: "ok" },
		});

		await resetPassword({
			token: "  token-with-spaces  ",
			newPassword: "newStrongPassword1",
		});

		expect(mockPost).toHaveBeenCalledWith("/auth/reset-password", {
			token: "  token-with-spaces  ",
			newPassword: "newStrongPassword1",
		});
	});
});
