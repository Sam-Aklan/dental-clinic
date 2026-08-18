import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "auth.errors.emailRequired")
    .email("auth.errors.invalidEmail"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
