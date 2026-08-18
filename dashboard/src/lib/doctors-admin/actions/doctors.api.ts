import { api } from "@/lib/axios-instance";
import { doctorPath, doctorScheduleOverridePath, doctorScheduleOverridesPath, DOCTORS } from "@/lib/api-paths";
import type { CreateDoctorDTO, CreateScheduleOverrideDTO, DoctorDTO, DoctorFilters, ScheduleOverrideDTO, UpdateDoctorDTO } from "@/types";
import { unwrapPaginated, type PaginatedLike } from "../helpers/doctors-admin.helpers";

function unwrap<T>(payload: { data?: T } | T): T {
	return (payload as { data?: T }).data ?? (payload as T);
}

export async function getDoctors(filters: DoctorFilters = {}): Promise<{ data: DoctorDTO[]; total: number; page: number; pageSize: number }> {
	const response = await api.get<PaginatedLike<DoctorDTO>>(DOCTORS, { params: filters });
	return unwrapPaginated<DoctorDTO>(response.data);
}

export async function getDoctor(id: string): Promise<DoctorDTO> {
	const response = await api.get<DoctorDTO | { data: DoctorDTO }>(doctorPath(id));
	return unwrap<DoctorDTO>(response.data);
}

export async function createDoctor(payload: CreateDoctorDTO): Promise<DoctorDTO> {
	const response = await api.post<DoctorDTO | { data: DoctorDTO }>(DOCTORS, payload);
	return unwrap<DoctorDTO>(response.data);
}

export async function updateDoctor(id: string, payload: UpdateDoctorDTO): Promise<DoctorDTO> {
	const response = await api.patch<DoctorDTO | { data: DoctorDTO }>(doctorPath(id), payload);
	return unwrap<DoctorDTO>(response.data);
}

export async function getScheduleOverrides(doctorId: string): Promise<{ data: ScheduleOverrideDTO[]; total: number; page: number; pageSize: number }> {
	const response = await api.get<PaginatedLike<ScheduleOverrideDTO>>(doctorScheduleOverridesPath(doctorId));
	return unwrapPaginated<ScheduleOverrideDTO>(response.data);
}

export async function createScheduleOverride(doctorId: string, payload: CreateScheduleOverrideDTO): Promise<ScheduleOverrideDTO> {
	const response = await api.post<ScheduleOverrideDTO | { data: ScheduleOverrideDTO }>(doctorScheduleOverridesPath(doctorId), payload);
	return unwrap<ScheduleOverrideDTO>(response.data);
}

export async function deleteScheduleOverride(doctorId: string, overrideId: string): Promise<void> {
	await api.delete(doctorScheduleOverridePath(doctorId, overrideId));
}
