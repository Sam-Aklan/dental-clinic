import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/shared/NotFoundPage";

export const Route = createFileRoute("/$")({
	component: NotFoundRoute,
});

function NotFoundRoute() {
	return <NotFoundPage />;
}
