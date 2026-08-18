import type { AppointmentDoctor, PatientAppointment } from "@/types";
import { CLINIC_TIMEZONE } from "@/constants/booking";

function createFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
	return new Intl.DateTimeFormat(locale, { timeZone: CLINIC_TIMEZONE, ...options });
}

export function formatAppointmentDate(value: string, locale: string) {
	return createFormatter(locale, { dateStyle: "medium" }).format(new Date(value));
}

export function formatAppointmentTimeRange(startsAt: string, endsAt: string, locale: string) {
	const formatter = createFormatter(locale, { timeStyle: "short" });
	return `${formatter.format(new Date(startsAt))} - ${formatter.format(new Date(endsAt))}`;
}

export function formatAppointmentBookingDate(value: string, locale: string) {
	return createFormatter(locale, { dateStyle: "medium" }).format(new Date(value));
}

export function formatDoctorDisplayName(doctor: AppointmentDoctor) {
	return `${doctor.firstName} ${doctor.lastName}`.trim();
}

export function getAppointmentSummary(appointment: PatientAppointment, locale: string) {
	return {
		doctorName: formatDoctorDisplayName(appointment.doctor),
		date: formatAppointmentDate(appointment.startsAt, locale),
		time: formatAppointmentTimeRange(appointment.startsAt, appointment.endsAt, locale),
		bookingDate: formatAppointmentBookingDate(appointment.createdAt, locale),
	};
}
