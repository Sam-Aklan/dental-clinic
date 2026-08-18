import { useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getQueueSocketNamespaceUrl } from "@/lib/socket";
import { deriveLobbyQueueSections } from "@/lib/lobby-queue";
import { applyRemovedFromMap, applyUpdatedToMap } from "@/lib/queue";
import type { ConnectionState, DoctorDisplay, LobbyQueueEntry, LobbyQueueError, LobbyQueueSections, QueueRemovedEvent, QueueSnapshotPayload, QueueUpdatedEvent } from "@/types";

type PartialUpdatePayload = { items?: LobbyQueueEntry[] } & Record<string, unknown>;

type ConnectionSnapshot = {
	sessionKey: string;
	state: ConnectionState;
};

const EMPTY_SECTIONS = {
	inProgress: null,
	nextUp: null,
	waiting: [],
	visibleWaiting: [],
	waitingOverflow: 0,
};

export function useLobbyQueue(doctorId: string, kioskToken: string | null) {
	const sessionKey = kioskToken ? `${doctorId}:${kioskToken}` : "no-token";
	const [sections, setSections] = useState<LobbyQueueSections>(EMPTY_SECTIONS);
	const [doctorDisplay, setDoctorDisplay] = useState<DoctorDisplay | null>(null);
	const [connectionSnapshot, setConnectionSnapshot] = useState<ConnectionSnapshot>(() => ({
		sessionKey,
		state: "connecting",
	}));
	const [queue, setQueue] = useState<LobbyQueueEntry[]>([]);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
	const [errorSnapshot, setErrorSnapshot] = useState<{ sessionKey: string; error: LobbyQueueError | null }>({
		sessionKey,
		error: null,
	});
	const queueRef = useRef<LobbyQueueEntry[]>([]);
	const connectionStateRef = useRef<ConnectionState>("connecting");
	const socketRef = useRef<Socket | null>(null);
	const connectionState = connectionSnapshot.sessionKey === sessionKey ? connectionSnapshot.state : "connecting";
	const error = errorSnapshot.sessionKey === sessionKey ? errorSnapshot.error : null;

	useEffect(() => {
		connectionStateRef.current = connectionState;
	}, [connectionState]);

	const applyItems = (items: LobbyQueueEntry[]) => {
		queueRef.current = items;
		setQueue(items);
		setSections(deriveLobbyQueueSections(items));
		setLastUpdated(new Date());
	};

	const socket = useMemo(() => {
		if (!kioskToken) return null;
		return io(getQueueSocketNamespaceUrl(), {
			auth: { kioskToken },
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			autoConnect: false,
		});
	}, [kioskToken]);

	useEffect(() => {
		if (!socket || !kioskToken) {
			return;
		}

		socketRef.current = socket;

		const updateConnectionState = (state: ConnectionState) => {
			setConnectionSnapshot({ sessionKey, state });
			connectionStateRef.current = state;
		};

		const handleSnapshot = (payload: QueueSnapshotPayload) => {
			setDoctorDisplay({ doctorId: payload.doctorId, displayName: payload.doctorDisplayName ?? doctorId });
			applyItems(payload.items);
		};

		const handleUpdated = (payload: LobbyQueueEntry[] | PartialUpdatePayload | QueueUpdatedEvent) => {
			if (Array.isArray(payload)) {
				applyItems(payload);
				return;
			}

			if (typeof payload === "object" && payload && "items" in payload && Array.isArray((payload as PartialUpdatePayload).items)) {
				applyItems((payload as PartialUpdatePayload).items ?? []);
				return;
			}

			const next = applyUpdatedToMap(queueRef.current, payload as QueueUpdatedEvent);
			applyItems(next);
		};

		const handleRemoved = (payload: QueueRemovedEvent) => {
			const next = applyRemovedFromMap(queueRef.current, payload);
			applyItems(next);
		};

		const handleConnect = () => {
			updateConnectionState("connected");
			setErrorSnapshot({ sessionKey, error: null });
		};

		const handleDisconnect = () => {
			updateConnectionState("offline");
		};

		const handleReconnect = () => {
			updateConnectionState("reconnecting");
		};

		const handleConnectError = () => {
			updateConnectionState("reconnecting");
		};

		const handleException = (payload: { message?: string }) => {
			setErrorSnapshot({
				sessionKey,
				error: {
					message: payload.message === "unauthorized" ? "Invalid or expired lobby link" : "Unable to load the lobby display",
					status: payload.message === "unauthorized" ? 401 : undefined,
				},
			});
		};

		socket.on("queue.snapshot", handleSnapshot);
		socket.on("queue.updated", handleUpdated);
		socket.on("queue.removed", handleRemoved);
		socket.on("exception", handleException);
		socket.on("connect", handleConnect);
		socket.on("disconnect", handleDisconnect);
		socket.on("reconnecting", handleReconnect);
		socket.on("connect_error", handleConnectError);
		socket.connect();

		return () => {
			socket.off("queue.snapshot", handleSnapshot);
			socket.off("queue.updated", handleUpdated);
			socket.off("queue.removed", handleRemoved);
			socket.off("exception", handleException);
			socket.off("connect", handleConnect);
			socket.off("disconnect", handleDisconnect);
			socket.off("reconnecting", handleReconnect);
			socket.off("connect_error", handleConnectError);
			socket.disconnect();
		};
	}, [doctorId, kioskToken, sessionKey, socket]);

	useEffect(() => {
		return () => {
			socketRef.current?.disconnect();
		};
	}, []);

	return {
		sections,
		doctorDisplay,
		connectionState,
		lastUpdated,
		error,
		queue,
	} as const;
}
