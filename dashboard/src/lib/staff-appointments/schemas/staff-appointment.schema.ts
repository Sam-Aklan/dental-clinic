import { z } from "zod";

export const cancelStaffAppointmentSchema = z.object({
	reason: z.string().trim().min(1, "Reason is required").max(500, "Reason must be 500 characters or fewer"),
});

export const rescheduleStaffAppointmentSchema = z.object({
	doctorId: z.string().uuid(),
	date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
	startsAt: z.string().min(1),
	reason: z.string().trim().max(500).optional(),
});

export type CancelStaffAppointmentFormValues = z.infer<typeof cancelStaffAppointmentSchema>;
export type RescheduleStaffAppointmentFormValues = z.infer<typeof rescheduleStaffAppointmentSchema>;
