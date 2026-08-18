import { api } from "@/lib/axios-instance";
import {
	ANALYTICS_APPOINTMENTS_BY_WEEKDAY,
	ANALYTICS_CANCELLATION_TRENDS,
	ANALYTICS_DOCTOR_UTILIZATION,
	ANALYTICS_FOLLOW_UPS,
	ANALYTICS_KPI_SUMMARY,
	ANALYTICS_STATUS_DISTRIBUTION,
	ANALYTICS_TRENDS,
	ANALYTICS_WAITLIST_SUMMARY,
	APPOINTMENTS,
	APPOINTMENTS_EXPORT,
	appointmentPath,
	WAITLIST,
} from "@/lib/api-paths";
import type {
	AdminAppointmentRowDTO,
	AdminAppointmentsExportFilters,
	AdminAppointmentsFilters,
	AdminDashboardQueryParams,
	AdminFollowUpsFilters,
	AdminKpiSummaryDTO,
	AdminWaitlistFilters,
	AppointmentTrendPointDTO,
	CancellationTrendPointDTO,
	DoctorUtilizationDTO,
	FollowUpRowDTO,
	PaginatedResponse,
	StatusDistributionDTO,
	WaitlistSummaryDTO,
	WaitlistAdminRowDTO,
	WeekdayAppointmentDTO,
} from "@/types";

type PaginatedApiResponse<T> = {
	data: {
		data?: T[];
		items?: T[];
		total: number;
		page: number;
		pageSize: number;
	};
};

function cleanString(value?: string) {
	return value?.trim() || undefined;
}

function cleanAppointmentsParams(filters: AdminAppointmentsFilters) {
	return {
		from: filters.from,
		to: filters.to,
		doctorId: cleanString(filters.doctorId),
		status: filters.status,
		patientName: cleanString(filters.patientName),
		page: filters.page,
		pageSize: filters.pageSize,
		sortBy: filters.sortBy,
		sortDir: filters.sortDir,
	};
}

function cleanDateRange(params: AdminDashboardQueryParams) {
	return {
		from: params.from,
		to: params.to,
		bucket: params.bucket,
	};
}

function cleanDateRangeWithoutBucket(params: AdminDashboardQueryParams) {
	return {
		from: params.from,
		to: params.to,
	};
}

function normalizePaginatedResponse<T>(payload: PaginatedApiResponse<T>["data"]): PaginatedResponse<T> {
	return {
		data: payload.data ?? payload.items ?? [],
		total: payload.total,
		page: payload.page,
		pageSize: payload.pageSize,
	};
}

export async function getAdminKpiSummary(params: AdminDashboardQueryParams): Promise<AdminKpiSummaryDTO> {
	const response = await api.get<{ data: AdminKpiSummaryDTO }>(ANALYTICS_KPI_SUMMARY, { params: cleanDateRange(params) });
	return response.data.data;
}

export async function getAdminAppointmentTrends(params: AdminDashboardQueryParams): Promise<AppointmentTrendPointDTO[]> {
	const response = await api.get<{ data: AppointmentTrendPointDTO[] }>(ANALYTICS_TRENDS, { params: cleanDateRange(params) });
	return response.data.data;
}

export async function getAdminStatusDistribution(params: AdminDashboardQueryParams): Promise<StatusDistributionDTO> {
	const response = await api.get<{ data: StatusDistributionDTO }>(ANALYTICS_STATUS_DISTRIBUTION, {
		params: cleanDateRangeWithoutBucket(params),
	});
	return response.data.data;
}

export async function getAdminDoctorUtilization(params: AdminDashboardQueryParams): Promise<DoctorUtilizationDTO[]> {
	const response = await api.get<{ data: DoctorUtilizationDTO[] }>(ANALYTICS_DOCTOR_UTILIZATION, {
		params: cleanDateRangeWithoutBucket(params),
	});
	return response.data.data;
}

export async function getAdminAppointmentsByWeekday(params: AdminDashboardQueryParams): Promise<WeekdayAppointmentDTO[]> {
	const response = await api.get<{ data: WeekdayAppointmentDTO[] }>(ANALYTICS_APPOINTMENTS_BY_WEEKDAY, {
		params: cleanDateRangeWithoutBucket(params),
	});
	return response.data.data;
}

export async function getAdminCancellationTrends(params: AdminDashboardQueryParams): Promise<CancellationTrendPointDTO[]> {
	const response = await api.get<{ data: CancellationTrendPointDTO[] }>(ANALYTICS_CANCELLATION_TRENDS, { params: cleanDateRange(params) });
	return response.data.data;
}

export async function getAdminAppointments(filters: AdminAppointmentsFilters): Promise<PaginatedResponse<AdminAppointmentRowDTO>> {
	const response = await api.get<PaginatedApiResponse<AdminAppointmentRowDTO>>(APPOINTMENTS, { params: cleanAppointmentsParams(filters) });
	return normalizePaginatedResponse(response.data.data);
}

export async function getAdminFollowUps(filters: AdminFollowUpsFilters): Promise<PaginatedResponse<FollowUpRowDTO>> {
	const response = await api.get<PaginatedApiResponse<FollowUpRowDTO>>(ANALYTICS_FOLLOW_UPS, {
		params: { thresholdDays: filters.thresholdDays, page: filters.page, pageSize: filters.pageSize },
	});
	return normalizePaginatedResponse(response.data.data);
}

export async function getAdminWaitlist(filters: AdminWaitlistFilters): Promise<PaginatedResponse<WaitlistAdminRowDTO>> {
	const response = await api.get<PaginatedApiResponse<WaitlistAdminRowDTO>>(WAITLIST, {
		params: { page: filters.page, pageSize: filters.pageSize },
	});
	return normalizePaginatedResponse(response.data.data);
}

export async function getAdminWaitlistSummary(): Promise<WaitlistSummaryDTO> {
	const response = await api.get<{ data: WaitlistSummaryDTO }>(ANALYTICS_WAITLIST_SUMMARY);
	return response.data.data;
}

export async function exportAdminAppointments(filters: AdminAppointmentsExportFilters): Promise<Blob> {
	const response = await api.get<Blob>(APPOINTMENTS_EXPORT, {
		params: filters,
		responseType: "blob",
	});
	return response.data;
}

export async function cancelAdminAppointment(appointmentId: string): Promise<void> {
	await api.delete(appointmentPath(appointmentId));
}
