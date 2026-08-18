import type { AddHolidayPayload, ClinicBookingSettingsDTO, HolidayClosureDTO, UpdateClinicSettingsPayload, UpdateWeeklyHoursPayload, WorkingHourDTO } from "@/types";

export const clinicSettingsBookingFixture: ClinicBookingSettingsDTO = {
	id: "clinic-config-1",
	slotDurationMinutes: 30,
	timeZone: "UTC",
	reminderHoursBefore: 24,
	waitlistOfferWindowMinutes: 60,
	minArrivalBufferMinutes: 15,
	updatedAt: "2026-05-10T10:00:00.000Z",
};

export const clinicSettingsBookingApiFixture = {
	id: "clinic-config-1",
	slotDurationMinutes: 30,
	timeZone: "UTC",
	reminderHoursBefore: 24,
	offerWindowMinutes: 60,
	minArrivalMinutes: 15,
	updatedAt: "2026-05-10T10:00:00.000Z",
};

export const clinicSettingsWorkingHoursFixture: WorkingHourDTO[] = Array.from({ length: 7 }, (_, dayOfWeek) => ({
	id: `working-hour-${dayOfWeek}`,
	dayOfWeek: dayOfWeek as WorkingHourDTO["dayOfWeek"],
	isClosed: dayOfWeek === 0 || dayOfWeek === 6,
	startTime: dayOfWeek === 0 || dayOfWeek === 6 ? null : "08:00",
	endTime: dayOfWeek === 0 || dayOfWeek === 6 ? null : "16:00",
}));

export const clinicSettingsHolidayFixture: HolidayClosureDTO = {
	id: "holiday-1",
	date: "2026-05-10",
	name: "Founding Day",
	createdAt: "2026-01-01T00:00:00.000Z",
};

export const clinicSettingsHolidayListFixture: HolidayClosureDTO[] = [clinicSettingsHolidayFixture];

export const clinicSettingsBookingEnvelope = { data: clinicSettingsBookingFixture };
export const clinicSettingsWorkingHoursEnvelope = { data: clinicSettingsWorkingHoursFixture };
export const clinicSettingsHolidayEnvelope = { data: clinicSettingsHolidayListFixture };

export const clinicSettingsUpdateBookingPayload: UpdateClinicSettingsPayload = {
	slotDurationMinutes: 30,
	timeZone: "UTC",
	reminderHoursBefore: 24,
	waitlistOfferWindowMinutes: 60,
	minArrivalBufferMinutes: 15,
};

export const clinicSettingsUpdateWorkingHoursPayload: UpdateWeeklyHoursPayload = clinicSettingsWorkingHoursFixture.map((row) => ({
		dayOfWeek: row.dayOfWeek,
		isClosed: row.isClosed,
		startTime: row.startTime,
		endTime: row.endTime,
	}));

export const clinicSettingsAddHolidayPayload: AddHolidayPayload = {
	date: clinicSettingsHolidayFixture.date,
	name: clinicSettingsHolidayFixture.name,
};
