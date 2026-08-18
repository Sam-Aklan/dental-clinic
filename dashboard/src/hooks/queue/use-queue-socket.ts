import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueueSocket, updateQueueSocketToken } from "@/lib/socket";
import { queueKeys } from "@/lib/queue";
import { getAccessToken } from "@/lib/axios-instance";
import type { ConnectionStatus } from "@/types";

export function useQueueSocket(doctorIds: string[], onUpdate?: () => void) {
	const queryClient = useQueryClient();
	const socket = useMemo(() => getQueueSocket(), []);
	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(socket.connected ? "connected" : "offline");
	const doctorIdsKey = doctorIds.join("|");

	useEffect(() => {
		function handleUpdate() {
			void queryClient.invalidateQueries({ queryKey: queueKeys.all });
			onUpdate?.();
		}

		function handleDisconnect() {
			setConnectionStatus("offline");
		}

		function handleConnectError() {
			setConnectionStatus("reconnecting");
		}

		function handleConnect() {
			setConnectionStatus("connected");
		}

		updateQueueSocketToken(getAccessToken());
		setConnectionStatus(socket.connected ? "connected" : "offline");
		socket.on("queue.updated", handleUpdate);
		socket.on("queue.removed", handleUpdate);
		socket.on("disconnect", handleDisconnect);
		socket.on("connect_error", handleConnectError);
		socket.on("connect", handleConnect);
		socket.connect();

		return () => {
			socket.off("queue.updated", handleUpdate);
			socket.off("queue.removed", handleUpdate);
			socket.off("disconnect", handleDisconnect);
			socket.off("connect_error", handleConnectError);
			socket.off("connect", handleConnect);
			socket.disconnect();
		};
	}, [onUpdate, queryClient, socket]);

	useEffect(() => {
		for (const doctorId of doctorIds) {
			socket.emit("queue.subscribe", { doctorId });
		}

		return () => {
			for (const doctorId of doctorIds) {
				socket.emit("queue.unsubscribe", { doctorId });
			}
		};
	}, [doctorIdsKey, doctorIds, socket]);

	return { connectionStatus, isReconnecting: connectionStatus !== "connected" };
}
