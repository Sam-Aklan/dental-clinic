import { z } from "zod";

export const cancelReasonSchema = z.object({
	reason: z.string().trim().min(1, "Cancellation reason is required"),
});

export type CancelReasonFormValues = z.infer<typeof cancelReasonSchema>;
