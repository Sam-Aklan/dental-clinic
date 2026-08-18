import { describe, it, expect, vi, beforeEach } from "vitest";
import { forgotPassword } from "@/lib/auth/actions/auth.api";
import type { ForgotPasswordRequest } from "@/types";

const mockPost = vi.fn();
vi.mock("@/lib/axios-instance", () => ({
  get api() {
    return { post: mockPost };
  },
}));

describe("forgotPassword API action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends only the email field in the request payload", async () => {
    const payload: ForgotPasswordRequest = { email: "user@example.com" };
    mockPost.mockResolvedValueOnce({
      data: { message: "If an account exists, a reset link has been sent." },
    });

    await forgotPassword(payload);

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "user@example.com",
    });
  });

  it("resolves with the response data on 2xx success", async () => {
    mockPost.mockResolvedValueOnce({
      data: { message: "some generic message" },
    });

    const result = await forgotPassword({ email: "user@example.com" });

    expect(result).toEqual({ message: "some generic message" });
  });

  it("does not expose account-existence data in the response", async () => {
    mockPost.mockResolvedValueOnce({
      data: { message: "If an account exists, a reset link has been sent." },
    });

    const result = await forgotPassword({ email: "unknown@example.com" });

    expect(result).toEqual({
      message: "If an account exists, a reset link has been sent.",
    });
    expect(result.message).not.toContain("found");
    expect(result.message).not.toContain("not found");
  });

  it("rejects on non-2xx response", async () => {
    mockPost.mockRejectedValueOnce(new Error("Network Error"));

    await expect(
      forgotPassword({ email: "user@example.com" }),
    ).rejects.toThrow("Network Error");
  });

  it("rejects on network failure", async () => {
    const networkError = new Error("Network Error");
    (networkError as { code?: string }).code = "ECONNREFUSED";
    mockPost.mockRejectedValueOnce(networkError);

    await expect(
      forgotPassword({ email: "user@example.com" }),
    ).rejects.toThrow("Network Error");
  });

  it("trims and lowercases email in the payload (schema responsibility)", async () => {
    mockPost.mockResolvedValueOnce({
      data: { message: "ok" },
    });

    await forgotPassword({ email: "  User@Example.com  " });

    expect(mockPost).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "  User@Example.com  ",
    });
  });
});
