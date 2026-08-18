import { useQuery } from "@tanstack/react-query";
import type { PatientHistoryFilters } from "@/types";
import { patientHistoryQueryOptions } from "@/lib/patients";

export function usePatientHistoryQuery(filters: PatientHistoryFilters) {
  return useQuery(patientHistoryQueryOptions(filters));
}
