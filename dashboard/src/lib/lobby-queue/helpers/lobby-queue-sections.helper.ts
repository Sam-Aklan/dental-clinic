import type { LobbyQueueEntry, LobbyQueueSections } from "@/types";

const HIDDEN_STATUSES = new Set<LobbyQueueEntry["status"]>(["COMPLETED", "CANCELED", "NO_SHOW"]);

function sanitizeEntry(entry: LobbyQueueEntry): LobbyQueueEntry {
	const sanitized: LobbyQueueEntry = {
		appointmentId: entry.appointmentId,
		position: entry.position,
		startsAt: entry.startsAt,
		endsAt: entry.endsAt,
		notes: entry.notes,
		status: entry.status,
	};

	return sanitized;
}

export function deriveLobbyQueueSections(items: LobbyQueueEntry[]): LobbyQueueSections {
	const sorted = [...items].sort((a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER) || a.startsAt.localeCompare(b.startsAt));
	const visible = sorted.filter((entry) => !HIDDEN_STATUSES.has(entry.status));
	const inProgress = visible.find((entry) => entry.status === "IN_PROGRESS") ?? null;
	const remaining = visible.filter((entry) => entry !== inProgress);
	const nextUp = remaining.find((entry) => entry.status === "CONFIRMED") ?? null;
	const waiting = remaining.filter((entry) => entry !== nextUp && (entry.status === "CONFIRMED" || entry.status === "PENDING"));
	const sanitizedWaiting = waiting.map(sanitizeEntry);

	return {
		inProgress: inProgress ? sanitizeEntry(inProgress) : null,
		nextUp: nextUp ? sanitizeEntry(nextUp) : null,
		waiting: sanitizedWaiting,
		visibleWaiting: sanitizedWaiting.slice(0, 8),
		waitingOverflow: Math.max(0, sanitizedWaiting.length - 8),
	};
}
