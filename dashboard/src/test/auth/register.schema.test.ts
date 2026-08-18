import { describe, expect, it } from "vitest";
import { registerSchema } from "@/lib/auth/schemas/register.schema";

describe("registerSchema", () => {
	it("accepts a compliant payload", () => {
		const result = registerSchema.safeParse({
			firstName: "Amina",
			lastName: "Saleh",
			email: "amina@example.com",
			password: "Password123",
			confirmPassword: "Password123",
			consent: true,
		});

		expect(result.success).toBe(true);
	});

	it("rejects passwords without an uppercase letter", () => {
		const result = registerSchema.safeParse({
			firstName: "Amina",
			lastName: "Saleh",
			email: "amina@example.com",
			password: "password123",
			confirmPassword: "password123",
			consent: true,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((issue) => issue.message)).toContain("auth.errors.passwordUppercaseRequired");
		}
	});

	it("rejects passwords without a digit", () => {
		const result = registerSchema.safeParse({
			firstName: "Amina",
			lastName: "Saleh",
			email: "amina@example.com",
			password: "PasswordABC",
			confirmPassword: "PasswordABC",
			consent: true,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.map((issue) => issue.message)).toContain("auth.errors.passwordDigitRequired");
		}
	});

	it("rejects names longer than 50 characters", () => {
		const longName = "A".repeat(51);
		const result = registerSchema.safeParse({
			firstName: longName,
			lastName: "Saleh",
			email: "amina@example.com",
			password: "Password123",
			confirmPassword: "Password123",
			consent: true,
		});

		expect(result.success).toBe(false);
	});
});
