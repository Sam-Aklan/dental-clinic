import { beforeEach, describe, expect, it, vi } from "vitest";
import { clinicSettingsBookingApiFixture, clinicSettingsBookingFixture, clinicSettingsHolidayEnvelope, clinicSettingsHolidayFixture, clinicSettingsUpdateBookingPayload, clinicSettingsUpdateWorkingHoursPayload, clinicSettingsWorkingHoursEnvelope } from "./clinic-settings.fixtures";

const mocks = vi.hoisted(() => ({
	get: vi.fn(),
	patch: vi.fn(),
	put: vi.fn(),
	post: vi.fn(),
	delete: vi.fn(),
}));

vi.mock("@/lib/axios-instance", () => ({
	api: {
		get: mocks.get,
		patch: mocks.patch,
		put: mocks.put,
		post: mocks.post,
		delete: mocks.delete,
	},
}));

import { addHolidayClosure, deleteHolidayClosure, getClinicBookingSettings, getHolidayClosures, getWeeklyHours, updateClinicBookingSettings, updateWeeklyHours } from "@/lib/clinic-settings";

describe("clinic settings api", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("loads booking rules from clinic config", async () => {
		mocks.get.mockResolvedValueOnce({ data: clinicSettingsBookingApiFixture });

		await expect(getClinicBookingSettings()).resolves.toEqual(clinicSettingsBookingFixture);
		expect(mocks.get).toHaveBeenCalledWith("/clinic-config");
	});

	it("updates booking rules with frontend field names mapped to backend fields", async () => {
		mocks.patch.mockResolvedValueOnce({ data: clinicSettingsBookingApiFixture });

		await expect(updateClinicBookingSettings(clinicSettingsUpdateBookingPayload)).resolves.toEqual(clinicSettingsBookingFixture);
		expect(mocks.patch).toHaveBeenCalledWith("/clinic-config", {
			slotDurationMinutes: 30,
			timeZone: "UTC",
			reminderHoursBefore: 24,
			offerWindowMinutes: 60,
			minArrivalMinutes: 15,
		});
	});

	it("loads weekly hours from the working-hours endpoint", async () => {
		mocks.get.mockResolvedValueOnce(clinicSettingsWorkingHoursEnvelope);

		await expect(getWeeklyHours()).resolves.toEqual(clinicSettingsWorkingHoursEnvelope.data);
		expect(mocks.get).toHaveBeenCalledWith("/clinic-config/working-hours");
	});

	it("sends a full weekly-hours payload on update", async () => {
		mocks.patch.mockResolvedValueOnce({ data: clinicSettingsWorkingHoursEnvelope.data });

		await expect(updateWeeklyHours(clinicSettingsUpdateWorkingHoursPayload)).resolves.toEqual(clinicSettingsWorkingHoursEnvelope.data);
		expect(mocks.patch).toHaveBeenCalledWith("/clinic-config/working-hours", clinicSettingsUpdateWorkingHoursPayload);
	});

	it("loads and mutates holiday closures at the holidays endpoint", async () => {
		mocks.get.mockResolvedValueOnce(clinicSettingsHolidayEnvelope);
		mocks.post.mockResolvedValueOnce({ data: clinicSettingsHolidayFixture });
		mocks.delete.mockResolvedValueOnce({ data: {} });

		await expect(getHolidayClosures()).resolves.toEqual(clinicSettingsHolidayEnvelope.data);
		await expect(addHolidayClosure({ date: clinicSettingsHolidayFixture.date, name: clinicSettingsHolidayFixture.name })).resolves.toEqual(clinicSettingsHolidayFixture);
		await expect(deleteHolidayClosure(clinicSettingsHolidayFixture.id)).resolves.toBeUndefined();
		expect(mocks.get).toHaveBeenCalledWith("/clinic-config/holidays");
		expect(mocks.post).toHaveBeenCalledWith("/clinic-config/holidays", { date: clinicSettingsHolidayFixture.date, name: clinicSettingsHolidayFixture.name });
		expect(mocks.delete).toHaveBeenCalledWith("/clinic-config/holidays/holiday-1");
	});
});
