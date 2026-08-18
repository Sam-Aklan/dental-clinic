import { z } from "zod";

export const walkInBookingSchema = z.object({
	patientId: z.string().min(1, "walkIn.errors.patientRequired"),
	doctorId: z.string().min(1, "walkIn.errors.doctorRequired"),
	startsAt: z.string().min(1, "walkIn.errors.slotRequired"),
});

export type WalkInBookingFormValues = z.input<typeof walkInBookingSchema>;
