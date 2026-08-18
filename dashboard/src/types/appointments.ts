export type AppointmentStatus =
	| "PENDING"
	| "CONFIRMED"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "CANCELED"
	| "NO_SHOW";

export type AppointmentTab = "upcoming" | "past" | "canceled";

export interface AppointmentDoctor {
	id: string;
	firstName: string;
	lastName: string;
	specialization: string | null;
}

export interface PatientAppointment {
	id: string;
	patientId?: string;
	doctorId: string;
	startsAt: string;
	endsAt: string;
	status: AppointmentStatus;
	needsFollowUp: boolean;
	createdAt: string;
	updatedAt?: string;
	cancellationReason?: string | null;
	notes?: string | null;
	doctor: AppointmentDoctor;
}

export interface AppointmentListResult {
	items: PatientAppointment[];
	page: number;
	pageSize: number;
	total: number;
}

export interface AppointmentFilterState {
	tab: AppointmentTab;
	doctorId: string | null;
	statuses: AppointmentStatus[];
	page: number;
	createdAppointmentId: string | null;
	sortBy: "startsAt" | "createdAt";
	sortDir: "asc" | "desc";
}

export interface AppointmentListParams {
	tab: AppointmentTab;
	doctorId: string | null;
	statuses: AppointmentStatus[];
	page: number;
	pageSize: number;
	sortBy: "startsAt" | "createdAt";
	sortDir: "asc" | "desc";
	from: string | null;
	to: string | null;
}

export type CancelAppointmentErrorCode = "not-owned" | "too-late" | "already-canceled" | "network";

export interface CancelAppointmentResult {
	appointmentId: string;
	success: true;
}
