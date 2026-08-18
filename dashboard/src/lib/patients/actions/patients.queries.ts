import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { patientsKeys } from "./patients.keys";
import { searchPatients, getStaffPatient, getPatientAppointmentHistory } from "./patients.api";
import type { PatientSearchFilters, PatientHistoryFilters } from "@/types";

export function patientSearchQueryOptions(filters: PatientSearchFilters) {
  return queryOptions({
    queryKey: patientsKeys.searchList(filters),
    queryFn: () => searchPatients(filters),
    enabled: filters.q.trim().length >= 2,
    placeholderData: keepPreviousData,
  });
}

export function patientDetailQueryOptions(patientId: string) {
  return queryOptions({
    queryKey: patientsKeys.detail(patientId),
    queryFn: () => getStaffPatient(patientId),
    enabled: Boolean(patientId),
  });
}

export function patientHistoryQueryOptions(filters: PatientHistoryFilters) {
  return queryOptions({
    queryKey: patientsKeys.history(filters),
    queryFn: () => getPatientAppointmentHistory(filters),
    enabled: Boolean(filters.patientId),
    placeholderData: keepPreviousData,
  });
}
