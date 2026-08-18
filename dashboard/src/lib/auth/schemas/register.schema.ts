import { z } from "zod";
import { parseISO, isValid, isBefore, differenceInYears } from "date-fns";

export const registerSchema = z
	.object({
		firstName: z.string().min(1, "auth.errors.firstNameRequired").max(50, "auth.errors.firstNameTooLong"),
		lastName: z.string().min(1, "auth.errors.lastNameRequired").max(50, "auth.errors.lastNameTooLong"),
		email: z.string().email("auth.errors.invalidEmail"),
		password: z
			.string()
			.min(8, "auth.errors.passwordTooShort")
			.regex(/[A-Z]/, "auth.errors.passwordUppercaseRequired")
			.regex(/[0-9]/, "auth.errors.passwordDigitRequired"),
		confirmPassword: z.string(),
		phoneNumber: z
			.string()
			.optional()
			.refine((v) => !v || /^[+\d\s\-()]{7,20}$/.test(v), "auth.errors.invalidPhone"),
		dateOfBirth: z
			.string()
			.optional()
			.refine((v) => {
				if (!v) return true;
				const dob = parseISO(v);
				const today = new Date();
				return (
					isValid(dob) &&
					isBefore(dob, today) &&
					differenceInYears(today, dob) >= 16
				);
			}, "auth.errors.invalidDOB"),
		consent: z.literal(true, {
			message: "auth.errors.consentRequired",
		}),
	})
	.refine((d) => d.password === d.confirmPassword, {
		message: "auth.errors.passwordMismatch",
		path: ["confirmPassword"],
	});

export type RegisterFormValues = z.infer<typeof registerSchema>;
