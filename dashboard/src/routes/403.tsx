import { createFileRoute } from "@tanstack/react-router";
import { ForbiddenPage } from "@/components/shared/ForbiddenPage";

export const Route = createFileRoute("/403")({
	component: ForbiddenRoute,
});

function ForbiddenRoute() {
	return <ForbiddenPage />;
}
