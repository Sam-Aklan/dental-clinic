import { describe, expect, it } from "vitest";
import { getJoinableDoctors, isDoctorJoinable, filterJoinableDoctors } from "@/lib/waitlist";
import { createWaitlistEntry, createWaitlistDoctor } from "@/test/waitlist/fixtures";

describe("waitlist-options.helper", () => {
	const doctors = [
		createWaitlistDoctor({ id: "doc-1" }),
		createWaitlistDoctor({ id: "doc-2", firstName: "Nour" }),
		createWaitlistDoctor({ id: "doc-3", firstName: "Sara" }),
	];

	it("joinable: all doctors are available when no active entries", () => {
		expect(filterJoinableDoctors(doctors, [])).toHaveLength(3);
	});

	it("joinable: excludes doctors that are already in active entries", () => {
		const entries = [createWaitlistEntry({ doctorId: "doc-1" })];
		const result = filterJoinableDoctors(doctors, entries);
		expect(result).toHaveLength(2);
		expect(result.every((d) => d.id !== "doc-1")).toBe(true);
	});

	it("joinable: marks joined doctor as false", () => {
		const entries = [createWaitlistEntry({ doctorId: "doc-1" })];
		expect(isDoctorJoinable("doc-1", entries)).toBe(false);
		expect(isDoctorJoinable("doc-2", entries)).toBe(true);
	});

	it("joinable: all joinable when entries list is empty", () => {
		expect(isDoctorJoinable("doc-1", [])).toBe(true);
	});

	it("preselection: finds a doctor by id when joinable", () => {
		const preselected = getJoinableDoctors(doctors, []).find((d) => d.id === "doc-2");
		expect(preselected).toBeDefined();
	});

	it("preselection: returns null when preselected doctor is already joined", () => {
		const entries = [createWaitlistEntry({ doctorId: "doc-2" })];
		const preselected = getJoinableDoctors(doctors, entries).find((d) => d.id === "doc-2");
		expect(preselected).toBeUndefined();
	});

	it("preselection: returns null when preselected doctor is not in the list", () => {
		const preselected = getJoinableDoctors(doctors, []).find((d) => d.id === "nonexistent");
		expect(preselected).toBeUndefined();
	});
});
