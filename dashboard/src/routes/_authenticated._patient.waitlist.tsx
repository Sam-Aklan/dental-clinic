import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { WaitlistPageSection } from "@/components/waitlist";

const waitlistSearchSchema = z.object({
	doctorId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/_patient/waitlist")({
	validateSearch: waitlistSearchSchema,
	component: PatientWaitlistRoute,
});

function PatientWaitlistRoute() {
	const { doctorId } = Route.useSearch();
	return <WaitlistPageSection preselectedDoctorId={doctorId ?? null} />;
}
