import { api } from "@/lib/axios-instance";
import { CLINIC_CONFIG, appointmentNotesPath, appointmentStatusPath, APPOINTMENTS } from "@/lib/api-paths";
import type { ClinicConfigDTO, DoctorQueueAppointment, AppointmentStatus, UpdateNoteResponseDTO } from "@/types";

type BackendDoctorQueueAppointment = Omit<DoctorQueueAppointment, "id"> & {
	id?: string;
	appointmentId?: string;
};

export function normalizeDoctorQueueAppointment(appointment: BackendDoctorQueueAppointment): DoctorQueueAppointment {
	return {
		...appointment,
		id: appointment.id ?? appointment.appointmentId ?? "",
		followUpId: appointment.followUpId ?? null,
		needsFollowUp: appointment.needsFollowUp ?? false,
	};
}

export async function getClinicConfig(): Promise<ClinicConfigDTO> {
	const response = await api.get<{ data: ClinicConfigDTO }>(CLINIC_CONFIG);
	return response.data.data;
}

export async function getDoctorQueue(date: string): Promise<DoctorQueueAppointment[]> {
	const response = await api.get<{ data: { items: BackendDoctorQueueAppointment[] } }>(APPOINTMENTS, { params: { date } });
	return response.data.data.items.map(normalizeDoctorQueueAppointment);
}

export async function updateAppointmentStatus(id: string, payload: { status: AppointmentStatus; needsFollowUp?: boolean }): Promise<void> {
	await api.patch(appointmentStatusPath(id), payload);
}

export async function updateAppointmentNote(id: string, notes: string): Promise<UpdateNoteResponseDTO> {
	const response = await api.patch<{ data: UpdateNoteResponseDTO }>(appointmentNotesPath(id), { notes });
	return response.data.data;
}
