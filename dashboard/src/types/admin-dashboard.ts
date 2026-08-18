import type { AppointmentStatus } from "./appointments";
import type { SortDir } from "./staff-appointments";

export type TrendBucket = "day" | "week" | "month";
export type AdminDashboardBucket = TrendBucket | "auto";
export type DashboardTab = "appointments" | "follow-ups" | "waitlist";
export type AdminAppointmentSortField = "startsAt" | "status" | "createdAt" | "doctorName";

export interface AdminDashboardDateRange {
	from: string;
	to: string;
}

export interface AdminDashboardUrlState {
	from: string;
	to: string;
	bucket: AdminDashboardBucket;
	tab: DashboardTab;
	doctorId: string;
	status: AppointmentStatus | "";
	patientName: string;
	thresholdDays: number;
	page: number;
	sortBy: AdminAppointmentSortField;
	sortDir: SortDir;
}

export interface AdminKpiSummaryDTO {
	totalAppointments: number;
	completed: number;
	cancellationRate: number;
	noShowRate: number;
	activePatients: number;
	waitlistSize: number;
	deltaTotalPct?: number | null;
	deltaCompletedPct?: number | null;
}

export interface AppointmentTrendPointDTO {
	date: string;
	total: number;
	confirmed: number;
	completed: number;
	canceled: number;
	noShow: number;
}

export interface StatusDistributionDTO {
	PENDING: number;
	CONFIRMED: number;
	IN_PROGRESS: number;
	COMPLETED: number;
	CANCELED: number;
	NO_SHOW: number;
}

export interface DoctorUtilizationDTO {
	doctorId: string;
	doctorName: string;
	bookedSlots: number;
	totalSlots: number;
	utilizationPct: number;
}

export interface WeekdayAppointmentDTO {
	dayOfWeek: number;
	label: string;
	count: number;
}

export interface CancellationTrendPointDTO {
	date: string;
	canceledByPatient: number;
	canceledByStaff: number;
	noShow: number;
}

export interface AdminAppointmentRowDTO {
	id: string;
	startsAt: string;
	endsAt: string;
	status: AppointmentStatus;
	needsFollowUp: boolean;
	createdAt: string;
	patient: { id: string; firstName: string; lastName: string };
	doctor: { id: string; firstName: string; lastName: string };
}

export interface FollowUpRowDTO {
	patientId: string;
	patientName: string;
	lastAppointmentDate: string;
	daysSince: number;
	hasUpcoming: boolean;
}

export interface WaitlistAdminRowDTO {
	id: string;
	position: number;
	patient: { id: string; firstName: string; lastName: string };
	doctor: { id: string; firstName: string; lastName: string };
	availableFrom?: string | null;
	availableUntil?: string | null;
	createdAt: string;
}

export interface WaitlistSummaryByDoctorDTO {
	doctorId: string;
	doctorName: string;
	count: number;
}

export interface WaitlistSummaryDTO {
	totalActive: number;
	byDoctor: WaitlistSummaryByDoctorDTO[];
}

export interface PaginatedResponse<T> {
	data: T[];
	total: number;
	page: number;
	pageSize: number;
}

export interface AdminAppointmentsFilters {
	from: string;
	to: string;
	doctorId?: string;
	status?: AppointmentStatus;
	patientName?: string;
	page: number;
	pageSize: number;
	sortBy: AdminAppointmentSortField;
	sortDir: SortDir;
}

export interface AdminFollowUpsFilters {
	thresholdDays: number;
	page: number;
	pageSize: number;
}

export interface AdminWaitlistFilters {
	page: number;
	pageSize: number;
}

export interface AdminAppointmentsExportFilters {
	from: string;
	to: string;
	doctorId?: string;
	status?: AppointmentStatus;
	patientName?: string;
	sortBy?: AdminAppointmentSortField;
	sortDir?: SortDir;
}

export interface AdminDashboardQueryParams {
	from: string;
	to: string;
	bucket?: TrendBucket;
}
