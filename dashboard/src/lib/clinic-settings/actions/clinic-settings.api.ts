import { api } from "@/lib/axios-instance";
import { CLINIC_CONFIG, CLINIC_CONFIG_WORKING_HOURS, CLINIC_CONFIG_HOLIDAYS, clinicConfigHolidayPath } from "@/lib/api-paths";
import type { AddHolidayPayload, ClinicBookingSettingsDTO, HolidayClosureDTO, UpdateClinicSettingsPayload, UpdateWeeklyHoursPayload, WorkingHourDTO } from "@/types";

type ClinicConfigBackendDTO = {
	id: string;
	slotDurationMinutes: number;
	timeZone: string;
	reminderHoursBefore: number;
	offerWindowMinutes: number;
	minArrivalMinutes: number | null;
	updatedAt: string;
};

type UpdateClinicConfigBackendPayload = {
	slotDurationMinutes?: number;
	timeZone?: string;
	reminderHoursBefore?: number;
	offerWindowMinutes?: number;
	minArrivalMinutes?: number;
};

function unwrap<T>(payload: { data?: T } | T): T {
	return (payload as { data?: T }).data ?? (payload as T);
}

function mapClinicConfigResponse(response: ClinicConfigBackendDTO | { data?: ClinicConfigBackendDTO }): ClinicBookingSettingsDTO {
	const data = unwrap<ClinicConfigBackendDTO>(response);
	return {
		id: data.id,
		slotDurationMinutes: data.slotDurationMinutes,
		timeZone: data.timeZone,
		reminderHoursBefore: data.reminderHoursBefore,
		waitlistOfferWindowMinutes: data.offerWindowMinutes,
		minArrivalBufferMinutes: data.minArrivalMinutes,
		updatedAt: data.updatedAt,
	};
}

function mapClinicConfigPayload(payload: UpdateClinicSettingsPayload): UpdateClinicConfigBackendPayload {
	return {
		slotDurationMinutes: payload.slotDurationMinutes,
		timeZone: payload.timeZone,
		reminderHoursBefore: payload.reminderHoursBefore,
		offerWindowMinutes: payload.waitlistOfferWindowMinutes,
		minArrivalMinutes: payload.minArrivalBufferMinutes,
	};
}

export async function getClinicBookingSettings(): Promise<ClinicBookingSettingsDTO> {
	const response = await api.get<ClinicConfigBackendDTO | { data: ClinicConfigBackendDTO }>(CLINIC_CONFIG);
	return mapClinicConfigResponse(response.data as ClinicConfigBackendDTO | { data?: ClinicConfigBackendDTO });
}

export async function updateClinicBookingSettings(payload: UpdateClinicSettingsPayload): Promise<ClinicBookingSettingsDTO> {
	const response = await api.patch<ClinicConfigBackendDTO | { data: ClinicConfigBackendDTO }>(CLINIC_CONFIG, mapClinicConfigPayload(payload));
	return mapClinicConfigResponse(response.data as ClinicConfigBackendDTO | { data?: ClinicConfigBackendDTO });
}

export async function getWeeklyHours(): Promise<WorkingHourDTO[]> {
	const response = await api.get<WorkingHourDTO[] | { data: WorkingHourDTO[] }>(CLINIC_CONFIG_WORKING_HOURS);
	return unwrap<WorkingHourDTO[]>(response.data as WorkingHourDTO[] | { data?: WorkingHourDTO[] });
}

export async function updateWeeklyHours(payload: UpdateWeeklyHoursPayload): Promise<WorkingHourDTO[]> {
	const response = await api.patch<WorkingHourDTO[] | { data: WorkingHourDTO[] }>(CLINIC_CONFIG_WORKING_HOURS, payload);
	return unwrap<WorkingHourDTO[]>(response.data as WorkingHourDTO[] | { data?: WorkingHourDTO[] });
}

export async function getHolidayClosures(): Promise<HolidayClosureDTO[]> {
	const response = await api.get<HolidayClosureDTO[] | { data: HolidayClosureDTO[] }>(CLINIC_CONFIG_HOLIDAYS);
	return unwrap<HolidayClosureDTO[]>(response.data as HolidayClosureDTO[] | { data?: HolidayClosureDTO[] });
}

export async function addHolidayClosure(payload: AddHolidayPayload): Promise<HolidayClosureDTO> {
	const response = await api.post<HolidayClosureDTO | { data: HolidayClosureDTO }>(CLINIC_CONFIG_HOLIDAYS, payload);
	return unwrap<HolidayClosureDTO>(response.data as HolidayClosureDTO | { data?: HolidayClosureDTO });
}

export async function deleteHolidayClosure(id: string): Promise<void> {
	await api.delete(clinicConfigHolidayPath(id));
}
