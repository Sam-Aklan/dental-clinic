import { createFileRoute } from "@tanstack/react-router";
import { DoctorTodayPage } from "@/components/doctor-today/DoctorTodayPage";

export const Route = createFileRoute("/_authenticated/_doctor/doctor/today")({
	component: DoctorTodayRoute,
});

function DoctorTodayRoute() {
	return <DoctorTodayPage />;
}
