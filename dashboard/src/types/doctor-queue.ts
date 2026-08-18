export type AppointmentStatus =
	| "PENDING"
	| "CONFIRMED"
	| "IN_PROGRESS"
	| "COMPLETED"
	| "NO_SHOW"
	| "CANCELED";

export interface DoctorQueueAppointment {
	id: string;
	position: number;
	queuePosition?: number;
	patientName?: string | null;
	followUpId?: string | null;
	needsFollowUp: boolean;
	patient?: {
		id?: string;
		firstName?: string | null;
		lastName?: string | null;
		fullName?: string | null;
	} | null;
	startsAt: string;
	endsAt: string;
	status: AppointmentStatus;
	notes: string | null;
	updatedAt: string;
}

export interface DoctorQueueSummary {
	inSession: number;
	waiting: number;
	upcoming: number;
	completed: number;
	noShow: number;
}

export type DoctorQueueSectionKey = "inSession" | "waiting" | "upcoming" | "followUp" | "finished";

export interface DoctorQueueSection {
	key: DoctorQueueSectionKey;
	appointments: DoctorQueueAppointment[];
}

export interface DoctorQueueFilterState {
	statuses: AppointmentStatus[];
	showFinished: boolean;
}

export interface AppointmentNoteFormValues {
	notes: string;
}

export type SocketConnectionState = "connected" | "reconnecting" | "disconnected" | "offline";

export interface ClinicConfigDTO {
	timezone: string;
}

export interface UpdateNoteResponseDTO {
	id: string;
	notes: string | null;
	updatedAt: string;
}
