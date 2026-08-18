import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const socketMocks = vi.hoisted(() => {
	const handlers = new Map<string, Set<(...args: unknown[]) => void>>();

	const socket = {
		connected: false,
		on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
			if (!handlers.has(event)) handlers.set(event, new Set());
			handlers.get(event)?.add(handler);
			return socket;
		}),
		off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
			handlers.get(event)?.delete(handler);
			return socket;
		}),
		emit: vi.fn(),
		connect: vi.fn(() => {
			socket.connected = true;
			return socket;
		}),
		disconnect: vi.fn(() => {
			socket.connected = false;
			return socket;
		}),
		trigger(event: string, ...args: unknown[]) {
			handlers.get(event)?.forEach((handler) => handler(...args));
		},
		reset() {
			handlers.clear();
			socket.connected = false;
			socket.on.mockClear();
			socket.off.mockClear();
			socket.emit.mockClear();
			socket.connect.mockClear();
			socket.disconnect.mockClear();
		},
	};

	return {
		socket,
		getQueueSocket: vi.fn(() => socket),
		updateQueueSocketToken: vi.fn(),
		getAccessToken: vi.fn(() => "token"),
	};
});

vi.mock("@/lib/socket", () => ({
	getQueueSocket: socketMocks.getQueueSocket,
	updateQueueSocketToken: socketMocks.updateQueueSocketToken,
}));

vi.mock("@/lib/axios-instance", () => ({
	getAccessToken: socketMocks.getAccessToken,
}));

import { useQueueSocket } from "@/hooks/queue";

afterEach(() => {
	socketMocks.socket.reset();
	vi.clearAllMocks();
});

describe("useQueueSocket", () => {
	it("starts as connected when the shared socket is already connected", () => {
		socketMocks.socket.connected = true;
		const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

		const { result } = renderHook(() => useQueueSocket(["doctor-1"]), { wrapper });

		expect(result.current.connectionStatus).toBe("connected");
		expect(socketMocks.socket.disconnect).not.toHaveBeenCalled();
	});

	it("does not disconnect the shared socket when doctor subscriptions change", () => {
		const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

		const { rerender } = renderHook(({ doctorIds }: { doctorIds: string[] }) => useQueueSocket(doctorIds), {
			initialProps: { doctorIds: ["doctor-1"] },
			wrapper,
		});

		socketMocks.socket.disconnect.mockClear();
		socketMocks.socket.emit.mockClear();
		rerender({ doctorIds: ["doctor-1", "doctor-2"] });

		expect(socketMocks.socket.disconnect).not.toHaveBeenCalled();
		expect(socketMocks.socket.emit).toHaveBeenCalledWith("queue.unsubscribe", { doctorId: "doctor-1" });
		expect(socketMocks.socket.emit).toHaveBeenCalledWith("queue.subscribe", { doctorId: "doctor-2" });
	});
});
