import type { AvailableSlotDTO, DoctorDirectoryItemDTO, StaffCreatedAppointmentDTO, StaffPatientSearchDTO } from "@/types";

export function createWalkInPatient(overrides: Partial<StaffPatientSearchDTO> = {}): StaffPatientSearchDTO {
	return {
		id: "patient-1",
		firstName: "Sara",
		lastName: "Ahmed",
		email: "sara@example.com",
		phone: "+966500000000",
		dateOfBirth: "1990-01-01",
		isActive: true,
		lastAppointmentAt: null,
		nextAppointmentAt: null,
		...overrides,
	};
}

export function createWalkInDoctor(overrides: Partial<DoctorDirectoryItemDTO> = {}): DoctorDirectoryItemDTO {
	return {
		id: "doctor-1",
		firstName: "Omar",
		lastName: "Ali",
		specialization: "General Dentistry",
		bio: "Experienced clinician",
		isActive: true,
		...overrides,
	};
}

export function createWalkInSlot(overrides: Partial<AvailableSlotDTO> = {}): AvailableSlotDTO {
	return {
		startsAt: "2026-05-10T07:00:00.000Z",
		endsAt: "2026-05-10T07:30:00.000Z",
		doctorId: "doctor-1",
		status: "available",
		...overrides,
	};
}

export function createWalkInAppointment(overrides: Partial<StaffCreatedAppointmentDTO> = {}): StaffCreatedAppointmentDTO {
	return {
		id: "appointment-1",
		patientId: "patient-1",
		doctorId: "doctor-1",
		startsAt: "2026-05-10T07:00:00.000Z",
		endsAt: "2026-05-10T07:30:00.000Z",
		status: "PENDING",
		bookedByRole: "RECEPTIONIST",
		notes: null,
		...overrides,
	};
}
