import type { DoctorQueueGroup, StaffQueueAppointmentDTO } from "@/types";

export function formatDoctorName(doctor: StaffQueueAppointmentDTO["doctor"]) {
	return `${doctor.firstName} ${doctor.lastName}`.trim();
}

export function formatPatientName(patient: StaffQueueAppointmentDTO["patient"]) {
	return `${patient.firstName} ${patient.lastName}`.trim();
}

export function formatQueueTime(startsAt: string, endsAt: string) {
	return `${new Date(startsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${new Date(endsAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

export function groupByDoctor(appointments: StaffQueueAppointmentDTO[] | null | undefined): DoctorQueueGroup[] {
	const groups = new Map<string, DoctorQueueGroup>();
	const normalizedAppointments = Array.isArray(appointments) ? appointments : [];

	for (const appointment of [...normalizedAppointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt))) {
		const doctorId = appointment.doctor.id;
		const doctorName = formatDoctorName(appointment.doctor);
		const group = groups.get(doctorId);

		if (!group) {
			groups.set(doctorId, { doctorId, doctorName, appointments: [appointment] });
			continue;
		}

		group.appointments.push(appointment);
	}

	return Array.from(groups.values());
}

export function getPatientPhoneDisplay(phone: string | null) {
	return phone?.trim() ? phone : "—";
}
