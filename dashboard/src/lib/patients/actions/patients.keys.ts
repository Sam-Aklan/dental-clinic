import type { PatientSearchFilters, PatientHistoryFilters } from "@/types";

export const patientsKeys = {
  all: ["staff", "patients"] as const,

  searchList: (filters: PatientSearchFilters) =>
    [...patientsKeys.all, "search", filters] as const,

  detail: (patientId: string) =>
    [...patientsKeys.all, "detail", patientId] as const,

  history: (filters: PatientHistoryFilters) =>
    [...patientsKeys.all, "history", filters] as const,
};
