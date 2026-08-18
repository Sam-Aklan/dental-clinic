import { z } from "zod";

function trimToOptional(value: unknown) {
	if (typeof value !== "string") return value;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

export const followUpScheduleSchema = z.object({
	slotStartsAt: z.string().min(1, "followUps.scheduling.errors.slotRequired"),
	reason: z.preprocess((value) => (typeof value === "string" ? value.trim() : value), z.string().min(1, "followUps.scheduling.errors.reasonRequired").max(500, "followUps.scheduling.errors.reasonTooLong")),
	notes: z.preprocess(trimToOptional, z.string().max(2000, "followUps.scheduling.errors.notesTooLong").optional()),
});

export type FollowUpScheduleSchemaValues = z.infer<typeof followUpScheduleSchema>;
