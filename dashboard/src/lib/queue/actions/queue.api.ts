import { api } from "@/lib/axios-instance";
import qs from "qs";
import { ANALYTICS_TODAY_BY_DOCTOR, ANALYTICS_TODAY_SUMMARY, APPOINTMENTS, appointmentStatusPath, QUEUE_KIOSK_TOKEN } from "@/lib/api-paths";
import type { CancelStaffAppointmentBody, IssueKioskTokenPayload, IssuedKioskTokenDTO, StaffQueueAppointmentDTO, StaffQueueQueryParams, TodayByDoctorDTO, TodaySummaryDTO } from "@/types";

type BackendTodaySummary = Partial<TodaySummaryDTO> & {
	canceled?: number | null;
	cancelledToday?: number | null;
	noShow?: number | null;
	noShows?: number | null;
	NO_SHOW?: number | null;
	pending?: number | null;
};

type BackendStaffQueueAppointment = {
	id: string;
	doctorId: string;
	patientId: string;
	startsAt: string;
	endsAt: string;
	status: StaffQueueAppointmentDTO["status"];
	createdAt: string;
	updatedAt?: string;
	cancellationReason?: string | null;
	notes?: string | null;
	doctor: {
		id: string;
		firstName: string;
		lastName: string;
		specialization: string | null;
	};
	patient: {
		id: string;
		firstName: string;
		lastName: string;
		phone?: string | null;
	};
};

type StaffQueueResponse =
	| BackendStaffQueueAppointment[]
	| {
		items?: BackendStaffQueueAppointment[] | null;
	  };

function serializeStaffQueueParams(params: StaffQueueQueryParams) {
	return {
		date: params.date,
		doctorId: params.doctorIds.length ? params.doctorIds : undefined,
		status: params.statuses.length ? params.statuses : undefined,
		patientName: params.search.trim() || undefined,
	};
}

function normalizeStaffQueueAppointment(appointment: BackendStaffQueueAppointment): StaffQueueAppointmentDTO {
	return {
		id: appointment.id,
		startsAt: appointment.startsAt,
		endsAt: appointment.endsAt,
		status: appointment.status,
		bookedByRole: "RECEPTIONIST",
		createdAt: appointment.createdAt,
		patient: {
			id: appointment.patient.id,
			firstName: appointment.patient.firstName,
			lastName: appointment.patient.lastName,
			phone: appointment.patient.phone ?? null,
		},
		doctor: {
			id: appointment.doctor.id,
			firstName: appointment.doctor.firstName,
			lastName: appointment.doctor.lastName,
			specialization: appointment.doctor.specialization,
		},
	};
}

function normalizeTodaySummary(summary: BackendTodaySummary | null | undefined): TodaySummaryDTO {
	const canceledToday = summary?.canceledToday ?? summary?.cancelledToday ?? summary?.canceled ?? 0;
	const noShow = summary?.noShow ?? summary?.noShows ?? summary?.NO_SHOW ?? 0;

	return {
		total: summary?.total ?? 0,
		inProgress: summary?.inProgress ?? 0,
		waiting: summary?.waiting ?? 0,
		completed: summary?.completed ?? 0,
		canceledToday,
		noShow,
		pendingConfirmation: summary?.pendingConfirmation ?? summary?.pending ?? 0,
	};
}

export async function getStaffQueue(params: StaffQueueQueryParams): Promise<StaffQueueAppointmentDTO[]> {
	const response = await api.get<{ data: StaffQueueResponse }>(APPOINTMENTS, {
		params: serializeStaffQueueParams(params),
		paramsSerializer: (requestParams) => qs.stringify(requestParams, { arrayFormat: "repeat" }),
	});
	const payload = response.data.data;

	if (Array.isArray(payload)) {
		return payload.map(normalizeStaffQueueAppointment);
	}

	return Array.isArray(payload?.items) ? payload.items.map(normalizeStaffQueueAppointment) : [];
}

export async function getTodaySummary(date: string): Promise<TodaySummaryDTO> {
	const response = await api.get<{ data: BackendTodaySummary | null }>(ANALYTICS_TODAY_SUMMARY, { params: { date } });
	return normalizeTodaySummary(response.data.data);
}

export async function getTodayByDoctor(date: string): Promise<TodayByDoctorDTO[]> {
	const response = await api.get<{ data: TodayByDoctorDTO[] }>(ANALYTICS_TODAY_BY_DOCTOR, { params: { date } });
	return response.data.data;
}

export async function updateAppointmentStatus(id: string, status: StaffQueueAppointmentDTO["status"]): Promise<void> {
	await api.patch(appointmentStatusPath(id), { status });
}

export async function cancelStaffAppointment(id: string, reason?: string): Promise<void> {
	const body: CancelStaffAppointmentBody = reason ? { reason } : {};
	await api.delete(`${APPOINTMENTS}/${id}`, { data: body });
}

export async function issueKioskToken(payload: IssueKioskTokenPayload): Promise<IssuedKioskTokenDTO> {
	const response = await api.post<{ data: IssuedKioskTokenDTO }>(QUEUE_KIOSK_TOKEN, payload);
	return response.data.data;
}
