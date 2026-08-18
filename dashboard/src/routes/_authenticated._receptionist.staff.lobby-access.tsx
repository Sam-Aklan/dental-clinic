import { createFileRoute } from "@tanstack/react-router";
import { QueueLobbyAccessPage } from "@/components/queue";

export const Route = createFileRoute("/_authenticated/_receptionist/staff/lobby-access")({
	component: StaffLobbyAccessRoute,
});

function StaffLobbyAccessRoute() {
	return <QueueLobbyAccessPage />;
}
