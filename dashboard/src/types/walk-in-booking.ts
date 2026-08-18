import type { AppointmentStatus } from "./appointments";

export interface WalkInBookingState {
	patientId: string | null;
	doctorId: string | null;
	selectedDate: string;
	selectedSlotStart: string | null;
}

export interface StaffCreateAppointmentDTO {
	patientId: string;
	doctorId: string;
	startsAt: string;
}

export interface StaffCreatedAppointmentDTO {
	id: string;
	patientId: string;
	doctorId: string;
	startsAt: string;
	endsAt: string;
	status: AppointmentStatus;
	needsFollowUp: boolean;
	bookedByRole: "RECEPTIONIST" | "ADMIN";
	notes: string | null;
}

export interface StaffBookingSummaryState {
	patientName: string | null;
	doctorName: string | null;
	doctorSpecialization: string | null;
	selectedDateFormatted: string | null;
	selectedTimeFormatted: string | null;
	timezone: string;
	canConfirm: boolean;
}
