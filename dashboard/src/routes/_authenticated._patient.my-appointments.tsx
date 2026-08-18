import { createFileRoute } from "@tanstack/react-router";
import { MyAppointmentsPage } from "@/components/appointments";

export const Route = createFileRoute("/_authenticated/_patient/my-appointments")({
	component: PatientAppointmentsRoute,
});

function PatientAppointmentsRoute() {
	return <MyAppointmentsPage />;
}
