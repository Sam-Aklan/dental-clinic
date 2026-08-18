import type { AppointmentStatus } from "./doctor-queue";

export type DoctorTodayAppointmentStatus = AppointmentStatus;

export interface DoctorTodayStatsDTO {
	todayTotal: number;
	completed: number;
	remaining: number;
	inSession: number;
	noShows: number;
}

export interface DoctorTodayTrendPointDTO {
	date: string;
	total: number;
	dominantStatus: DoctorTodayAppointmentStatus | null;
	confirmed: number;
	completed: number;
	canceled: number;
	noShow: number;
}

export interface DoctorTodayStatusDistributionDTO {
	status: DoctorTodayAppointmentStatus;
	count: number;
}

export interface DoctorTodayHourlyLoadDTO {
	hour: number;
	count: number;
	percentage: number;
}

export interface DoctorTodayScheduleAppointmentDTO {
	id: string;
	startsAt: string;
	endsAt: string;
	status: DoctorTodayAppointmentStatus;
	needsFollowUp: boolean;
	patientName?: string | null;
	patient?: {
		id?: string;
		firstName?: string | null;
		lastName?: string | null;
		fullName?: string | null;
	} | null;
	patientSequence: number;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface DoctorTodayFilters {
	from: string;
	to: string;
	status?: DoctorTodayAppointmentStatus[];
	page?: number;
	pageSize?: number;
	sortBy?: DoctorTodaySortField;
	sortDir?: DoctorTodaySortDir;
	isToday?: boolean;
}

export interface DoctorTodayScheduleViewState {
	date: string;
	week: string;
	tab: "today" | "thisWeek";
	status: DoctorTodayAppointmentStatus[];
	page: number;
	sortBy: DoctorTodaySortField;
	sortDir: DoctorTodaySortDir;
}

export type DoctorTodayUrlState = DoctorTodayScheduleViewState;

export interface DoctorTodayChartPoint {
	label: string;
	value: number;
	secondaryValue?: number;
}

export type DoctorTodaySortField = "startsAt" | "status" | "date";
export type DoctorTodaySortDir = "asc" | "desc";

export interface DoctorTodayPaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
}

export type DoctorTodayScheduleRow =
	| { kind: "appointment"; data: DoctorTodayScheduleAppointmentDTO }
	| { kind: "gap"; durationMinutes: number };

export interface AppointmentNotesFormValues {
	notes: string;
}
