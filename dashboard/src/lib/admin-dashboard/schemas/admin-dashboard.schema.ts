import { z } from "zod";

export const adminDashboardDateRangeSchema = z.object({
	from: z.string().min(1),
	to: z.string().min(1),
}).refine(({ from, to }) => new Date(from) <= new Date(to), {
	message: "Start date must be before or equal to end date",
	path: ["from"],
});

export const adminDashboardFollowUpThresholdSchema = z.object({
	thresholdDays: z.coerce.number().int().min(1).max(3650),
});
