import { describe, it, expect } from "vitest";
import { patientsUrlStateSchema } from "@/lib/patients";

describe("patientsUrlStateSchema", () => {
  it("returns defaults for an empty object", () => {
    const result = patientsUrlStateSchema.parse({});
    expect(result.q).toBe("");
    expect(result.status).toEqual([]);
    expect(result.page).toBe(1);
    expect(result.patientId).toBeUndefined();
    expect(result.from).toBeUndefined();
    expect(result.to).toBeUndefined();
  });

  it("parses a valid full URL state", () => {
    const result = patientsUrlStateSchema.parse({
      q: "Sara",
      patientId: "patient-1",
      status: ["COMPLETED", "CANCELED"],
      from: "2026-01-01",
      to: "2026-06-01",
      page: "2",
    });
    expect(result.q).toBe("Sara");
    expect(result.patientId).toBe("patient-1");
    expect(result.status).toEqual(["COMPLETED", "CANCELED"]);
    expect(result.from).toBe("2026-01-01");
    expect(result.to).toBe("2026-06-01");
    expect(result.page).toBe(2);
  });

  it("coerces string page to number", () => {
    const result = patientsUrlStateSchema.parse({ page: "3" });
    expect(result.page).toBe(3);
  });

  it("defaults page to 1 for invalid values", () => {
    const result = patientsUrlStateSchema.parse({ page: "0" });
    expect(result.page).toBe(1);
  });

  it("defaults page to 1 for negative values", () => {
    const result = patientsUrlStateSchema.parse({ page: "-5" });
    expect(result.page).toBe(1);
  });

  it("preserves patientId when set", () => {
    const result = patientsUrlStateSchema.parse({ patientId: "patient-1" });
    expect(result.patientId).toBe("patient-1");
  });

  it("accepts empty status array", () => {
    const result = patientsUrlStateSchema.parse({ status: [] });
    expect(result.status).toEqual([]);
  });

  it("accepts single status as array", () => {
    const result = patientsUrlStateSchema.parse({ status: ["COMPLETED"] });
    expect(result.status).toEqual(["COMPLETED"]);
  });

  it("validates status values are valid AppointmentStatus enums", () => {
    const result = patientsUrlStateSchema.parse({ status: ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED", "NO_SHOW"] });
    expect(result.status).toEqual(["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED", "NO_SHOW"]);
  });

  it("rejects invalid status values", () => {
    const result = patientsUrlStateSchema.safeParse({ status: ["INVALID_STATUS"] });
    expect(result.success).toBe(false);
  });

  it("accepts patientId as optional", () => {
    const result = patientsUrlStateSchema.parse({});
    expect(result.patientId).toBeUndefined();
  });
});
