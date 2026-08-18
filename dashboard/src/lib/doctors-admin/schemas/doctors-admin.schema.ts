import { z } from "zod";

const phoneRegex = /^[+\d\s\-()]{7,20}$/;
const timeRegex = /^\d{2}:\d{2}$/;

function isTodayOrFuture(value: string) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const parsed = new Date(`${value}T00:00:00`);
	return Number.isFinite(parsed.getTime()) && parsed >= today;
}

export const doctorProfileSchema = z.object({
	firstName: z.string().min(1, "doctorsAdmin.errors.firstNameRequired").max(80, "doctorsAdmin.errors.nameTooLong"),
	lastName: z.string().min(1, "doctorsAdmin.errors.lastNameRequired").max(80, "doctorsAdmin.errors.nameTooLong"),
	email: z.string().email("doctorsAdmin.errors.invalidEmail"),
	phone: z.string().optional().refine((value) => !value || phoneRegex.test(value), "doctorsAdmin.errors.invalidPhone"),
	specialization: z.string().max(120, "doctorsAdmin.errors.specializationTooLong").optional(),
	bio: z.string().max(1000, "doctorsAdmin.errors.bioTooLong").optional(),
	isActive: z.boolean().optional(),
});

export type DoctorProfileFormValues = z.infer<typeof doctorProfileSchema>;

export const scheduleOverrideSchema = z.object({
	date: z.string().min(1, "doctorsAdmin.errors.dateRequired").regex(/^\d{4}-\d{2}-\d{2}$/, "doctorsAdmin.errors.invalidDate"),
	isUnavailable: z.boolean(),
	startTime: z.string().nullable().optional(),
	endTime: z.string().nullable().optional(),
	reason: z.string().max(250, "doctorsAdmin.errors.reasonTooLong").optional(),
}).superRefine((value, ctx) => {
	if (!isTodayOrFuture(value.date)) {
		ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["date"], message: "doctorsAdmin.errors.pastDate" });
	}

	if (value.isUnavailable) {
		return;
	}

	if (!timeRegex.test(value.startTime ?? "")) {
		ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startTime"], message: "doctorsAdmin.errors.invalidTime" });
	}

	if (!timeRegex.test(value.endTime ?? "")) {
		ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endTime"], message: "doctorsAdmin.errors.invalidTime" });
	}

	if (timeRegex.test(value.startTime ?? "") && timeRegex.test(value.endTime ?? "") && (value.endTime ?? "") <= (value.startTime ?? "")) {
		ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endTime"], message: "doctorsAdmin.errors.endAfterStart" });
	}
});

export type ScheduleOverrideFormValues = z.infer<typeof scheduleOverrideSchema>;
