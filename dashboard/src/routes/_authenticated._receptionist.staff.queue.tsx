import { createFileRoute } from "@tanstack/react-router";
import { StaffQueuePage } from "@/components/queue";

export const Route = createFileRoute("/_authenticated/_receptionist/staff/queue")({
	component: StaffQueueRoute,
});

function StaffQueueRoute() {
	return <StaffQueuePage />;
}
