import dayjs from "dayjs";
import type { StaffAppointmentDTO, StaffWaitlistEntryDTO } from "@/types";

function fullName(person: { firstName: string; lastName: string }) {
	return `${person.firstName} ${person.lastName}`.trim();
}

export function formatStaffAppointmentTime(appointment: StaffAppointmentDTO) {
	return `${dayjs(appointment.startsAt).format("YYYY-MM-DD HH:mm")} - ${dayjs(appointment.endsAt).format("HH:mm")}`;
}

export function formatStaffAppointmentDoctor(appointment: StaffAppointmentDTO) {
	return fullName(appointment.doctor);
}

export function formatStaffAppointmentPatient(appointment: StaffAppointmentDTO) {
	return fullName(appointment.patient);
}

export function formatWaitlistPatient(entry: StaffWaitlistEntryDTO) {
	return fullName(entry.patient);
}

export function formatWaitlistDoctor(entry: StaffWaitlistEntryDTO) {
	return fullName(entry.doctor);
}
