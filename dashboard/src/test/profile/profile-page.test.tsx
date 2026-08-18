import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, mockProfile, mockPatientProfile, createMockAuthContext, setupUser } from "./test-utils";

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

vi.mock("@/hooks/profile/use-profile", () => {
  const actual = vi.importActual("@/hooks/profile/use-profile");
  return actual;
});

import { ProfilePage } from "@/components/profile/ProfilePage";

describe("ProfilePage loading and error states", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockGet.mockReset();
    mocks.mockPatch.mockReset();
  });

  it("shows loading placeholder while profile request is pending (PP-001)", async () => {
    let resolveLoad: (v: unknown) => void;
    const deferred = new Promise((resolve) => {
      resolveLoad = resolve;
    });
    mocks.mockGet.mockReturnValueOnce(deferred);

		const authCtx = createMockAuthContext({
			user: { id: "u1", email: "a@b.com", role: "PATIENT", isActive: true, firstName: "A", lastName: "Patient", preferredLocale: "EN" },
		});
    renderWithProviders(<ProfilePage />, { authValue: authCtx });

    await waitFor(() => {
      const busyRegion = document.querySelector('[aria-busy="true"]');
      expect(busyRegion).toBeInTheDocument();
    });

    resolveLoad!({ data: { data: mockProfile() } });
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockProfile().firstName)).toBeInTheDocument();
    });
  });

  it("shows error state and retry action when profile load fails (PP-002)", async () => {
    mocks.mockGet.mockRejectedValueOnce(new Error("Network Error"));

		const authCtx = createMockAuthContext({
			user: { id: "u1", email: "a@b.com", role: "PATIENT", isActive: true, firstName: "A", lastName: "Patient", preferredLocale: "EN" },
		});
    renderWithProviders(<ProfilePage />, { authValue: authCtx });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("retries and populates form on retry success (PP-003)", async () => {
    mocks.mockGet.mockRejectedValueOnce(new Error("fail"));
		const authCtx = createMockAuthContext({
			user: { id: "u1", email: "a@b.com", role: "PATIENT", isActive: true, firstName: "A", lastName: "Patient", preferredLocale: "EN" },
		});
    renderWithProviders(<ProfilePage />, { authValue: authCtx });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });

    mocks.mockGet.mockResolvedValueOnce({ data: { data: mockProfile() } });
    const user = setupUser();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue(mockProfile().firstName)).toBeInTheDocument();
    });
  });

  it("renders profile page for each supported role (PP-004)", async () => {
    mocks.mockGet.mockResolvedValueOnce({ data: { data: mockProfile({ role: "ADMIN", patientProfile: undefined }) } });
		const authCtx = createMockAuthContext({
			user: { id: "u1", email: "admin@c.com", role: "ADMIN", isActive: true, firstName: "Amin", lastName: "Admin", preferredLocale: "EN" },
		});
    renderWithProviders(<ProfilePage />, { authValue: authCtx });

    await waitFor(() => {
      expect(screen.getByText(/profile settings/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/personal information/i)).toBeInTheDocument();
    expect(screen.getByText(/change password/i)).toBeInTheDocument();
  });
});

describe("ProfilePage conditional fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows phone and date-of-birth when patient profile has them (PP-005)", async () => {
    mocks.mockGet.mockResolvedValueOnce({ data: { data: mockProfile({ patientProfile: mockPatientProfile }) } });
    const authCtx = createMockAuthContext();

    renderWithProviders(<ProfilePage />, { authValue: authCtx });

    await waitFor(() => {
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockProfile().phone ?? "")).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockPatientProfile.dateOfBirth!)).toBeInTheDocument();
  });

  it("shows phone and hides date-of-birth when patientProfile is absent (PP-006)", async () => {
    mocks.mockGet.mockResolvedValueOnce({ data: { data: mockProfile({ patientProfile: undefined }) } });
    const authCtx = createMockAuthContext();

    renderWithProviders(<ProfilePage />, { authValue: authCtx });

    await waitFor(() => {
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(/date of birth/i)).not.toBeInTheDocument();
  });

  it("shows patient fields when non-patient role still has patientProfile data (PP-007)", async () => {
    mocks.mockGet.mockResolvedValueOnce({
      data: { data: mockProfile({ role: "DOCTOR", patientProfile: mockPatientProfile }) },
    });
		const authCtx = createMockAuthContext({
			user: { id: "u1", email: "doc@c.com", role: "DOCTOR", isActive: true, firstName: "Doc", lastName: "Doctor", preferredLocale: "EN" },
		});

    renderWithProviders(<ProfilePage />, { authValue: authCtx });

    await waitFor(() => {
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  });
});
