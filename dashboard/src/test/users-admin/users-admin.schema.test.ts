import { describe, expect, it } from "vitest";
import { createUserSchema, editUserSchema } from "@/lib/users-admin";

describe("users admin schemas", () => {
	it("validates create user payloads", () => {
		const result = createUserSchema.safeParse({ firstName: "Amina", lastName: "Saleh", email: "amina@example.com", phone: "+962-79-1234567", role: "ADMIN", languagePreference: "en", password: "Password1" });
		expect(result.success).toBe(true);
	});

	it("rejects weak passwords and invalid phone numbers", () => {
		expect(createUserSchema.safeParse({ firstName: "A", lastName: "B", email: "bad", phone: "123", role: "ADMIN", languagePreference: "en", password: "password" }).success).toBe(false);
	});

	it("validates edit user payloads", () => {
		expect(editUserSchema.safeParse({ firstName: "Amina", lastName: "Saleh", phone: "+962-79-1234567", role: "ADMIN", languagePreference: "ar" }).success).toBe(true);
	});
});
