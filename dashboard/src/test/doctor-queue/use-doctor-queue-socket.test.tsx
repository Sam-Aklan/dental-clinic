import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
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

const authState = vi.hoisted(() => ({
	user: { doctorProfileId: "doctor-1" },
}));

vi.mock("@/lib/socket", () => ({
	getQueueSocket: socketMocks.getQueueSocket,
	updateQueueSocketToken: socketMocks.updateQueueSocketToken,
}));

vi.mock("@/lib/axios-instance", () => ({
	getAccessToken: socketMocks.getAccessToken,
}));

vi.mock("@/stores", () => ({
	useAuthStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}));

import { doctorQueueKeys } from "@/lib/doctor-queue";
import { useDoctorQueueSocket } from "@/hooks/doctor-queue";

afterEach(() => {
	socketMocks.socket.reset();
	vi.clearAllMocks();
	authState.user.doctorProfileId = "doctor-1";
});

describe("useDoctorQueueSocket", () => {
	it("subscribes with the authenticated doctor profile when no doctor id is passed", () => {
		const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

		renderHook(() => useDoctorQueueSocket("2026-05-11"), { wrapper });

		expect(socketMocks.socket.emit).toHaveBeenCalledWith("queue.subscribe", { doctorId: "doctor-1" });
	});

	it("writes queue snapshots into the active date query cache immediately", () => {
		const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

		renderHook(() => useDoctorQueueSocket("2026-05-11", "doctor-2"), { wrapper });

		act(() => {
			socketMocks.socket.trigger("queue.snapshot", {
				items: [{ appointmentId: "appt-1", updatedAt: "2026-05-11T09:00:00.000Z" }],
			});
		});

		expect(queryClient.getQueryData(doctorQueueKeys.date("2026-05-11"))).toEqual([
			{ appointmentId: "appt-1", id: "appt-1", updatedAt: "2026-05-11T09:00:00.000Z" },
		]);
	});
});
