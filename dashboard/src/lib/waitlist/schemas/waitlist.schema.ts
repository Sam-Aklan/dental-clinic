import { z } from "zod";

export const availabilityWindowSchema = z
	.object({
		doctorId: z.string().min(1, { message: "waitlist.errors.doctorRequired" }),
		availableFrom: z.string().optional().nullable(),
		availableUntil: z.string().optional().nullable(),
	})
	.refine(
		(data) => {
			const hasFrom = !!data.availableFrom;
			const hasUntil = !!data.availableUntil;
			return hasFrom === hasUntil;
		},
		{ message: "waitlist.errors.windowIncomplete" },
	)
	.refine(
		(data) => {
			const hasFrom = !!data.availableFrom;
			const hasUntil = !!data.availableUntil;
			if (!hasFrom || !hasUntil) return true;
			return data.availableFrom! < data.availableUntil!;
		},
		{ message: "waitlist.errors.windowInvalid" },
	);

export type AvailabilityWindowFormData = z.infer<typeof availabilityWindowSchema>;
