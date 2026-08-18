import { useQuery } from "@tanstack/react-query";
import { patientDetailQueryOptions } from "@/lib/patients";

export function usePatientDetailQuery(patientId: string) {
  return useQuery(patientDetailQueryOptions(patientId));
}
