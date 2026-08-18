import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email("auth.errors.invalidEmail"),
	password: z.string().min(1, "auth.errors.passwordRequired"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
