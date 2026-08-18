import type { AppointmentStatus, DoctorQueueAppointment, StaffQueueAppointmentDTO } from "@/types";
import type { FollowUpSourceAppointment } from "@/types";

export function canScheduleFollowUp(status: AppointmentStatus) {
	return status === "COMPLETED";
}

export function isFollowUpActionEligible(appointment: { status: AppointmentStatus; needsFollowUp: boolean; followUpId?: string | null }) {
	return canScheduleFollowUp(appointment.status) && appointment.needsFollowUp && !appointment.followUpId;
}

export function isValidFollowUpSourceIdentifier(value: unknown): value is string {
	return typeof value === "string" && value.trim().length > 0;
}

export function getFollowUpSourceDisplayName(firstName?: string | null, lastName?: string | null, fullName?: string | null, fallbackId?: string) {
	const name = [firstName, lastName].filter(Boolean).join(" ").trim() || fullName?.trim() || "";
	return name || fallbackId || "";
}

export function createFollowUpSourceAppointment(source: Pick<FollowUpSourceAppointment, "id" | "patientId" | "doctorId" | "startsAt" | "endsAt" | "status" | "patientName" | "doctorName">): FollowUpSourceAppointment {
	return source;
}

export function mapDoctorQueueAppointmentToFollowUpSource(appointment: DoctorQueueAppointment, doctorId?: string | null, doctorName?: string | null): FollowUpSourceAppointment | null {
	const patientId = appointment.patient?.id;
	if (!isFollowUpActionEligible(appointment) || !isValidFollowUpSourceIdentifier(patientId) || !isValidFollowUpSourceIdentifier(appointment.id) || !isValidFollowUpSourceIdentifier(doctorId)) {
		return null;
	}

	const patientName = getFollowUpSourceDisplayName(appointment.patient?.firstName, appointment.patient?.lastName, appointment.patient?.fullName, appointment.patientName ?? undefined);
	return {
		id: appointment.id,
		patientId,
		doctorId,
		startsAt: appointment.startsAt,
		endsAt: appointment.endsAt,
		status: "COMPLETED",
		patientName,
		doctorName: doctorName?.trim() || doctorId,
	};
}

export function mapStaffQueueAppointmentToFollowUpSource(appointment: StaffQueueAppointmentDTO): FollowUpSourceAppointment | null {
	if (!isFollowUpActionEligible(appointment) || !isValidFollowUpSourceIdentifier(appointment.patient?.id) || !isValidFollowUpSourceIdentifier(appointment.doctor.id) || !isValidFollowUpSourceIdentifier(appointment.id)) {
		return null;
	}

	return {
		id: appointment.id,
		patientId: appointment.patient.id,
		doctorId: appointment.doctor.id,
		startsAt: appointment.startsAt,
		endsAt: appointment.endsAt,
		status: "COMPLETED",
		patientName: getFollowUpSourceDisplayName(appointment.patient.firstName, appointment.patient.lastName, undefined, appointment.patient.id),
		doctorName: getFollowUpSourceDisplayName(appointment.doctor.firstName, appointment.doctor.lastName, undefined, appointment.doctor.id),
	};
}
