import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DoctorsAdminPage } from "@/components/doctors-admin";
import { parseDoctorsAdminSearch } from "@/lib/doctors-admin";
import type { DoctorsAdminUrlState } from "@/types";

export const Route = createFileRoute("/_authenticated/_admin/admin/doctors")({
  validateSearch: (search) => parseDoctorsAdminSearch(search as Record<string, string | undefined>),
  component: AdminDoctorsRoute,
});

function AdminDoctorsRoute() {
  const search = Route.useSearch() as DoctorsAdminUrlState;
  const navigate = useNavigate();

  const updateSearch = (patch: Partial<DoctorsAdminUrlState>) => {
    navigate({ search: { ...search, ...patch } as never });
  };

  return (
    <DoctorsAdminPage
      search={search}
      onUpdateSearch={updateSearch}
      onResetSearch={() => navigate({ search: parseDoctorsAdminSearch({}) as never })}
    />
  );
}
