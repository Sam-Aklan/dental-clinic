import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueueSocket, updateQueueSocketToken } from "@/lib/socket";
import { getAccessToken } from "@/lib/axios-instance";
import { doctorQueueKeys } from "@/lib/doctor-queue";
import { normalizeDoctorQueueAppointment } from "@/lib/doctor-queue/actions/doctor-queue.api";
import { useAuthStore } from "@/stores";
import type { DoctorQueueAppointment, SocketConnectionState } from "@/types";

export function useDoctorQueueSocket(date: string, doctorId?: string) {
	const queryClient = useQueryClient();
	const socket = useMemo(() => getQueueSocket(), []);
	const authDoctorId = useAuthStore((state) => state.user?.doctorProfileId ?? undefined);
	const resolvedDoctorId = doctorId ?? authDoctorId;
	const [connectionState, setConnectionState] = useState<SocketConnectionState>(socket.connected ? "connected" : "disconnected");

	useEffect(() => {
		function handleSnapshot(payload: { items: DoctorQueueAppointment[] }) {
			queryClient.setQueryData(doctorQueueKeys.date(date), payload.items.map(normalizeDoctorQueueAppointment));
		}

		function invalidate() {
			void queryClient.invalidateQueries({ queryKey: doctorQueueKeys.all });
		}

		function handleConnect() {
			setConnectionState("connected");
		}

		function handleReconnect() {
			setConnectionState("connected");
		}

		function handleDisconnect() {
			setConnectionState("disconnected");
		}

		function handleReconnectAttempt() {
			setConnectionState("reconnecting");
		}

		updateQueueSocketToken(getAccessToken());
		setConnectionState(socket.connected ? "connected" : "disconnected");
		socket.connect();
		socket.on("connect", handleConnect);
		socket.on("reconnect", handleReconnect);
		socket.on("disconnect", handleDisconnect);
		socket.on("reconnecting", handleReconnectAttempt);
		socket.on("queue.snapshot", handleSnapshot);
		socket.on("queue.updated", invalidate);
		socket.on("queue.removed", invalidate);

		return () => {
			socket.off("connect", handleConnect);
			socket.off("reconnect", handleReconnect);
			socket.off("disconnect", handleDisconnect);
			socket.off("reconnecting", handleReconnectAttempt);
			socket.off("queue.snapshot", handleSnapshot);
			socket.off("queue.updated", invalidate);
			socket.off("queue.removed", invalidate);
			socket.disconnect();
		};
	}, [date, queryClient, socket]);

	useEffect(() => {
		if (!resolvedDoctorId) {
			return;
		}

		socket.emit("queue.subscribe", { doctorId: resolvedDoctorId });

		return () => {
			socket.emit("queue.unsubscribe", { doctorId: resolvedDoctorId });
		};
	}, [resolvedDoctorId, socket]);

	return {
		connectionState,
		isReconnecting: connectionState === "reconnecting",
	};
}
