import { createFileRoute, redirect } from "@tanstack/react-router";
import { WaitlistOfferPageSection } from "@/components/waitlist";
import { ROUTE_WAITLIST } from "@/constants/routes";

export const Route = createFileRoute("/_authenticated/_patient/offers/$")({
	component: PatientOfferRoute,
	validateSearch: () => ({} as { redirect?: string }),
	loader: ({ params }) => {
		const offerId = params._splat?.trim();
		if (!offerId) {
			throw redirect({ to: ROUTE_WAITLIST, replace: true });
		}
		return { offerId };
	},
});

function PatientOfferRoute() {
	return <WaitlistOfferPageSection />;
}
