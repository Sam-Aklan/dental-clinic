import type { AppointmentStatus } from "./appointments";

export interface DoctorDirectoryItemDTO {
	id: string;
	firstName: string;
	lastName: string;
	specialization: string | null;
	bio: string | null;
	isActive: boolean;
}

export interface AvailableSlotDTO {
	startsAt: string;
	endsAt: string;
	doctorId: string;
	status: "available" | "reserved";
}

export interface AppointmentDTO {
	id: string;
	doctorId: string;
	patientId: string;
	startsAt: string;
	endsAt: string;
	status: AppointmentStatus;
	needsFollowUp: boolean;
	createdAt: string;
	updatedAt: string;
	cancellationReason: string | null;
	notes: string | null;
	doctor: {
		id: string;
		firstName: string;
		lastName: string;
		specialization: string | null;
	};
	patient: {
		id: string;
		firstName: string;
		lastName: string;
	};
}

export interface CreateAppointmentDTO {
	doctorId: string;
	startsAt: string;
}

export interface BookingSelectionState {
	doctorId: string | null;
	selectedDate: string;
	selectedSlotStart: string | null;
}

export type SlotGroupLabel = "morning" | "afternoon" | "evening";

export interface SlotGroup {
	label: SlotGroupLabel;
	i18nKey: string;
	slots: AvailableSlotDTO[];
}

export interface BookingSummaryState {
	doctorName: string | null;
	doctorSpecialization: string | null;
	selectedDateFormatted: string | null;
	selectedTimeFormatted: string | null;
	canConfirm: boolean;
}

export interface SlotsQueryParams {
	doctorId: string;
	from: string;
	to: string;
	includeReserved?: boolean;
}
