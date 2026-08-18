import dayjs from "dayjs";

export function formatLobbyQueueTime(value: string) {
	return dayjs(value).format("h:mm A");
}

export function formatLobbyUpdatedAt(value: Date | string) {
	return dayjs(value).format("h:mm A");
}
