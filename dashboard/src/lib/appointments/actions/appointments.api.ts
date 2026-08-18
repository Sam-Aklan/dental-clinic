import { api } from "@/lib/axios-instance";
import qs from "qs";
import { APPOINTMENTS } from "@/lib/api-paths";
import type { AppointmentListParams, AppointmentListResult } from "@/types";

function serializeParams(params: AppointmentListParams) {
	return {
		from: params.from ?? undefined,
		to: params.to ?? undefined,
		status: params.statuses.length > 0 ? params.statuses : undefined,
		doctorId: params.doctorId ?? undefined,
		page: params.page,
		pageSize: params.pageSize,
		sortBy: params.sortBy,
		sortDir: params.sortDir,
	};
}

export async function getMyAppointments(params: AppointmentListParams): Promise<AppointmentListResult> {
	const response = await api.get<{ data: AppointmentListResult }>(APPOINTMENTS, {
		params: serializeParams(params),
		paramsSerializer: (requestParams) => qs.stringify(requestParams, { arrayFormat: "repeat" }),
	});
	return response.data.data;
}

export async function cancelMyAppointment(appointmentId: string): Promise<void> {
	await api.patch(`${APPOINTMENTS}/${appointmentId}/status`, { status: "CANCELED" });
}
