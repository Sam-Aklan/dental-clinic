import { createFileRoute } from "@tanstack/react-router";
import { QueueLobbyAccessPage } from "@/components/queue";

export const Route = createFileRoute("/_authenticated/_admin/admin/lobby-access")({
	component: AdminLobbyAccessRoute,
});

function AdminLobbyAccessRoute() {
	return <QueueLobbyAccessPage />;
}
