import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { PatientsPage } from "@/components/patients";
import { renderPatientsPage } from "./test-utils";
import {
  buildPaginatedResponse,
  patientSearchFixtures,
  patientDetailFixtures,
  historyFixtures,
  buildPatientHistoryAppointmentDTO,
} from "./fixtures";
import type { PatientPageUrlState, PatientHistoryAppointmentDTO, StaffPatientSearchDTO } from "@/types";

vi.mock("@/hooks/patients", () => ({
  usePatientSearchQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
  usePatientDetailQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
  usePatientHistoryQuery: vi.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
}));

vi.mock("@/hooks/shared", () => ({
  useDebounce: vi.fn((value: string) => value),
}));

import { usePatientSearchQuery, usePatientDetailQuery, usePatientHistoryQuery } from "@/hooks/patients";

function createDefaultSearch(overrides: Partial<PatientPageUrlState> = {}): PatientPageUrlState {
  return { q: "", status: [], page: 1, ...overrides };
}

function renderPage(search: PatientPageUrlState = createDefaultSearch()) {
  const mockUpdateSearch = vi.fn();
  const mockResetSearch = vi.fn();

  const result = renderPatientsPage(
    <PatientsPage
      search={search}
      onUpdateSearch={mockUpdateSearch}
      onResetSearch={mockResetSearch}
    />
  );

  return { ...result, mockUpdateSearch, mockResetSearch };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Patients Page specifications", () => {
  describe("PP-T001: allowed roles access patients workspace", () => {
    it("renders the patients workspace shell", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage();
      expect(screen.getByText("Patients")).toBeInTheDocument();
    });

    it("renders search input for finding patients", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage();
      expect(screen.getByPlaceholderText("Search by name, phone, or email")).toBeInTheDocument();
    });
  });

  describe("PP-T002: initial search guidance and no premature search", () => {
    it("shows guidance message before any search", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage();
      expect(screen.getByText("Find a Patient")).toBeInTheDocument();
      expect(screen.getByText(/Type at least two characters/)).toBeInTheDocument();
    });
  });

  describe("PP-T003: search by name, phone, or email", () => {
    it("renders search results with patient identifiers", async () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: buildPaginatedResponse([patientSearchFixtures.singleResult], { total: 1 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage(createDefaultSearch({ q: "Sara" }));

      await waitFor(() => {
        expect(screen.getByText("Sara Ali")).toBeInTheDocument();
      });
    });

    it("renders result count when results are present", async () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: buildPaginatedResponse([patientSearchFixtures.singleResult], { total: 1 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage(createDefaultSearch({ q: "Sara" }));

      await waitFor(() => {
        expect(screen.getByText(/1 patient/)).toBeInTheDocument();
      });
    });

    it("displays patient email and phone in results", async () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: buildPaginatedResponse([patientSearchFixtures.singleResult], { total: 1 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage(createDefaultSearch({ q: "Sara" }));

      await waitFor(() => {
        expect(screen.getByText("sara@example.com")).toBeInTheDocument();
      });
    });
  });

  describe("PP-T004: reset search and filter state", () => {
    it("shows a reset button when search has been performed", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: buildPaginatedResponse([patientSearchFixtures.singleResult], { total: 1 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage(createDefaultSearch({ q: "Sara" }));
      expect(screen.getByLabelText("Reset search")).toBeInTheDocument();
    });

    it("returns to guidance state when q is empty", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage();
      expect(screen.getByText("Find a Patient")).toBeInTheDocument();
    });
  });

  describe("PP-T005: select patient and persist selected state", () => {
    it("shows detail panel when patient is selected", async () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: buildPaginatedResponse([patientSearchFixtures.singleResult], { total: 1 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      const mockDetailQuery = vi.mocked(usePatientDetailQuery);
      mockDetailQuery.mockReturnValue({
        data: patientDetailFixtures.missingFields,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientDetailQuery>);

      const mockHistoryQuery = vi.mocked(usePatientHistoryQuery);
      mockHistoryQuery.mockReturnValue({
        data: buildPaginatedResponse<PatientHistoryAppointmentDTO>([], { total: 0 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientHistoryQuery>);

      renderPage(createDefaultSearch({ patientId: "patient-1" }));

      await waitFor(() => {
        expect(screen.getAllByText(/Not provided/).length).toBeGreaterThan(0);
      });
    });

    it("renders appointment summary in detail panel", async () => {
      const mockDetailQuery = vi.mocked(usePatientDetailQuery);
      mockDetailQuery.mockReturnValue({
        data: patientDetailFixtures.default,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientDetailQuery>);

      const mockHistoryQuery = vi.mocked(usePatientHistoryQuery);
      mockHistoryQuery.mockReturnValue({
        data: buildPaginatedResponse(historyFixtures.multiple, { total: 2 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientHistoryQuery>);

      renderPage(createDefaultSearch({ patientId: "patient-1" }));

      await waitFor(() => {
        expect(screen.getByText(/Last visit/)).toBeInTheDocument();
      });
    });

    it("renders past and upcoming appointment counts", async () => {
      const mockDetailQuery = vi.mocked(usePatientDetailQuery);
      mockDetailQuery.mockReturnValue({
        data: patientDetailFixtures.default,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientDetailQuery>);

      const mockHistoryQuery = vi.mocked(usePatientHistoryQuery);
      mockHistoryQuery.mockImplementation((filters) => {
        if (filters.pageSize === 100) {
          return {
            data: buildPaginatedResponse([
              buildPatientHistoryAppointmentDTO({
                id: "appt-past-1",
                status: "COMPLETED",
                startsAt: "2025-01-01T10:00:00Z",
                endsAt: "2025-01-01T10:30:00Z",
              }),
              buildPatientHistoryAppointmentDTO({
                id: "appt-upcoming-1",
                status: "CONFIRMED",
                startsAt: "2026-12-31T10:00:00Z",
                endsAt: "2026-12-31T10:30:00Z",
              }),
            ]),
            isLoading: false,
            isError: false,
          } as any;
        }
        return {
          data: buildPaginatedResponse(historyFixtures.multiple, { total: 3 }),
          isLoading: false,
          isError: false,
        } as any;
      });

      renderPage(createDefaultSearch({ patientId: "patient-1" }));

      await waitFor(() => {
        expect(screen.getByText("Past appointments")).toBeInTheDocument();
        expect(screen.getByText("Upcoming appointments")).toBeInTheDocument();
      });
    });
  });

  describe("PP-T007: appointment history with filters", () => {
    it("renders appointment history rows", async () => {
      const mockDetailQuery = vi.mocked(usePatientDetailQuery);
      mockDetailQuery.mockReturnValue({
        data: patientDetailFixtures.default,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientDetailQuery>);

      const mockHistoryQuery = vi.mocked(usePatientHistoryQuery);
      mockHistoryQuery.mockReturnValue({
        data: buildPaginatedResponse(historyFixtures.multiple, { total: 2 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientHistoryQuery>);

      renderPage(createDefaultSearch({ patientId: "patient-1" }));

      await waitFor(() => {
        expect(screen.getByText("Appointment History")).toBeInTheDocument();
      });
    });

    it("shows doctor name in history rows", async () => {
      const mockDetailQuery = vi.mocked(usePatientDetailQuery);
      mockDetailQuery.mockReturnValue({
        data: patientDetailFixtures.default,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientDetailQuery>);

      const mockHistoryQuery = vi.mocked(usePatientHistoryQuery);
      mockHistoryQuery.mockReturnValue({
        data: buildPaginatedResponse(historyFixtures.multiple, { total: 2 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientHistoryQuery>);

      renderPage(createDefaultSearch({ patientId: "patient-1" }));

      await waitFor(() => {
        expect(screen.getAllByText(/Khalid Mansour/).length).toBeGreaterThan(0);
      });
    });

    it("toggles expanded details when a row is clicked", async () => {
      const mockDetailQuery = vi.mocked(usePatientDetailQuery);
      mockDetailQuery.mockReturnValue({
        data: patientDetailFixtures.default,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientDetailQuery>);

      const mockHistoryQuery = vi.mocked(usePatientHistoryQuery);
      mockHistoryQuery.mockReturnValue({
        data: buildPaginatedResponse([
          buildPatientHistoryAppointmentDTO({
            id: "appt-details-1",
            status: "CANCELED",
            startsAt: "2026-05-01T09:00:00Z",
            endsAt: "2026-05-01T09:30:00Z",
            needsFollowUp: true,
            notes: "This is a custom appointment note.",
            cancellationReason: "Doctor was unavailable",
          })
        ], { total: 1 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientHistoryQuery>);

      renderPage(createDefaultSearch({ patientId: "patient-1" }));

      await waitFor(() => {
        expect(screen.getByText("Appointment History")).toBeInTheDocument();
      });

      const row = screen.getByText("Dr. Khalid Mansour").closest("tr");
      expect(row).toBeInTheDocument();
      fireEvent.click(row!);

      await waitFor(() => {
        expect(screen.getByText("Follow-up Required")).toBeInTheDocument();
        expect(screen.getByText("This is a custom appointment note.")).toBeInTheDocument();
        expect(screen.getByText("Doctor was unavailable")).toBeInTheDocument();
      });

      fireEvent.click(row!);

      await waitFor(() => {
        expect(screen.queryByText("Follow-up Required")).not.toBeInTheDocument();
      });
    });
  });

  describe("PP-T008: booking handoff with selected patient", () => {
    it("renders booking CTA when patient is selected", async () => {
      const mockDetailQuery = vi.mocked(usePatientDetailQuery);
      mockDetailQuery.mockReturnValue({
        data: patientDetailFixtures.default,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientDetailQuery>);

      const mockHistoryQuery = vi.mocked(usePatientHistoryQuery);
      mockHistoryQuery.mockReturnValue({
        data: buildPaginatedResponse(historyFixtures.multiple, { total: 2 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientHistoryQuery>);

      renderPage(createDefaultSearch({ patientId: "patient-1" }));

      await waitFor(() => {
        expect(screen.getByText("Book Appointment for This Patient")).toBeInTheDocument();
      });
    });
  });

  describe("PP-T009: distinct loading, empty, no-results, and error states", () => {
    it("renders guidance state when search is empty", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage();
      expect(screen.getByText("Find a Patient")).toBeInTheDocument();
    });

    it("renders loading state when search is in progress", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage(createDefaultSearch({ q: "Sara" }));
      expect(screen.getByLabelText("Searching patients...")).toBeInTheDocument();
    });

    it("renders no-results when search returns empty", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: buildPaginatedResponse<StaffPatientSearchDTO>([], { total: 0 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage(createDefaultSearch({ q: "xyz" }));
      expect(screen.getByText(/No patients match your search/)).toBeInTheDocument();
    });

    it("renders forbidden state for 403", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error("Request failed with status code 403"),
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage(createDefaultSearch({ q: "Sara" }));
      expect(screen.getByText("Access to patient records is restricted.")).toBeInTheDocument();
    });
  });

  describe("PP-T010: English and Arabic content with mobile layout", () => {
    it("renders h1 title in English", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage();
      expect(screen.getByText("Patients")).toBeInTheDocument();
    });

    it("uses flex-col on mobile container", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      const { baseElement } = renderPatientsPage(
        <PatientsPage
          search={createDefaultSearch()}
          onUpdateSearch={vi.fn()}
          onResetSearch={vi.fn()}
        />
      );
      const outerContainer = baseElement.querySelector(".md\\:flex-row");
      expect(outerContainer).toBeInTheDocument();
      expect(outerContainer?.className).toContain("flex-col");
    });

    it("uses md:flex-row for desktop layout", () => {
      const { baseElement } = renderPatientsPage(
        <PatientsPage
          search={createDefaultSearch()}
          onUpdateSearch={vi.fn()}
          onResetSearch={vi.fn()}
        />
      );
      const outerContainer = baseElement.querySelector(".md\\:flex-row");
      expect(outerContainer).toBeInTheDocument();
    });
  });

  describe("PP-T011: keyboard navigation and assistive announcements", () => {
    it("has aria-live region for result count", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: buildPaginatedResponse([patientSearchFixtures.singleResult], { total: 1 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage(createDefaultSearch({ q: "Sara" }));
      const liveRegion = screen.getByText(/1 patient/);
      expect(liveRegion.getAttribute("aria-live")).toBe("polite");
    });

    it("renders result cards as role option with aria-selected", () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: buildPaginatedResponse([patientSearchFixtures.singleResult], { total: 1 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      renderPage(createDefaultSearch({ q: "Sara" }));
      const card = screen.getByRole("option");
      expect(card).toBeInTheDocument();
      expect(card.getAttribute("aria-selected")).toBe("false");
    });

    it("marks selected card with aria-selected true", async () => {
      const mockSearchQuery = vi.mocked(usePatientSearchQuery);
      mockSearchQuery.mockReturnValue({
        data: buildPaginatedResponse([patientSearchFixtures.singleResult], { total: 1 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientSearchQuery>);

      const mockDetailQuery = vi.mocked(usePatientDetailQuery);
      mockDetailQuery.mockReturnValue({
        data: patientDetailFixtures.default,
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientDetailQuery>);

      const mockHistoryQuery2 = vi.mocked(usePatientHistoryQuery);
      mockHistoryQuery2.mockReturnValue({
        data: buildPaginatedResponse<PatientHistoryAppointmentDTO>([], { total: 0 }),
        isLoading: false,
        isError: false,
      } as ReturnType<typeof usePatientHistoryQuery>);

      renderPage(createDefaultSearch({ q: "Sara", patientId: "patient-1" }));

      await waitFor(() => {
        const cards = screen.getAllByRole("option");
        expect(cards[0].getAttribute("aria-selected")).toBe("true");
      });
    });
  });
});
