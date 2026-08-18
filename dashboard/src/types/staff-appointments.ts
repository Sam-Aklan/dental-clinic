import type { AppointmentStatus } from "./appointments";

export type StaffAppointmentTab = "today" | "upcoming" | "waitlist";
export type AppointmentSortField = "startsAt" | "doctor" | "status" | "createdAt";
export type SortDir = "asc" | "desc";

export interface StaffAppointmentDTO {
	id: string;
	startsAt: string;
	endsAt: string;
	status: AppointmentStatus;
	needsFollowUp: boolean;
	createdAt: string;
	bookedByRole: "PATIENT" | "RECEPTIONIST" | "ADMIN";
	cancellationReason: string | null;
	patient: {
		id: string;
		firstName: string;
		lastName: string;
		phone: string | null;
		email: string | null;
	};
	doctor: {
		id: string;
		firstName: string;
		lastName: string;
		specialization: string | null;
	};
}

export interface StaffWaitlistEntryDTO {
	id: string;
	position: number;
	availableFrom: string | null;
	availableUntil: string | null;
	createdAt: string;
	patient: {
		id: string;
		firstName: string;
		lastName: string;
		phone: string | null;
		email: string | null;
	};
	doctor: {
		id: string;
		firstName: string;
		lastName: string;
		specialization: string | null;
	};
}

export interface SlotDTO {
	startsAt: string;
	endsAt: string;
	doctorId: string;
}

export interface StaffAppointmentFilters {
  tab?: StaffAppointmentTab;
	date?: string;
	from?: string;
	to?: string;
	doctorId?: string[];
	status?: AppointmentStatus[];
	patientName?: string;
	page?: number;
	pageSize?: number;
	sortBy?: AppointmentSortField;
	sortDir?: SortDir;
}

export interface StaffWaitlistFilters {
	doctorId?: string;
	page?: number;
	pageSize?: number;
}

export interface AppointmentUrlState {
	tab: StaffAppointmentTab;
	from: string | null;
	to: string | null;
	doctorIds: string[];
	statuses: AppointmentStatus[];
	patientName: string;
	page: number;
	sortBy: AppointmentSortField;
	sortDir: SortDir;
}

export interface RescheduleAppointmentDTO {
	startsAt: string;
	cancellationReason?: string;
}

export interface StaffCancelAppointmentDTO {
	reason: string;
}

export interface UpdateStatusDTO {
	status: AppointmentStatus;
	needsFollowUp?: boolean;
}

export interface ExportAppointmentsParams extends Omit<StaffAppointmentFilters, "tab" | "page" | "pageSize"> {
	format: "csv";
}
