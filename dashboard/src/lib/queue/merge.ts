import type { AppointmentStatus, ConnectionStatus, QueueItem, QueueRemovedEvent, QueueUpdatedEvent } from "@/types";

export const ACTIVE_STATUSES: AppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS"];

type QueueItemMap = Map<string, QueueItem>;

function getQueueItemKey(item: QueueItem) {
	return item.appointmentId;
}

function isActiveStatus(status: AppointmentStatus) {
	return ACTIVE_STATUSES.includes(status);
}

function shouldIgnoreEvent(event: { doctorId?: string }, expectedDoctorId?: string) {
	return Boolean(expectedDoctorId && event.doctorId && event.doctorId !== expectedDoctorId);
}

function upsertQueueItem(map: QueueItemMap, item: QueueItem) {
	map.set(getQueueItemKey(item), item);
}

export function applyUpdatedEvent(map: QueueItemMap, event: QueueUpdatedEvent, expectedDoctorId?: string) {
	if (shouldIgnoreEvent(event, expectedDoctorId)) {
		return map;
	}

	if (!isActiveStatus(event.status) || event.position === null) {
		map.delete(event.appointmentId);
		return map;
	}

	upsertQueueItem(map, {
		appointmentId: event.appointmentId,
		position: event.position,
		status: event.status,
		startsAt: event.startsAt,
		endsAt: event.endsAt,
		notes: event.notes,
	});

	return map;
}


export function applyRemovedEvent(map: QueueItemMap, event: QueueRemovedEvent, expectedDoctorId?: string) {
	if (shouldIgnoreEvent(event, expectedDoctorId)) {
		return map;
	}

	map.delete(event.appointmentId);
	return map;
}

export function applyUpdatedToMap(items: QueueItem[], event: QueueUpdatedEvent, expectedDoctorId?: string) {
	const map = new Map(items.map((item) => [item.appointmentId, item] as const));
	applyUpdatedEvent(map, event, expectedDoctorId);
	return [...map.values()].sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));
}

export function applyRemovedFromMap(items: QueueItem[], event: QueueRemovedEvent, expectedDoctorId?: string) {
	const map = new Map(items.map((item) => [item.appointmentId, item] as const));
	applyRemovedEvent(map, event, expectedDoctorId);
	return [...map.values()].sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER));
}

export function normalizeConnectionStatus(status: ConnectionStatus | "connecting" | "disconnected") {
	return status === "disconnected" ? "offline" : status;
}
