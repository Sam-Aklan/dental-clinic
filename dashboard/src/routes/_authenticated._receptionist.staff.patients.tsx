import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PatientsPage } from "@/components/patients";
import { patientsUrlStateSchema } from "@/lib/patients";
import type { PatientPageUrlState } from "@/types";
import { useCallback } from "react";

export const Route = createFileRoute("/_authenticated/_receptionist/staff/patients")({
  validateSearch: patientsUrlStateSchema,
  component: StaffPatientsRoute,
});

function StaffPatientsRoute() {
  const search = Route.useSearch();
  const navigate = useNavigate();

  const state = search as PatientPageUrlState;

  const updateSearch = useCallback(
    (patch: Partial<PatientPageUrlState>) => {
      const next = { ...state, ...patch };
      navigate({ search: next as never });
    },
    [navigate, state]
  );

  const resetSearch = useCallback(() => {
    navigate({ search: { q: "", status: [], page: 1 } as never });
  }, [navigate]);

  return (
    <PatientsPage
      search={state}
      onUpdateSearch={updateSearch}
      onResetSearch={resetSearch}
    />
  );
}
