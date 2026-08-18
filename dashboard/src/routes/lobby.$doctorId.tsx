import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LobbyQueuePage } from "@/components/lobby-queue";

export const Route = createFileRoute("/lobby/$doctorId")({
	validateSearch: z.object({
		kt: z.string().optional(),
	}),
	component: LobbyQueueRoute,
});

function LobbyQueueRoute() {
	const { doctorId } = Route.useParams();
	const { kt } = Route.useSearch();

	return <LobbyQueuePage doctorId={doctorId} kioskToken={kt ?? null} />;
}
