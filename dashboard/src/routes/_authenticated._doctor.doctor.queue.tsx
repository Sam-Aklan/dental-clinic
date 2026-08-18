import { createFileRoute } from "@tanstack/react-router";
import { DoctorQueuePage } from "@/components/doctor-queue/DoctorQueuePage";

export const Route = createFileRoute("/_authenticated/_doctor/doctor/queue")({
	component: DoctorQueueRoute,
});

function DoctorQueueRoute() {
	return <DoctorQueuePage />;
}
