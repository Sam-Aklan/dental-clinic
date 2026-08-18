import { api } from "@/lib/axios-instance";
import { APPOINTMENTS, appointmentPath, appointmentStatusPath, ANALYTICS_MY_HOURLY_LOAD, ANALYTICS_MY_STATS, ANALYTICS_MY_STATUS_DISTRIBUTION, ANALYTICS_MY_TRENDS } from "@/lib/api-paths";
import type { DoctorTodayAppointmentStatus, DoctorTodayFilters, DoctorTodayHourlyLoadDTO, DoctorTodayPaginatedResponse, DoctorTodayScheduleAppointmentDTO, DoctorTodayStatsDTO, DoctorTodayStatusDistributionDTO, DoctorTodayTrendPointDTO } from "@/types";

const APPOINTMENT_STATUS_ORDER: DoctorTodayAppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED", "NO_SHOW"];

function normalizeScheduleResponse(payload: unknown): DoctorTodayPaginatedResponse<DoctorTodayScheduleAppointmentDTO> {
	const response = payload as { data?: unknown; items?: unknown[]; total?: number; page?: number; pageSize?: number } | undefined;
	const items = Array.isArray(response?.data)
		? response.data
		: Array.isArray(response?.items)
			? response.items
			: [];

	return {
		data: items.map((item, index) => {
			const appointment = item as Partial<DoctorTodayScheduleAppointmentDTO> & { patientSequence?: number };
			return {
				id: appointment.id ?? "",
				startsAt: appointment.startsAt ?? "",
				endsAt: appointment.endsAt ?? "",
				status: (appointment.status ?? "PENDING") as DoctorTodayAppointmentStatus,
				patientName: appointment.patientName ?? null,
				patient: appointment.patient ?? null,
				patientSequence: appointment.patientSequence ?? index + 1,
				notes: appointment.notes ?? null,
				createdAt: appointment.createdAt ?? appointment.startsAt ?? "",
				updatedAt: appointment.updatedAt ?? appointment.startsAt ?? "",
			};
		}),
		total: response?.total ?? items.length,
		page: response?.page ?? 1,
		pageSize: response?.pageSize ?? items.length,
	};
}

function normalizeTrendResponse(payload: unknown): DoctorTodayTrendPointDTO[] {
	if (!Array.isArray(payload)) {
		return [];
	}

	return payload.map((item) => {
		const trend = item as Partial<DoctorTodayTrendPointDTO> & { count?: number };
		const total = trend.total ?? trend.count ?? 0;
		return {
			date: trend.date ?? "",
			total,
			dominantStatus: trend.dominantStatus ?? null,
			confirmed: trend.confirmed ?? 0,
			completed: trend.completed ?? 0,
			canceled: trend.canceled ?? 0,
			noShow: trend.noShow ?? 0,
		};
	});
}

function normalizeStatusDistributionResponse(payload: unknown): DoctorTodayStatusDistributionDTO[] {
	if (Array.isArray(payload)) {
		return payload as DoctorTodayStatusDistributionDTO[];
	}

	const counts = (payload ?? {}) as Partial<Record<DoctorTodayAppointmentStatus, number>>;
	return APPOINTMENT_STATUS_ORDER.map((status) => ({ status, count: counts[status] ?? 0 })).filter((item) => item.count > 0);
}

function normalizeHourlyLoadResponse(payload: unknown): DoctorTodayHourlyLoadDTO[] {
	if (!Array.isArray(payload)) {
		return [];
	}

	const rows = payload as Array<Partial<DoctorTodayHourlyLoadDTO>>;
	const total = rows.reduce((sum, item) => sum + (item.count ?? 0), 0);
	return rows.map((item) => ({
		hour: item.hour ?? 0,
		count: item.count ?? 0,
		percentage: item.percentage ?? (total > 0 ? Math.round(((item.count ?? 0) / total) * 100) : 0),
	}));
}

export async function getDoctorSchedule(filters: Pick<DoctorTodayFilters, "from" | "to" | "status" | "page" | "pageSize" | "sortBy" | "sortDir">): Promise<DoctorTodayPaginatedResponse<DoctorTodayScheduleAppointmentDTO>> {
	const response = await api.get<{ data: DoctorTodayPaginatedResponse<DoctorTodayScheduleAppointmentDTO> }>(APPOINTMENTS, { params: filters });
	return normalizeScheduleResponse(response.data.data);
}

export async function getMyStats(date: string): Promise<DoctorTodayStatsDTO> {
	const response = await api.get<{ data: DoctorTodayStatsDTO }>(ANALYTICS_MY_STATS, { params: { date } });
	return response.data.data;
}

export async function getMyTrends(week: string): Promise<DoctorTodayTrendPointDTO[]> {
	const response = await api.get<{ data: DoctorTodayTrendPointDTO[] }>(ANALYTICS_MY_TRENDS, { params: { week } });
	return normalizeTrendResponse(response.data.data);
}

export async function getMyStatusDistribution(from: string, to: string): Promise<DoctorTodayStatusDistributionDTO[]> {
	const response = await api.get<{ data: DoctorTodayStatusDistributionDTO[] | Record<DoctorTodayAppointmentStatus, number> }>(ANALYTICS_MY_STATUS_DISTRIBUTION, { params: { from, to } });
	return normalizeStatusDistributionResponse(response.data.data);
}

export async function getMyHourlyLoad(from: string, to: string): Promise<DoctorTodayHourlyLoadDTO[]> {
	const response = await api.get<{ data: DoctorTodayHourlyLoadDTO[] }>(ANALYTICS_MY_HOURLY_LOAD, { params: { from, to } });
	return normalizeHourlyLoadResponse(response.data.data);
}

export async function updateDoctorTodayAppointmentStatus(id: string, status: DoctorTodayAppointmentStatus): Promise<void> {
	await api.patch(appointmentStatusPath(id), { status });
}

export async function updateDoctorTodayAppointmentNotes(id: string, notes: string): Promise<void> {
	await api.patch(appointmentPath(id), { notes });
}
