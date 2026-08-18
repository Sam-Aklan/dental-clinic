export type LobbyQueueStatus = "IN_PROGRESS" | "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELED" | "NO_SHOW";

export interface LobbyQueueEntry {
	appointmentId: string;
	position: number | null;
	startsAt: string;
	endsAt: string;
	notes: string | null;
	status: LobbyQueueStatus;
	anonymousNumber?: number;
	scheduledTime?: string;
	startedTime?: string;
}

export interface DoctorDisplay {
	doctorId: string;
	displayName: string;
}

export interface QueueSnapshotPayload {
	doctorId: string;
	date?: string;
	doctorDisplayName: string;
	items: LobbyQueueEntry[];
}

export type ConnectionState = "connecting" | "connected" | "offline" | "reconnecting";

export interface LobbyQueueSections {
	inProgress: LobbyQueueEntry | null;
	nextUp: LobbyQueueEntry | null;
	waiting: LobbyQueueEntry[];
	visibleWaiting: LobbyQueueEntry[];
	waitingOverflow: number;
}

export interface LobbyQueueError {
	message: string;
	status?: number;
}
