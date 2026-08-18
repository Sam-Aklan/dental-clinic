import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, setupUser } from "./test-utils";

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

import { ChangePasswordForm } from "@/components/profile/ChangePasswordForm";

describe("ChangePasswordForm validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows current-password-required error on empty submit (CP-001)", async () => {
    renderWithProviders(<ChangePasswordForm />);
    const user = setupUser();

    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
    });
  });

  it("shows password-too-short error for less than 8 characters (CP-002)", async () => {
    renderWithProviders(<ChangePasswordForm />);
    const user = setupUser();

    await user.type(screen.getByLabelText(/^current password$/i), "OldPass");
    await user.type(screen.getByLabelText(/^new password$/i), "Abc12");
    await user.type(screen.getByLabelText(/^confirm new password$/i), "Abc12");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it("shows password-mismatch error on confirm mismatch (CP-003)", async () => {
    renderWithProviders(<ChangePasswordForm />);
    const user = setupUser();

    await user.type(screen.getByLabelText(/^current password$/i), "OldPass123");
    await user.type(screen.getByLabelText(/^new password$/i), "NewPass456");
    await user.type(screen.getByLabelText(/^confirm new password$/i), "Different1");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("shows new-password-same-as-current error (CP-004)", async () => {
    renderWithProviders(<ChangePasswordForm />);
    const user = setupUser();

    await user.type(screen.getByLabelText(/^current password$/i), "SamePass123");
    await user.type(screen.getByLabelText(/^new password$/i), "SamePass123");
    await user.type(screen.getByLabelText(/^confirm new password$/i), "SamePass123");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/new password must differ/i)).toBeInTheDocument();
    });
  });
});

describe("ChangePasswordForm submit and pending behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends password change request with current and new password (CP-005)", async () => {
    mocks.mockPost.mockResolvedValueOnce({ data: {} });
    renderWithProviders(<ChangePasswordForm />);
    const user = setupUser();

    await user.type(screen.getByLabelText(/^current password$/i), "OldPass123");
    await user.type(screen.getByLabelText(/^new password$/i), "NewPass456");
    await user.type(screen.getByLabelText(/^confirm new password$/i), "NewPass456");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(mocks.mockPost).toHaveBeenCalledWith("/users/me/change-password", {
        currentPassword: "OldPass123",
        newPassword: "NewPass456",
      });
    });
  });

  it("shows success confirmation and clears fields on success (CP-006)", async () => {
    mocks.mockPost.mockResolvedValueOnce({ data: {} });
    renderWithProviders(<ChangePasswordForm />);
    const user = setupUser();

    await user.type(screen.getByLabelText(/^current password$/i), "OldPass123");
    await user.type(screen.getByLabelText(/^new password$/i), "NewPass456");
    await user.type(screen.getByLabelText(/^confirm new password$/i), "NewPass456");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(mocks.mockPost).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByLabelText(/^current password$/i)).toHaveValue("");
      expect(screen.getByLabelText(/^new password$/i)).toHaveValue("");
      expect(screen.getByLabelText(/^confirm new password$/i)).toHaveValue("");
    });
  });

  it("shows incorrect-password error on 400 and does not clear form (CP-007)", async () => {
    mocks.mockPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, data: { message: "current_password_incorrect" } },
    });
    renderWithProviders(<ChangePasswordForm />);
    const user = setupUser();

    await user.type(screen.getByLabelText(/^current password$/i), "WrongPass");
    await user.type(screen.getByLabelText(/^new password$/i), "NewPass456");
    await user.type(screen.getByLabelText(/^confirm new password$/i), "NewPass456");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText(/incorrect current password/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^current password$/i)).toHaveValue("WrongPass");
  });

  it("shows field error on 400 password validation error (CP-008)", async () => {
    mocks.mockPost.mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 400, data: { errors: { newPassword: "Too common" } } },
    });
    renderWithProviders(<ChangePasswordForm />);
    const user = setupUser();

    await user.type(screen.getByLabelText(/^current password$/i), "OldPass123");
    await user.type(screen.getByLabelText(/^new password$/i), "Common1234");
    await user.type(screen.getByLabelText(/^confirm new password$/i), "Common1234");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByText("Too common")).toBeInTheDocument();
    });
  });

  it("disables fields and submit while pending (CP-009)", async () => {
    let resolvePost: (v: unknown) => void;
    const deferred = new Promise((resolve) => {
      resolvePost = resolve;
    });
    mocks.mockPost.mockReturnValueOnce(deferred);

    renderWithProviders(<ChangePasswordForm />);
    const user = setupUser();

    await user.type(screen.getByLabelText(/^current password$/i), "OldPass123");
    await user.type(screen.getByLabelText(/^new password$/i), "NewPass456");
    await user.type(screen.getByLabelText(/^confirm new password$/i), "NewPass456");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /update password/i })).toBeDisabled();
      expect(screen.getByLabelText(/^current password$/i)).toBeDisabled();
      expect(screen.getByLabelText(/^new password$/i)).toBeDisabled();
      expect(screen.getByLabelText(/^confirm new password$/i)).toBeDisabled();
    });

    resolvePost!({ data: {} });
  }, 10000);
});

describe("ChangePasswordForm visibility controls", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("toggles password field visibility without changing value (CP-010)", async () => {
    renderWithProviders(<ChangePasswordForm />);
    const user = setupUser();

    const currentInput = screen.getByLabelText(/^current password$/i);
    await user.type(currentInput, "MySecret");

    expect(currentInput).toHaveAttribute("type", "password");

    const showButton = screen.getByRole("button", { name: /show current password/i });
    await user.click(showButton);

    expect(screen.getByLabelText(/^current password$/i)).toHaveAttribute("type", "text");
    expect(screen.getByLabelText(/^current password$/i)).toHaveValue("MySecret");
  });

  it("updates accessible label on toggle state change (CP-011)", async () => {
    renderWithProviders(<ChangePasswordForm />);
    const user = setupUser();

    const showButton = screen.getByRole("button", { name: /show current password/i });
    expect(showButton).toBeInTheDocument();

    await user.click(showButton);

    expect(screen.getByRole("button", { name: /hide current password/i })).toBeInTheDocument();
  });
});
