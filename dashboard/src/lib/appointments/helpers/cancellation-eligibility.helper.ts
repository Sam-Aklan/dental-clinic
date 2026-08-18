import type { CancelAppointmentErrorCode, PatientAppointment } from "@/types";
import { APPOINTMENT_CANCELLATION_CUTOFF_HOURS } from "@/constants/appointments";

const cancelableStatuses = new Set(["PENDING", "CONFIRMED"]);

export function isAppointmentCancelable(appointment: PatientAppointment, referenceNow = new Date()) {
	if (!cancelableStatuses.has(appointment.status)) return false;
	const startTime = Date.parse(appointment.startsAt);
	return startTime - referenceNow.getTime() >= APPOINTMENT_CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;
}

export function isWithinCancellationWindow(appointment: PatientAppointment, referenceNow = new Date()) {
	if (!cancelableStatuses.has(appointment.status)) return false;
	return !isAppointmentCancelable(appointment, referenceNow);
}

export function getCancellationRestrictionMessageKey(appointment: PatientAppointment, referenceNow = new Date()) {
	if (isAppointmentCancelable(appointment, referenceNow)) return null;
	if (cancelableStatuses.has(appointment.status)) return "appointments.errors.tooLate";
	return null;
}

export function getCancelAppointmentErrorCode(error: unknown): CancelAppointmentErrorCode {
	const axiosError = error as { response?: { status?: number; data?: { code?: string } } };
	const status = axiosError?.response?.status;
	const code = axiosError?.response?.data?.code;

	if (!status) return "network";
	if (status === 403) return "not-owned";
	if (code === "APPOINTMENT_ALREADY_CANCELED") return "already-canceled";
	if (code === "APPOINTMENT_CANCELLATION_TOO_LATE" || status === 400 || status === 409) return "too-late";
	return "network";
}
