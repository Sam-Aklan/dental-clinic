import { createFileRoute } from "@tanstack/react-router";
import { ClinicSettingsPage } from "@/components/clinic-settings";

export const Route = createFileRoute("/_authenticated/_admin/admin/settings")({
  component: AdminSettingsRoute,
});

function AdminSettingsRoute() {
  return <ClinicSettingsPage />;
}
