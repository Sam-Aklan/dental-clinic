import { z } from "zod";
import { isValid, isBefore, startOfToday } from "date-fns";

export const profileSchema = z.object({
  firstName: z
    .string()
    .min(1, "profile.errors.firstNameRequired")
    .max(100),
  lastName: z
    .string()
    .min(1, "profile.errors.lastNameRequired")
    .max(100),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^[+\d\s\-()]{7,20}$/.test(v),
      "profile.errors.invalidPhone",
    ),
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (v) => {
        if (!v) return true;
        const d = new Date(v);
        return isValid(d) && isBefore(d, startOfToday());
      },
      "profile.errors.invalidDOB",
    ),
  preferredLocale: z.enum(["EN", "AR"]),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
