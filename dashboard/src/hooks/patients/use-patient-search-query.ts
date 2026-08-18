import { useQuery } from "@tanstack/react-query";
import type { PatientSearchFilters } from "@/types";
import { patientSearchQueryOptions } from "@/lib/patients";

export function usePatientSearchQuery(filters: PatientSearchFilters) {
  return useQuery(patientSearchQueryOptions(filters));
}
