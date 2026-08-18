import type { AppointmentStatus } from "./appointments";

export type FollowUpStatus = "SCHEDULED" | "COMPLETED" | "CANCELED" | "MISSED";
export type FollowUpSlotPeriod = "morning" | "afternoon" | "evening";

export interface FollowUpSourceAppointment {
	id: string;
	patientId: string;
	doctorId: string;
	startsAt: string;
	endsAt: string;
	status: Extract<AppointmentStatus, "COMPLETED">;
	patientName: string;
	doctorName: string;
}

export interface CreateFollowUpRequest {
	patientId: string;
	doctorId: string;
	startsAt: string;
	reason: string;
	notes?: string;
	sourceAppointmentId?: string;
}

export interface FollowUpResponse {
	id: string;
	patientId: string;
	patientName: string;
	doctorId: string;
	doctorName: string;
	appointmentId: string;
	sourceAppointmentId: string | null;
	sourceAppointmentNeedsFollowUp: boolean | null;
	followUpAt: string;
	followUpEndsAt: string;
	reason: string;
	notes: string | null;
	status: FollowUpStatus;
	scheduledById: string;
	cancellationReason: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AvailableSlot {
	startsAt: string;
	endsAt: string;
	doctorId: string;
}

export interface FollowUpSlotGroup {
	period: FollowUpSlotPeriod;
	slots: AvailableSlot[];
}

export interface FollowUpScheduleFormValues {
	slotStartsAt: string;
	reason: string;
	notes?: string;
}
