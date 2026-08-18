import { api } from "@/lib/axios-instance";
import { DOCTORS, APPOINTMENT_SLOTS, APPOINTMENTS } from "@/lib/api-paths";
import type { DoctorDirectoryItemDTO, AvailableSlotDTO, AppointmentDTO, CreateAppointmentDTO, SlotsQueryParams, StaffCreateAppointmentDTO, StaffCreatedAppointmentDTO } from "@/types";

export async function getDoctors(): Promise<DoctorDirectoryItemDTO[]> {
	const { data } = await api.get<{ data: DoctorDirectoryItemDTO[] }>(DOCTORS);
	return data.data;
}

export async function getAvailableSlots(params: SlotsQueryParams): Promise<AvailableSlotDTO[]> {
	const queryParams = params.includeReserved
		? { ...params, includeReserved: true }
		: { doctorId: params.doctorId, from: params.from, to: params.to };
	const { data } = await api.get<{ data: AvailableSlotDTO[] }>(APPOINTMENT_SLOTS, { params: queryParams });
	return data.data;
}

export async function bookAppointment(
	payload: CreateAppointmentDTO,
	idempotencyKey: string,
): Promise<AppointmentDTO> {
	const { data } = await api.post<{ data: AppointmentDTO }>(APPOINTMENTS, payload, {
		headers: { "Idempotency-Key": idempotencyKey },
	});
	return data.data;
}

export async function createStaffAppointment(
	payload: StaffCreateAppointmentDTO,
	idempotencyKey: string,
): Promise<StaffCreatedAppointmentDTO> {
	const { data } = await api.post<{ data: StaffCreatedAppointmentDTO }>(APPOINTMENTS, payload, {
		headers: { "Idempotency-Key": idempotencyKey },
	});
	return data.data;
}
