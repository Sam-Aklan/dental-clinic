import { z } from "zod";

const phoneSchema = z.string().regex(/^\+?[0-9\s\-().]{7,20}$/, "Invalid phone number").or(z.literal(""));

export const createUserSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required").max(80, "First name is too long"),
	lastName: z.string().trim().min(1, "Last name is required").max(80, "Last name is too long"),
	email: z.string().trim().email("Invalid email address"),
	phone: phoneSchema,
	role: z.enum(["PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"]),
	languagePreference: z.enum(["en", "ar"]).default("en"),
	password: z.string().min(8, "Password must be at least 8 characters").max(72, "Password must be 72 characters or less").regex(/[A-Z]/, "Must contain at least one uppercase letter").regex(/[0-9]/, "Must contain at least one digit"),
});

export const editUserSchema = z.object({
	firstName: z.string().trim().min(1, "First name is required").max(80, "First name is too long"),
	lastName: z.string().trim().min(1, "Last name is required").max(80, "Last name is too long"),
	phone: phoneSchema.nullable(),
	role: z.enum(["PATIENT", "DOCTOR", "RECEPTIONIST", "ADMIN"]),
	languagePreference: z.enum(["en", "ar"]).default("en"),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
export type EditUserFormValues = z.infer<typeof editUserSchema>;
