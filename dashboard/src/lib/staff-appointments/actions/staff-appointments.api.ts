import { api } from "@/lib/axios-instance";
import { APPOINTMENTS, APPOINTMENTS_EXPORT, APPOINTMENT_SLOTS, appointmentPath, appointmentStatusPath, waitlistEntryPath, WAITLIST } from "@/lib/api-paths";
import type { ExportAppointmentsParams, RescheduleAppointmentDTO, SlotDTO, StaffAppointmentDTO, StaffAppointmentFilters, StaffCancelAppointmentDTO, StaffWaitlistEntryDTO, StaffWaitlistFilters, UpdateStatusDTO } from "@/types";

function serializeAppointmentFilters(filters: StaffAppointmentFilters) {
	return {
		tab: filters.tab,
		date: filters.date,
		from: filters.from,
		to: filters.to,
		doctorId: filters.doctorId?.length ? filters.doctorId.join(",") : undefined,
		status: filters.status?.length ? filters.status.join(",") : undefined,
		patientName: filters.patientName?.trim() || undefined,
		page: filters.page,
		pageSize: filters.pageSize,
		sortBy: filters.sortBy,
		sortDir: filters.sortDir,
	};
}

function serializeWaitlistFilters(filters: StaffWaitlistFilters) {
	return {
		doctorId: filters.doctorId,
		page: filters.page,
		pageSize: filters.pageSize,
	};
}

export async function getStaffAppointments(filters: StaffAppointmentFilters): Promise<{ data: StaffAppointmentDTO[]; total: number; page: number; pageSize: number }> {
	const response = await api.get<{ data: { data: StaffAppointmentDTO[]; total: number; page: number; pageSize: number } }>(APPOINTMENTS, {
		params: serializeAppointmentFilters(filters),
	});
	return response.data.data;
}

export async function getAppointmentSlots(doctorId: string, date: string): Promise<SlotDTO[]> {
	const response = await api.get<{ data: SlotDTO[] }>(APPOINTMENT_SLOTS, { params: { doctorId, date } });
	return response.data.data;
}

export async function cancelStaffAppointment(id: string, payload: StaffCancelAppointmentDTO): Promise<void> {
	await api.delete(appointmentPath(id), { data: payload });
}

export async function rescheduleStaffAppointment(id: string, payload: RescheduleAppointmentDTO): Promise<void> {
	await api.patch(appointmentPath(id), payload);
}

export async function markStaffAppointmentNoShow(id: string, payload: UpdateStatusDTO): Promise<void> {
	await api.patch(appointmentStatusPath(id), payload);
}

export async function exportStaffAppointments(filters: Omit<StaffAppointmentFilters, "tab" | "page" | "pageSize">): Promise<Blob> {
	const response = await api.get<Blob>(APPOINTMENTS_EXPORT, {
		params: { ...filters, format: "csv" } satisfies ExportAppointmentsParams,
		responseType: "blob",
	});
	return response.data;
}

export async function getStaffWaitlist(filters: StaffWaitlistFilters): Promise<{ data: StaffWaitlistEntryDTO[]; total: number; page: number; pageSize: number }> {
	const response = await api.get<{ data: { data: StaffWaitlistEntryDTO[]; total: number; page: number; pageSize: number } }>(WAITLIST, {
		params: serializeWaitlistFilters(filters),
	});
	return response.data.data;
}

export async function removeStaffWaitlistEntry(id: string): Promise<void> {
	await api.delete(waitlistEntryPath(id));
}
