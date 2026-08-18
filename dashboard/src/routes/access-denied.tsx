import { createFileRoute } from "@tanstack/react-router";
import { AccessDeniedSection } from "@/components/shared/access-denied-section";

export const Route = createFileRoute("/access-denied")({
	component: AccessDeniedRoute,
});

function AccessDeniedRoute() {
	return <AccessDeniedSection />;
}
