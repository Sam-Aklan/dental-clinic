import { z } from "zod";

export const appointmentNoteSchema = z.object({
	notes: z.string().max(1000, "queue.note.maxLength"),
});
