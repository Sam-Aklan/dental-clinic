import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, mockProfile, mockPatientProfile, setupUser, createMockAuthContext } from "./test-utils";

const mocks = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPatch: vi.fn(),
}));

vi.mock("@/lib/axios-instance", () => ({
  api: {
    get: mocks.mockGet,
    patch: mocks.mockPatch,
  },
}));

import { ProfileForm } from "@/components/profile/ProfileForm";

const authCtx = createMockAuthContext();

describe("ProfileForm field rendering and validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders first name, last name, email, and preferred language with current values (PF-001)", () => {
    const profile = mockProfile();
    renderWithProviders(<ProfileForm profile={profile} />, { authValue: authCtx });

    expect(screen.getByDisplayValue(profile.firstName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(profile.lastName)).toBeInTheDocument();
    expect(screen.getByDisplayValue(profile.phone ?? "")).toBeInTheDocument();
    expect(screen.getByText(profile.email)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /preferred language/i })).toHaveValue(profile.preferredLocale);
  });

  it("shows email as read-only, not an editable field (PF-002)", () => {
    const profile = mockProfile();
    renderWithProviders(<ProfileForm profile={profile} />, { authValue: authCtx });

    const emailText = screen.getByText(profile.email);
    expect(emailText.tagName).toBe("P");
    expect(screen.queryByRole("textbox", { name: /email/i })).not.toBeInTheDocument();
  });

  it("shows first name required error on empty submit (PF-003)", async () => {
    const profile = mockProfile({ firstName: "", lastName: "Smith" });
    renderWithProviders(<ProfileForm profile={profile} />, { authValue: authCtx });
    const user = setupUser();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    });
    expect(mocks.mockPatch).not.toHaveBeenCalled();
  });

  it("shows last name required error on empty submit (PF-004)", async () => {
    const profile = mockProfile({ firstName: "John", lastName: "" });
    renderWithProviders(<ProfileForm profile={profile} />, { authValue: authCtx });
    const user = setupUser();

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    });
    expect(mocks.mockPatch).not.toHaveBeenCalled();
  });

  it("shows invalid phone error on bad phone number (PF-005)", async () => {
    const profile = mockProfile({ patientProfile: mockPatientProfile });
    renderWithProviders(<ProfileForm profile={profile} />, { authValue: authCtx });
    const user = setupUser();

    const phoneInput = screen.getByLabelText(/phone number/i);
    await user.clear(phoneInput);
    await user.type(phoneInput, "abc");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid phone number/i)).toBeInTheDocument();
    });
    expect(mocks.mockPatch).not.toHaveBeenCalled();
  });

  it("shows invalid date-of-birth error on future date (PF-006)", async () => {
    const profile = mockProfile({ patientProfile: mockPatientProfile });
    renderWithProviders(<ProfileForm profile={profile} />, { authValue: authCtx });
    const user = setupUser();

    const dobInput = screen.getByLabelText(/date of birth/i);
    await user.clear(dobInput);
    await user.type(dobInput, "3000-01-01");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(screen.getByText(/valid past date/i)).toBeInTheDocument();
    });
    expect(mocks.mockPatch).not.toHaveBeenCalled();
  });
});

describe("ProfileForm save behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends update request with editable fields only (PF-007)", async () => {
    mocks.mockPatch.mockResolvedValueOnce({ data: { data: mockProfile({ firstName: "Jane", lastName: "Smith", preferredLocale: "AR" }) } });
    const profile = mockProfile();
    renderWithProviders(<ProfileForm profile={profile} />, { authValue: authCtx });
    const user = setupUser();

    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Jane");

    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mocks.mockPatch).toHaveBeenCalledTimes(1);
    });
    const callArgs = mocks.mockPatch.mock.calls[0][1] as Record<string, unknown>;
    expect(callArgs).not.toHaveProperty("email");
    expect(callArgs).toHaveProperty("firstName", "Jane");
    expect(callArgs).toHaveProperty("phone", profile.phone);
  });

  it("shows success confirmation after profile update succeeds (PF-008)", async () => {
    mocks.mockPatch.mockResolvedValueOnce({ data: { data: mockProfile({ firstName: "Jane" }) } });
    const profile = mockProfile();
    renderWithProviders(<ProfileForm profile={profile} />, { authValue: authCtx });
    const user = setupUser();

    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Jane");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mocks.mockPatch).toHaveBeenCalledTimes(1);
    });
    const button = screen.getByRole("button", { name: /save changes/i });
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it("preserves entered values and shows general error on network failure (PF-011)", async () => {
    mocks.mockPatch.mockRejectedValueOnce(new Error("Network Error"));
    const profile = mockProfile();
    renderWithProviders(<ProfileForm profile={profile} />, { authValue: authCtx });
    const user = setupUser();

    const firstNameInput = screen.getByLabelText(/first name/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, "Jane");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mocks.mockPatch).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByDisplayValue("Jane")).toBeInTheDocument();
  });
});
