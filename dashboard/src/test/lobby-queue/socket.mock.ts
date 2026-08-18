import { vi } from "vitest";

type SocketListener = (...args: unknown[]) => void;

const listeners = new Map<string, Set<SocketListener>>();

export const mockSocket = {
	connected: false,
	on: vi.fn((event: string, handler: SocketListener) => {
		const handlers = listeners.get(event) ?? new Set<SocketListener>();
		handlers.add(handler);
		listeners.set(event, handlers);
		return mockSocket;
	}),
	off: vi.fn((event: string, handler: SocketListener) => {
		listeners.get(event)?.delete(handler);
		return mockSocket;
	}),
	emit: vi.fn(),
	connect: vi.fn(() => {
		mockSocket.connected = true;
		return mockSocket;
	}),
	disconnect: vi.fn(() => {
		mockSocket.connected = false;
		return mockSocket;
	}),
};

vi.mock("socket.io-client", () => ({
	io: vi.fn(() => mockSocket),
}));

export function triggerSocketEvent(event: string, ...args: unknown[]) {
	for (const handler of listeners.get(event) ?? []) {
		handler(...args);
	}
}

export function resetSocketMock() {
	listeners.clear();
	mockSocket.connected = false;
	mockSocket.on.mockClear();
	mockSocket.off.mockClear();
	mockSocket.emit.mockClear();
	mockSocket.connect.mockClear();
	mockSocket.disconnect.mockClear();
}
