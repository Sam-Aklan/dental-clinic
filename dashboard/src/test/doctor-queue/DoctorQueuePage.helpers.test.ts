import { describe, expect, it } from "vitest";
import dayjs from "dayjs";
import { appointmentNoteSchema, buildDoctorQueueSections, buildDoctorQueueSummary, createDoctorQueueSearchPatch, formatDoctorQueueNotePreview, formatDoctorQueuePatientLabel, parseDoctorQueueFilters } from "@/lib/doctor-queue";
import { doctorQueueFixtures } from "./fixtures";

describe("doctor queue helpers", () => {
	it("groups appointments and derives summary counts", () => {
		const summary = buildDoctorQueueSummary(doctorQueueFixtures.currentDayAppointments, dayjs("2026-05-11T08:00:00.000Z"));
		expect(summary.inSession).toBe(1);
		expect(summary.waiting).toBe(2);
		expect(summary.upcoming).toBe(1);
		expect(summary.completed).toBe(2);
		expect(summary.noShow).toBe(1);
	});

	it("builds sections with finished visibility controls", () => {
		const sections = buildDoctorQueueSections(doctorQueueFixtures.currentDayAppointments, doctorQueueFixtures.defaultFilters, dayjs("2026-05-11T08:00:00.000Z"));
		expect(sections.map((section) => section.key)).toEqual(["inSession", "waiting", "upcoming", "followUp", "finished"]);
		expect(sections[0].appointments).toHaveLength(1);
		expect(sections[1].appointments).toHaveLength(2);
		expect(sections[2].appointments).toHaveLength(1);
		expect(sections[3].appointments).toHaveLength(1);
		expect(sections[4].appointments).toHaveLength(2);
	});

	it("formats privacy-safe labels and note previews", () => {
		expect(formatDoctorQueuePatientLabel(3)).toBe("#3");
		expect(formatDoctorQueueNotePreview("  hello there  ")).toBe("hello there");
		expect(formatDoctorQueueNotePreview("x".repeat(100))).toMatch(/\.\.\.$/);
	});

	it("parses and patches filters", () => {
		const parsed = parseDoctorQueueFilters({ statuses: "CONFIRMED,NO_SHOW", showFinished: "true" });
		expect(parsed).toEqual({ statuses: ["CONFIRMED", "NO_SHOW"], showFinished: true });
		expect(createDoctorQueueSearchPatch(parsed, { showFinished: false })).toEqual({ statuses: "CONFIRMED,NO_SHOW", showFinished: undefined });
	});

	it("validates note length", () => {
		expect(appointmentNoteSchema.safeParse({ notes: "ok" }).success).toBe(true);
		expect(appointmentNoteSchema.safeParse({ notes: "x".repeat(1001) }).success).toBe(false);
	});
});
