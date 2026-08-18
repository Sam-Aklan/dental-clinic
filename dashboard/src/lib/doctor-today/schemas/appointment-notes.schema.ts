import { z } from "zod";

export const appointmentNotesSchema = z.object({
	notes: z.string().max(1000, "doctorToday.note.maxLength"),
});

export type AppointmentNotesFormValues = z.infer<typeof appointmentNotesSchema>;
