import { z } from "zod";

const ianaZones = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
const timeRegex = /^\d{2}:\d{2}$/;

export const bookingRulesSchema = z.object({
	timeZone: z
		.string()
		.min(1, "clinicSettings.errors.required")
		.refine((value) => ianaZones.includes(value), "clinicSettings.bookingRules.invalidTimezone"),
	slotDurationMinutes: z.coerce
		.number()
		.int("clinicSettings.bookingRules.invalidSlotDuration")
		.min(5, "clinicSettings.bookingRules.slotDurationRange")
		.max(180, "clinicSettings.bookingRules.slotDurationRange")
		.refine((value) => value % 5 === 0, "clinicSettings.bookingRules.slotDurationStep"),
	reminderHoursBefore: z.coerce
		.number()
		.int("clinicSettings.bookingRules.invalidReminderHours")
		.min(1, "clinicSettings.bookingRules.reminderHoursRange")
		.max(168, "clinicSettings.bookingRules.reminderHoursRange"),
	waitlistOfferWindowMinutes: z.coerce
		.number()
		.int("clinicSettings.bookingRules.invalidOfferWindow")
		.min(5, "clinicSettings.bookingRules.offerWindowRange")
		.max(1440, "clinicSettings.bookingRules.offerWindowRange"),
	minArrivalBufferMinutes: z.coerce
		.number()
		.int("clinicSettings.bookingRules.invalidArrivalBuffer")
		.min(0, "clinicSettings.bookingRules.arrivalBufferRange")
		.max(120, "clinicSettings.bookingRules.arrivalBufferRange")
		.optional(),
});

export type BookingRulesFormValues = z.infer<typeof bookingRulesSchema>;

const weekdayRowSchema = z
	.object({
		dayOfWeek: z.coerce.number().int().min(0).max(6),
		isClosed: z.coerce.boolean(),
		startTime: z.string(),
		endTime: z.string(),
	})
	.superRefine((row, ctx) => {
		if (row.isClosed) {
			return;
		}

		if (!timeRegex.test(row.startTime)) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startTime"], message: "clinicSettings.weeklyHours.invalidTime" });
		}

		if (!timeRegex.test(row.endTime)) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endTime"], message: "clinicSettings.weeklyHours.invalidTime" });
		}

		if (timeRegex.test(row.startTime) && timeRegex.test(row.endTime) && row.endTime <= row.startTime) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endTime"], message: "clinicSettings.weeklyHours.endAfterStart" });
		}
	});

export const weeklyScheduleSchema = z
	.object({
		weekdays: z.array(weekdayRowSchema).length(7, "clinicSettings.weeklyHours.mustHaveSevenDays"),
	})
	.superRefine(({ weekdays }, ctx) => {
		const seen = new Set<number>();
		weekdays.forEach((row, index) => {
			if (seen.has(row.dayOfWeek)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					path: ["weekdays", index, "dayOfWeek"],
					message: "clinicSettings.weeklyHours.duplicateWeekday",
				});
			}
			seen.add(row.dayOfWeek);
		});
	});

export type WeeklyScheduleFormValues = z.infer<typeof weeklyScheduleSchema>;

export const addHolidaySchema = z.object({
	date: z.string().min(1, "clinicSettings.holidays.dateRequired").regex(/^\d{4}-\d{2}-\d{2}$/, "clinicSettings.holidays.invalidDate"),
	name: z.string().min(1, "clinicSettings.holidays.nameRequired").max(120, "clinicSettings.holidays.nameTooLong"),
});

export type AddHolidayFormValues = z.infer<typeof addHolidaySchema>;

export function isHolidayDateDuplicate(candidateDate: string, existingDates: string[]) {
	return existingDates.includes(candidateDate);
}
