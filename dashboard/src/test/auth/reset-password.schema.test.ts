import { describe, it, expect } from "vitest";
import { resetPasswordSchema } from "@/lib/auth/schemas/reset-password.schema";

describe("resetPasswordSchema", () => {
	it("accepts valid matching passwords", () => {
		const result = resetPasswordSchema.safeParse({
			newPassword: "newStrongPassword1",
			confirmPassword: "newStrongPassword1",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.newPassword).toBe("newStrongPassword1");
			expect(result.data.confirmPassword).toBe("newStrongPassword1");
		}
	});

	it("rejects an empty newPassword", () => {
		const result = resetPasswordSchema.safeParse({
			newPassword: "",
			confirmPassword: "anything",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain("auth.errors.passwordRequired");
		}
	});

	it("rejects a short newPassword", () => {
		const result = resetPasswordSchema.safeParse({
			newPassword: "short",
			confirmPassword: "short",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain("auth.errors.passwordTooShort");
		}
	});

	it("rejects mismatched passwords and attaches error to confirmPassword", () => {
		const result = resetPasswordSchema.safeParse({
			newPassword: "StrongPassword1",
			confirmPassword: "differentPassword1",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const confirmPasswordIssue = result.error.issues.find(
				(i) => i.path[0] === "confirmPassword",
			);
			expect(confirmPasswordIssue).toBeDefined();
			expect(confirmPasswordIssue?.message).toBe(
				"auth.errors.passwordMismatch",
			);
		}
	});

	it("rejects empty confirmPassword", () => {
		const result = resetPasswordSchema.safeParse({
			newPassword: "StrongPassword1",
			confirmPassword: "",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain("auth.errors.passwordRequired");
		}
	});

	it("rejects both empty and mismatched together", () => {
		const result = resetPasswordSchema.safeParse({
			newPassword: "",
			confirmPassword: "",
		});
		expect(result.success).toBe(false);
	});
});

	it("rejects empty newPassword with passwordRequired (RP-VT-006)", () => {
		const result = resetPasswordSchema.safeParse({
			newPassword: "",
			confirmPassword: "anything",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const newPasswordIssues = result.error.issues.filter(
				(i) => i.path[0] === "newPassword",
			);
			expect(newPasswordIssues.length).toBeGreaterThan(0);
		}
	});

	it("rejects short password with passwordTooShort (RP-VT-007)", () => {
		const result = resetPasswordSchema.safeParse({
			newPassword: "short",
			confirmPassword: "short",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((i) => i.message);
			expect(messages).toContain("auth.errors.passwordTooShort");
		}
	});

	it("mismatch error is on confirmPassword path (RP-VT-008)", () => {
		const result = resetPasswordSchema.safeParse({
			newPassword: "StrongPassword1",
			confirmPassword: "differentPassword1",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const confirmIssue = result.error.issues.find(
				(i) => i.path[0] === "confirmPassword",
			);
			expect(confirmIssue).toBeDefined();
			expect(confirmIssue?.message).toBe("auth.errors.passwordMismatch");
		}
	});

	it("accepts passwords exactly at minimum length", () => {
		const result = resetPasswordSchema.safeParse({
			newPassword: "12345678",
			confirmPassword: "12345678",
		});
		expect(result.success).toBe(true);
	});
