import { io, type Socket } from "socket.io-client";
import { api, getAccessToken } from "@/lib/axios-instance";

let queueSocket: Socket | null = null;

export function getQueueSocketNamespaceUrl() {
	const baseUrl = api.defaults.baseURL;
	if (!baseUrl || baseUrl.startsWith("/")) {
		return "/queue";
	}

	return `${new URL(baseUrl).origin}/queue`;
}

export function getQueueSocket() {
	if (!queueSocket) {
		queueSocket = io(getQueueSocketNamespaceUrl(), {
			auth: { token: getAccessToken() ?? "" },
			withCredentials: true,
			autoConnect: false,
		});
	}

	return queueSocket;
}

export function updateQueueSocketToken(token: string | null) {
	const socket = getQueueSocket();
	socket.auth = { token: token ?? "" };
}
