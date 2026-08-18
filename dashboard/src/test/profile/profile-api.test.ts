import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
  mockPost: vi.fn(),
}));

vi.mock("@/lib/axios-instance", () => ({
  api: {
    get: mocks.mockGet,
    patch: mocks.mockPatch,
    post: mocks.mockPost,
  },
}));

import { getUserProfile } from "@/lib/profile/actions/profile.api";
import { mockProfile } from "./test-utils";

describe("profile api actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests the current user profile endpoint (API-001)", async () => {
    const profile = mockProfile();
    mocks.mockGet.mockResolvedValueOnce({ data: { data: profile } });

    const result = await getUserProfile();

    expect(mocks.mockGet).toHaveBeenCalledWith("/users/me");
    expect(result).toEqual(profile);
  });

  it("sends only editable fields on profile update (API-002)", async () => {
    const { updateProfile } = await import("@/lib/profile/actions/profile.api");

    const updated = mockProfile({ firstName: "Jane", lastName: "Smith", preferredLocale: "AR" });
    mocks.mockPatch.mockResolvedValueOnce({ data: { data: updated } });

    const payload = {
      firstName: "Jane",
      lastName: "Smith",
      preferredLocale: "AR" as const,
    };

    const result = await updateProfile(payload);

    expect(mocks.mockPatch).toHaveBeenCalledWith("/users/me", payload);
    expect(mocks.mockPatch).toHaveBeenCalledTimes(1);
    const callArgs = mocks.mockPatch.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs).not.toHaveProperty("email");
    expect(result).toEqual(updated);
  });

  it("sends currentPassword and newPassword only for password change (API-003)", async () => {
    const { changePassword } = await import("@/lib/profile/actions/profile.api");

    mocks.mockPost.mockResolvedValueOnce({ data: {} });

    await changePassword({ currentPassword: "OldPass123", newPassword: "NewPass456" });

    expect(mocks.mockPost).toHaveBeenCalledWith("/users/me/change-password", {
      currentPassword: "OldPass123",
      newPassword: "NewPass456",
    });
    const callArgs = mocks.mockPost.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs).not.toHaveProperty("confirmPassword");
  });

  it("exposes field-level errors for callers to map (API-004)", async () => {
    const { updateProfile } = await import("@/lib/profile/actions/profile.api");

    const fieldErrors = {
      firstName: "First name is invalid",
      lastName: "Last name is invalid",
    };
    mocks.mockPatch.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, data: { errors: fieldErrors } },
    });

    await expect(updateProfile({
      firstName: "",
      lastName: "",
      preferredLocale: "EN",
    })).rejects.toMatchObject({
      isAxiosError: true,
      response: { status: 400, data: { errors: fieldErrors } },
    });
  });
});
