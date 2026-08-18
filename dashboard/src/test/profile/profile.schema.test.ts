import { describe, it, expect } from "vitest";
import { profileSchema, type ProfileFormValues } from "@/lib/profile/schemas/profile.schema";

describe("profileSchema", () => {
  function validForm(): ProfileFormValues {
    return {
      firstName: "Amina",
      lastName: "Saleh",
      preferredLocale: "EN",
    };
  }

  it("accepts valid profile data", () => {
    const result = profileSchema.safeParse(validForm());
    expect(result.success).toBe(true);
  });

  it("accepts valid profile data with optional phone and dateOfBirth", () => {
    const result = profileSchema.safeParse({
      ...validForm(),
      phoneNumber: "+962-79-1234567",
      dateOfBirth: "1990-03-15",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty first name", () => {
    const result = profileSchema.safeParse({
      ...validForm(),
      firstName: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("profile.errors.firstNameRequired");
    }
  });

  it("rejects empty last name", () => {
    const result = profileSchema.safeParse({
      ...validForm(),
      lastName: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("profile.errors.lastNameRequired");
    }
  });

  it("rejects invalid phone format", () => {
    const result = profileSchema.safeParse({
      ...validForm(),
      phoneNumber: "abc",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("profile.errors.invalidPhone");
    }
  });

  it("accepts empty phone number as valid", () => {
    const result = profileSchema.safeParse({
      ...validForm(),
      phoneNumber: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid date of birth", () => {
    const result = profileSchema.safeParse({
      ...validForm(),
      dateOfBirth: "3000-01-01",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("profile.errors.invalidDOB");
    }
  });

  it("rejects non-date string as dateOfBirth", () => {
    const result = profileSchema.safeParse({
      ...validForm(),
      dateOfBirth: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid preferredLocale", () => {
    const result = profileSchema.safeParse({
      ...validForm(),
      preferredLocale: "FR",
    });
    expect(result.success).toBe(false);
  });

  it("accepts AR as preferredLocale", () => {
    const result = profileSchema.safeParse({
      ...validForm(),
      preferredLocale: "AR",
    });
    expect(result.success).toBe(true);
  });
});
