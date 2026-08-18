import React from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { PatientAppointmentHistoryTable } from "@/components/patients/PatientAppointmentHistoryTable";
import { dateRangeSchema } from "@/lib/patients";
import { renderPatientsPage } from "./test-utils";

describe("PatientAppointmentHistoryTable Date Validation", () => {
  it("validates that fromDate must be less than toDate using dateRangeSchema", () => {
    // Valid cases
    expect(dateRangeSchema.safeParse({ fromDate: "2026-06-20", toDate: "2026-06-21" }).success).toBe(true);
    expect(dateRangeSchema.safeParse({ fromDate: "2026-06-20", toDate: undefined }).success).toBe(true);
    expect(dateRangeSchema.safeParse({ fromDate: undefined, toDate: "2026-06-21" }).success).toBe(true);

    // Invalid cases (equal dates or fromDate > toDate)
    expect(dateRangeSchema.safeParse({ fromDate: "2026-06-20", toDate: "2026-06-20" }).success).toBe(false);
    expect(dateRangeSchema.safeParse({ fromDate: "2026-06-21", toDate: "2026-06-20" }).success).toBe(false);
  });

  it("renders validation error message when dates are invalid", () => {
    const mockOnStatusChange = vi.fn();
    const mockOnFromDateChange = vi.fn();
    const mockOnToDateChange = vi.fn();
    const mockOnPageChange = vi.fn();
    const mockOnClearFilters = vi.fn();

    renderPatientsPage(
      <PatientAppointmentHistoryTable
        history={{ data: [], total: 0, page: 1, pageSize: 5, pastCount: 0, upcomingCount: 0 }}
        isLoading={false}
        isError={false}
        statusFilter={[]}
        fromDate="2026-06-22"
        toDate="2026-06-22" // same day -> invalid based on < restriction
        page={1}
        onStatusChange={mockOnStatusChange}
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        onPageChange={mockOnPageChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    // Should find the error message (using translation fallback or translated string)
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/From date must be less than to date/i)).toBeInTheDocument();
  });

  it("does not render validation error message when dates are valid", () => {
    const mockOnStatusChange = vi.fn();
    const mockOnFromDateChange = vi.fn();
    const mockOnToDateChange = vi.fn();
    const mockOnPageChange = vi.fn();
    const mockOnClearFilters = vi.fn();

    renderPatientsPage(
      <PatientAppointmentHistoryTable
        history={{ data: [], total: 0, page: 1, pageSize: 5, pastCount: 0, upcomingCount: 0 }}
        isLoading={false}
        isError={false}
        statusFilter={[]}
        fromDate="2026-06-21"
        toDate="2026-06-22"
        page={1}
        onStatusChange={mockOnStatusChange}
        onFromDateChange={mockOnFromDateChange}
        onToDateChange={mockOnToDateChange}
        onPageChange={mockOnPageChange}
        onClearFilters={mockOnClearFilters}
      />
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
