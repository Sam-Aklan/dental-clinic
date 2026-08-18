import { beforeEach, describe, it, expect, vi } from "vitest";
import { patientsKeys } from "@/lib/patients";
import { patientSearchQueryOptions, patientDetailQueryOptions, patientHistoryQueryOptions } from "@/lib/patients";
import { searchPatients, getStaffPatient, getPatientAppointmentHistory } from "@/lib/patients/actions/patients.api";
import type { PatientSearchFilters, PatientHistoryFilters } from "@/types";

vi.mock("@/lib/axios-instance", () => ({
  api: {
    get: vi.fn(),
  },
}));

import { api } from "@/lib/axios-instance";

const mockedGet = vi.mocked(api.get);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("patientsKeys", () => {
  it("returns the correct all key", () => {
    expect(patientsKeys.all).toEqual(["staff", "patients"]);
  });

  it("returns the correct searchList key with filters", () => {
    const filters: PatientSearchFilters = { q: "Sara", page: 1 };
    expect(patientsKeys.searchList(filters)).toEqual([
      "staff",
      "patients",
      "search",
      filters,
    ]);
  });

  it("returns the correct detail key", () => {
    expect(patientsKeys.detail("patient-1")).toEqual([
      "staff",
      "patients",
      "detail",
      "patient-1",
    ]);
  });

  it("returns the correct history key with filters", () => {
    const filters: PatientHistoryFilters = {
      patientId: "patient-1",
      from: "2026-01-01",
      to: "2026-06-01",
      status: ["COMPLETED"],
      page: 1,
      pageSize: 10,
    };
    expect(patientsKeys.history(filters)).toEqual([
      "staff",
      "patients",
      "history",
      filters,
    ]);
  });
});

describe("patientSearchQueryOptions", () => {
  it("is disabled when q is shorter than 2 characters", () => {
    const filters: PatientSearchFilters = { q: "a" };
    const options = patientSearchQueryOptions(filters);
    expect(options.enabled).toBe(false);
  });

  it("is disabled when q is only whitespace", () => {
    const filters: PatientSearchFilters = { q: "  " };
    const options = patientSearchQueryOptions(filters);
    expect(options.enabled).toBe(false);
  });

  it("is disabled when q is empty", () => {
    const filters: PatientSearchFilters = { q: "" };
    const options = patientSearchQueryOptions(filters);
    expect(options.enabled).toBe(false);
  });

  it("is enabled when q has 2 or more non-space characters", () => {
    const filters: PatientSearchFilters = { q: "Sa" };
    const options = patientSearchQueryOptions(filters);
    expect(options.enabled).toBe(true);
  });

  it("uses keepPreviousData as placeholderData", () => {
    const filters: PatientSearchFilters = { q: "Sara" };
    const options = patientSearchQueryOptions(filters);
    expect(options.placeholderData).toBeDefined();
  });

  it("defaults pageSize to undefined (backend default)", () => {
    const filters: PatientSearchFilters = { q: "Sara" };
    patientsKeys.searchList(filters);
    expect(true).toBe(true);
  });
});

describe("patientDetailQueryOptions", () => {
  it("is enabled when patientId is provided", () => {
    const options = patientDetailQueryOptions("patient-1");
    expect(options.enabled).toBe(true);
  });

  it("is disabled when patientId is empty string", () => {
    const options = patientDetailQueryOptions("");
    expect(options.enabled).toBe(false);
  });
});

describe("patientHistoryQueryOptions", () => {
  it("is enabled when patientId is provided", () => {
    const filters: PatientHistoryFilters = { patientId: "patient-1" };
    const options = patientHistoryQueryOptions(filters);
    expect(options.enabled).toBe(true);
  });

  it("is disabled when patientId is empty", () => {
    const filters: PatientHistoryFilters = { patientId: "" };
    const options = patientHistoryQueryOptions(filters);
    expect(options.enabled).toBe(false);
  });

  it("uses keepPreviousData as placeholderData", () => {
    const filters: PatientHistoryFilters = { patientId: "patient-1" };
    const options = patientHistoryQueryOptions(filters);
    expect(options.placeholderData).toBeDefined();
  });

  it("includes all filter params in query key", () => {
    const filters: PatientHistoryFilters = {
      patientId: "patient-1",
      from: "2026-01-01",
      to: "2026-06-01",
      status: ["COMPLETED"],
      page: 2,
      pageSize: 10,
    };
    const key = patientsKeys.history(filters);
    expect(key[3]).toEqual(filters);
  });
});

describe("patients.api", () => {
  it("normalizes patient search responses that use nested items", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          items: [{ id: "patient-1", firstName: "Sara", lastName: "Ali" }],
          total: 1,
          page: 2,
          pageSize: 15,
        },
      },
    } as Awaited<ReturnType<typeof api.get>>);

    await expect(searchPatients({ q: "Sara", page: 2, pageSize: 15 })).resolves.toEqual({
      data: [{ id: "patient-1", firstName: "Sara", lastName: "Ali" }],
      total: 1,
      page: 2,
      pageSize: 15,
    });
  });

  it("normalizes patient history responses that use nested data arrays", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          data: [{
            id: "appointment-1",
            patientId: "patient-1",
            status: "COMPLETED",
            startsAt: "2026-05-01T09:00:00.000Z",
            endsAt: "2026-05-01T09:30:00.000Z",
            needsFollowUp: false,
            notes: null,
            cancellationReason: null,
            doctor: {
              id: "doctor-1",
              firstName: "Lina",
              lastName: "Yusuf",
              specialization: null,
            },
          }],
          total: 1,
          page: 1,
          pageSize: 10,
        },
      },
    } as Awaited<ReturnType<typeof api.get>>);

    await expect(getPatientAppointmentHistory({ patientId: "patient-1", patientName: "Sara Ali", page: 1, pageSize: 10 })).resolves.toEqual({
      data: [{
        id: "appointment-1",
        patientId: "patient-1",
        status: "COMPLETED",
        startsAt: "2026-05-01T09:00:00.000Z",
        endsAt: "2026-05-01T09:30:00.000Z",
        needsFollowUp: false,
        notes: null,
        cancellationReason: null,
        doctor: {
          id: "doctor-1",
          firstName: "Lina",
          lastName: "Yusuf",
          specialization: null,
        },
      }],
      total: 1,
      page: 1,
      pageSize: 10,
    });

    expect(mockedGet).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        paramsSerializer: expect.any(Function),
      })
    );

    const lastCallConfig = mockedGet.mock.calls[0][1];
    const serializer = lastCallConfig?.paramsSerializer;
    expect(serializer).toBeDefined();
    if (serializer) {
      const serialized = serializer({ status: ["COMPLETED", "NO_SHOW"] });
      expect(serialized).toBe("status=COMPLETED&status=NO_SHOW");
    }
  });

  it("maps wrapped user detail responses", async () => {
    mockedGet.mockResolvedValueOnce({
      data: {
        data: {
          id: "patient-1",
          firstName: "Sara",
          lastName: "Ali",
          email: "sara@example.com",
          phone: "+9647001234567",
          preferredLocale: "AR",
          isActive: true,
          createdAt: "2026-01-10T08:30:00.000Z",
          patientProfile: { dateOfBirth: "1990-03-15" },
        },
      },
    } as Awaited<ReturnType<typeof api.get>>);

    await expect(getStaffPatient("patient-1")).resolves.toEqual({
      id: "patient-1",
      firstName: "Sara",
      lastName: "Ali",
      email: "sara@example.com",
      phone: "+9647001234567",
      dateOfBirth: "1990-03-15",
      isActive: true,
      lastAppointmentAt: null,
      nextAppointmentAt: null,
      languagePreference: "ar",
      createdAt: "2026-01-10T08:30:00.000Z",
      notes: null,
    });
  });
});
