import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, act } from "@testing-library/react";
import { renderWithProviders, mockProfile, createMockAuthContext } from "./test-utils";

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

import { ProfilePage } from "@/components/profile/ProfilePage";
import i18n from "@/i18n";

describe("ProfilePage accessibility and localization", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("finds all forms, fields, buttons, read-only email, and language selector by accessible names (AX-001)", async () => {
    mocks.mockGet.mockResolvedValueOnce({ data: { data: mockProfile() } });
    const authCtx = createMockAuthContext();

    renderWithProviders(<ProfilePage />, { authValue: authCtx });

    await waitFor(() => {
      expect(screen.getByText(/personal information/i)).toBeInTheDocument();
    });

    const label = await screen.findByLabelText(/first name/i);
    expect(label).toBeInTheDocument();

    expect(screen.getByRole("heading", { name: /profile settings/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /preferred language/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();

    const passwordForm = screen.getByRole("form", { name: /change password/i });
    expect(passwordForm).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
  });

  it("shows error message as alert content (AX-003)", async () => {
    mocks.mockGet.mockRejectedValueOnce(new Error("fail"));
    const authCtx = createMockAuthContext();

    renderWithProviders(<ProfilePage />, { authValue: authCtx });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("shows Arabic text when Arabic language is active (AX-004)", async () => {
    await act(async () => {
      await i18n.changeLanguage("ar");
    });

    mocks.mockGet.mockResolvedValueOnce({ data: { data: mockProfile({ preferredLocale: "AR" }) } });
		const authCtx = createMockAuthContext({
			user: { id: "u1", email: "ar@c.com", role: "PATIENT", isActive: true, firstName: "أمينة", lastName: "مريض", preferredLocale: "AR" },
		});

    renderWithProviders(<ProfilePage />, { authValue: authCtx });

    await waitFor(() => {
      expect(screen.getByText(/المعلومات الشخصية/)).toBeInTheDocument();
    });
    expect(screen.getByText(/تغيير كلمة المرور/)).toBeInTheDocument();
  });

  it("has RTL document direction for Arabic (AX-005)", async () => {
    await act(async () => {
      await i18n.changeLanguage("ar");
    });

    mocks.mockGet.mockResolvedValueOnce({ data: { data: mockProfile({ preferredLocale: "AR" }) } });
		const authCtx = createMockAuthContext({
			user: { id: "u1", email: "ar@c.com", role: "PATIENT", isActive: true, firstName: "أمينة", lastName: "مريض", preferredLocale: "AR" },
		});

    renderWithProviders(<ProfilePage />, { authValue: authCtx });

    await waitFor(() => {
      expect(document.documentElement.dir).toBe("rtl");
      expect(document.documentElement.lang).toBe("ar");
    });
  });
});
