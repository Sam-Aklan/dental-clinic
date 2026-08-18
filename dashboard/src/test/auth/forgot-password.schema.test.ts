import { describe, it, expect } from "vitest";
import { forgotPasswordSchema } from "@/lib/auth/schemas/forgot-password.schema";

describe("forgotPasswordSchema", () => {
  it("rejects an empty email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("auth.errors.emailRequired");
    }
  });

  it("rejects a missing email", () => {
    const result = forgotPasswordSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("auth.errors.invalidEmail");
    }
  });

  it("rejects email-like strings that are not valid", () => {
    const result = forgotPasswordSchema.safeParse({ email: "user@" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((i) => i.message);
      expect(messages).toContain("auth.errors.invalidEmail");
    }
  });

  it("accepts a valid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("trims whitespace from email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "  user@example.com  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects unicode-only domain emails (default Zod v4 behavior)", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "user@münchen.de",
    });
    expect(result.success).toBe(false);
  });
});
