import dayjs from "dayjs";
import type { DoctorQueueAppointment } from "@/types";

export function canConfirmAppointment(appointment: DoctorQueueAppointment) {
	return appointment.status === "PENDING";
}

export function canStartAppointment(appointment: DoctorQueueAppointment, now = dayjs()) {
	if (appointment.status !== "CONFIRMED") return false;
	return dayjs(appointment.startsAt).diff(now, "minute") <= 30;
}

export function canCompleteAppointment(appointment: DoctorQueueAppointment) {
	return appointment.status === "IN_PROGRESS";
}

export function canMarkNoShow(appointment: DoctorQueueAppointment, now = dayjs()) {
	return appointment.status === "CONFIRMED" && !dayjs(appointment.startsAt).isAfter(now);
}
