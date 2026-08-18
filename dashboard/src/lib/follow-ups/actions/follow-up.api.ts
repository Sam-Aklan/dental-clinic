import { api } from "@/lib/axios-instance";
import { APPOINTMENT_SLOTS, FOLLOW_UPS } from "@/lib/api-paths";
import type { AvailableSlot, CreateFollowUpRequest, FollowUpResponse } from "@/types";

type Envelope<T> = { data?: T } | T;

function unwrap<T>(payload: Envelope<T>): T {
	return (payload as { data?: T }).data ?? (payload as T);
}

export interface FollowUpSlotsQueryParams {
	doctorId: string;
	from: string;
	to: string;
}

export async function getFollowUpSlots(params: FollowUpSlotsQueryParams): Promise<AvailableSlot[]> {
	const response = await api.get<Envelope<AvailableSlot[]>>(APPOINTMENT_SLOTS, { params });
	return unwrap(response.data);
}

export async function createFollowUp(payload: CreateFollowUpRequest, idempotencyKey: string): Promise<FollowUpResponse> {
	const response = await api.post<Envelope<FollowUpResponse>>(FOLLOW_UPS, payload, { headers: { "Idempotency-Key": idempotencyKey } });
	return unwrap(response.data);
}
