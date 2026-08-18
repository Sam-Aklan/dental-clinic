import { describe, it, expect } from "vitest";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/lib/profile/schemas/change-password.schema";

describe("changePasswordSchema", () => {
  function validForm(): ChangePasswordFormValues {
    return {
      currentPassword: "OldPass123",
      newPassword: "NewPass456",
      confirmPassword: "NewPass456",
    };
  }

  it("accepts valid password change data", () => {
    const result = changePasswordSchema.safeParse(validForm());
    expect(result.success).toBe(true);
  });

  it("rejects empty current password", () => {
    const result = changePasswordSchema.safeParse({
      ...validForm(),
      currentPassword: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("profile.errors.currentPasswordRequired");
    }
  });

  it("rejects new password shorter than 8 characters", () => {
    const result = changePasswordSchema.safeParse({
      ...validForm(),
      newPassword: "Abc12",
      confirmPassword: "Abc12",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("profile.errors.passwordTooShort");
    }
  });

  it("rejects new password longer than 72 characters", () => {
    const longPassword = `A${"b1".repeat(36)}x`;
    const result = changePasswordSchema.safeParse({
      ...validForm(),
      newPassword: longPassword,
      confirmPassword: longPassword,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === "profile.errors.passwordTooLong")).toBe(true);
    }
  });

  it("rejects passwords missing an uppercase letter", () => {
    const result = changePasswordSchema.safeParse({
      ...validForm(),
      newPassword: "newpass456",
      confirmPassword: "newpass456",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === "profile.errors.passwordMissingUppercase")).toBe(true);
    }
  });

  it("rejects passwords missing a digit", () => {
    const result = changePasswordSchema.safeParse({
      ...validForm(),
      newPassword: "NewPassword",
      confirmPassword: "NewPassword",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === "profile.errors.passwordMissingDigit")).toBe(true);
    }
  });

  it("rejects mismatched confirmation password", () => {
    const result = changePasswordSchema.safeParse({
      ...validForm(),
      confirmPassword: "DifferentPass1",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const mismatch = result.error.issues.find((e) => e.path?.includes("confirmPassword"));
      expect(mismatch).toBeDefined();
      expect(mismatch?.message).toBe("profile.errors.passwordMismatch");
    }
  });

  it("rejects new password same as current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "SamePass123",
      newPassword: "SamePass123",
      confirmPassword: "SamePass123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const sameErr = result.error.issues.find((e) => e.path?.includes("newPassword"));
      expect(sameErr).toBeDefined();
      expect(sameErr?.message).toBe("profile.errors.passwordSameAsCurrent");
    }
  });
});
