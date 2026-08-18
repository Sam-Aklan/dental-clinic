import { z } from "zod";

export const resetPasswordSchema = z
	.object({
		newPassword: z.string().min(1, "auth.errors.passwordRequired").min(8, "auth.errors.passwordTooShort"),
		confirmPassword: z.string().min(1, "auth.errors.passwordRequired"),
	})
	.refine((d) => d.newPassword === d.confirmPassword, {
		message: "auth.errors.passwordMismatch",
		path: ["confirmPassword"],
	});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
