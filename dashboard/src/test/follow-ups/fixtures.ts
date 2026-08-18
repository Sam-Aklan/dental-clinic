import type { AvailableSlot, FollowUpResponse, FollowUpSourceAppointment } from "@/types";
import type { DoctorQueueAppointment } from "@/types";
import type { StaffQueueAppointmentDTO } from "@/types";

export const completedFollowUpSourceAppointment: FollowUpSourceAppointment = {
	id: "appt-src-1",
	patientId: "pat-1",
	doctorId: "doc-1",
	startsAt: "2026-06-09T08:00:00.000Z",
	endsAt: "2026-06-09T08:30:00.000Z",
	status: "COMPLETED",
	patientName: "Amina Hassan",
	doctorName: "Dr. Omar Saleh",
};

export const completedDoctorQueueAppointment: DoctorQueueAppointment = {
	id: "doctor-queue-1",
	position: 1,
	patientName: "Amina Hassan",
	patient: { id: "pat-1", firstName: "Amina", lastName: "Hassan", fullName: "Amina Hassan" },
	followUpId: null,
	needsFollowUp: true,
	startsAt: "2026-06-09T08:00:00.000Z",
	endsAt: "2026-06-09T08:30:00.000Z",
	status: "COMPLETED",
	notes: null,
	updatedAt: "2026-06-09T08:31:00.000Z",
};

export const pendingDoctorQueueAppointment: DoctorQueueAppointment = {
	...completedDoctorQueueAppointment,
	id: "doctor-queue-2",
	status: "PENDING",
	needsFollowUp: false,
};

export const completedStaffQueueAppointment: StaffQueueAppointmentDTO = {
	id: "staff-queue-1",
	startsAt: "2026-06-09T08:00:00.000Z",
	endsAt: "2026-06-09T08:30:00.000Z",
	status: "COMPLETED",
	needsFollowUp: true,
	followUpId: null,
	bookedByRole: "RECEPTIONIST",
	createdAt: "2026-06-09T07:30:00.000Z",
	patient: { id: "pat-1", firstName: "Amina", lastName: "Hassan", phone: null },
	doctor: { id: "doc-1", firstName: "Omar", lastName: "Saleh", specialization: "Orthodontics" },
};

export const pendingStaffQueueAppointment: StaffQueueAppointmentDTO = {
	...completedStaffQueueAppointment,
	id: "staff-queue-2",
	status: "CONFIRMED",
	needsFollowUp: false,
};

export const futureFollowUpSlots: AvailableSlot[] = [
	{ startsAt: "2026-06-09T07:30:00.000Z", endsAt: "2026-06-09T08:00:00.000Z", doctorId: "doc-1" },
	{ startsAt: "2026-06-09T12:30:00.000Z", endsAt: "2026-06-09T13:00:00.000Z", doctorId: "doc-1" },
	{ startsAt: "2026-06-09T17:30:00.000Z", endsAt: "2026-06-09T18:00:00.000Z", doctorId: "doc-1" },
];

export const mixedFollowUpSlots: AvailableSlot[] = [
	{ startsAt: "2026-06-08T07:30:00.000Z", endsAt: "2026-06-08T08:00:00.000Z", doctorId: "doc-1" },
	...futureFollowUpSlots,
];

export const emptyFollowUpSlots: AvailableSlot[] = [];

export const followUpSuccessResponse: FollowUpResponse = {
	id: "follow-up-1",
	patientId: "pat-1",
	patientName: "Amina Hassan",
	doctorId: "doc-1",
	doctorName: "Dr. Omar Saleh",
	appointmentId: "appointment-1",
	sourceAppointmentId: "appt-src-1",
	sourceAppointmentNeedsFollowUp: false,
	followUpAt: "2026-06-09T12:30:00.000Z",
	followUpEndsAt: "2026-06-09T13:00:00.000Z",
	reason: "Review healing",
	notes: "Bring x-ray",
	status: "SCHEDULED",
	scheduledById: "staff-1",
	cancellationReason: null,
	createdAt: "2026-06-09T09:00:00.000Z",
	updatedAt: "2026-06-09T09:00:00.000Z",
};

export const conflictError = { isAxiosError: true, response: { status: 409, data: { message: "Slot occupied" } } };
export const permissionError = { isAxiosError: true, response: { status: 403, data: { message: "Denied" } } };
export const invalidPayloadError = { isAxiosError: true, response: { status: 400, data: { message: "Bad request" } } };
export const notFoundError = { isAxiosError: true, response: { status: 404, data: { message: "Not found" } } };
export const networkError = new Error("Network error");
