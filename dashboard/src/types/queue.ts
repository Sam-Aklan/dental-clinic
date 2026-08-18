import type { AppointmentStatus } from "./appointments";

export type { AppointmentStatus };

export type ConnectionStatus = "connected" | "reconnecting" | "offline";

export interface QueueItem {
	appointmentId: string;
	position: number | null;
	status: AppointmentStatus;
	needsFollowUp: boolean;
	startsAt: string;
	endsAt: string;
	notes: string | null;
}

export interface QueueSnapshotEvent {
	doctorId: string;
	date?: string;
	doctorDisplayName?: string;
	items: QueueItem[];
}

export interface QueueUpdatedEvent extends QueueItem {
	doctorId: string;
	updatedAt: string;
}

export interface QueueRemovedEvent {
	appointmentId: string;
	doctorId: string;
}

export interface SocketExceptionEvent {
	status: "error";
	message: string;
}

export interface StaffQueueAppointmentDTO {
	id: string;
	position?: number;
	startsAt: string;
	endsAt: string;
	status: AppointmentStatus;
	needsFollowUp: boolean;
	followUpId?: string | null;
	bookedByRole: "PATIENT" | "RECEPTIONIST" | "ADMIN";
	createdAt: string;
	patient: {
		id: string;
		firstName: string;
		lastName: string;
		phone: string | null;
	};
	doctor: {
		id: string;
		firstName: string;
		lastName: string;
		specialization: string | null;
	};
}

export interface TodaySummaryDTO {
	total: number;
	inProgress: number;
	waiting: number;
	completed: number;
	canceledToday: number;
	noShow: number;
	pendingConfirmation: number;
}

export interface TodayByDoctorDTO {
	doctorId: string;
	doctorName: string;
	confirmed: number;
	inProgress: number;
	completed: number;
	canceled: number;
}

export interface StaffQueueFilterState {
	doctorIds: string[];
	statuses: AppointmentStatus[];
	search: string;
}

export interface DoctorQueueGroup {
	doctorId: string;
	doctorName: string;
	appointments: StaffQueueAppointmentDTO[];
}

export interface StaffQueueQueryParams extends StaffQueueFilterState {
	date: string;
}

export interface UpdateAppointmentStatusBody {
	status: AppointmentStatus;
	needsFollowUp?: boolean;
}

export interface CancelStaffAppointmentBody {
	reason?: string;
}

export interface IssueKioskTokenPayload {
	doctorId: string;
	expiresInDays?: number;
}

export interface IssuedKioskTokenDTO {
	token: string;
	doctorId: string;
	expiresAt: string;
	lobbyUrl: string;
}
