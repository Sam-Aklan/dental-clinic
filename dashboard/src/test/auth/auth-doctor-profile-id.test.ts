import { describe, expect, it } from "vitest";
import type { CurrentUserResponse, User } from "@/types";

describe("auth doctorProfileId contract", () => {
	it("accepts doctorProfileId in the session user shape", () => {
		const user: User = {
			id: "user-1",
			email: "doctor@example.com",
			role: "DOCTOR",
			isActive: true,
			firstName: "Sara",
			lastName: "Ahmed",
			preferredLocale: "EN",
			doctorProfileId: "doctor-1",
		};

		const response: CurrentUserResponse = { data: user };

		expect(response.data.doctorProfileId).toBe("doctor-1");
	});

	it("keeps doctorProfileId nullable for non-doctor users", () => {
		const user: User = {
			id: "user-2",
			email: "patient@example.com",
			role: "PATIENT",
			isActive: true,
			firstName: "Omar",
			lastName: "Hassan",
			preferredLocale: "AR",
		};

		const response: CurrentUserResponse = { data: user };

		expect(response.data.doctorProfileId ?? null).toBeNull();
	});
});
