import { createFileRoute } from "@tanstack/react-router";
import { AppointmentsAdminPage } from "@/components/staff-appointments";

export const Route = createFileRoute("/_authenticated/_receptionist/staff/appointments")({
  component: StaffAppointmentsRoute,
});

function StaffAppointmentsRoute() {
  return <AppointmentsAdminPage />;
}
