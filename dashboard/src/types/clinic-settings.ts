export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ClinicBookingSettingsDTO {
	id: string;
	slotDurationMinutes: number;
	timeZone: string;
	reminderHoursBefore: number;
	waitlistOfferWindowMinutes: number;
	minArrivalBufferMinutes: number | null;
	updatedAt: string;
}

export interface WorkingHourDTO {
	id: string;
	dayOfWeek: DayOfWeek;
	startTime: string | null;
	endTime: string | null;
	isClosed: boolean;
}

export interface HolidayClosureDTO {
	id: string;
	date: string;
	name: string;
	createdAt: string;
}

export interface UpdateClinicSettingsPayload {
	slotDurationMinutes?: number;
	timeZone?: string;
	reminderHoursBefore?: number;
	waitlistOfferWindowMinutes?: number;
	minArrivalBufferMinutes?: number;
}

export type UpdateWeeklyHoursPayload = Array<{
	dayOfWeek: DayOfWeek;
	isClosed: boolean;
	startTime: string | null;
	endTime: string | null;
}>;

export interface AddHolidayPayload {
	date: string;
	name: string;
}

export interface BookingRulesFormValues {
	timeZone: string;
	slotDurationMinutes: number;
	reminderHoursBefore: number;
	waitlistOfferWindowMinutes: number;
	minArrivalBufferMinutes?: number;
}

export interface WeekdayRowValues {
	dayOfWeek: DayOfWeek;
	isClosed: boolean;
	startTime: string;
	endTime: string;
}

export interface WeeklyScheduleFormValues {
	weekdays: WeekdayRowValues[];
}

export interface AddHolidayFormValues {
	date: string;
	name: string;
}
