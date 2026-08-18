import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "profile.errors.currentPasswordRequired"),
    newPassword: z
      .string()
      .min(8, "profile.errors.passwordTooShort")
      .max(72, "profile.errors.passwordTooLong")
      .regex(/[A-Z]/, "profile.errors.passwordMissingUppercase")
      .regex(/[0-9]/, "profile.errors.passwordMissingDigit"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "profile.errors.passwordMismatch",
    path: ["confirmPassword"],
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "profile.errors.passwordSameAsCurrent",
    path: ["newPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
