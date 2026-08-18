import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { lobbyActiveEntriesFixture, lobbyDoctorFixture } from "./fixtures";
import { mockSocket, resetSocketMock, triggerSocketEvent } from "./socket.mock";

import { useLobbyQueue } from "@/hooks/lobby-queue";

	afterEach(() => {
		resetSocketMock();
	});

describe("useLobbyQueue", () => {
	it("subscribes and replaces queue snapshots", async () => {
		const { result } = renderHook(() => useLobbyQueue(lobbyDoctorFixture.doctorId, "signed-token"));
		await waitFor(() => expect(mockSocket.on).toHaveBeenCalled());

		await act(async () => {
			triggerSocketEvent("connect");
			triggerSocketEvent("queue.snapshot", {
				doctorId: lobbyDoctorFixture.doctorId,
				doctorDisplayName: lobbyDoctorFixture.displayName,
				items: lobbyActiveEntriesFixture,
			});
		});

		await waitFor(() => expect(result.current.connectionState).toBe("connected"));
		expect(result.current.doctorDisplay?.displayName).toBe(lobbyDoctorFixture.displayName);
		expect(result.current.sections.inProgress?.position).toBe(3);
	});

	it("shows reconnecting state while the socket reconnects", async () => {
		const { result } = renderHook(() => useLobbyQueue(lobbyDoctorFixture.doctorId, "signed-token"));
		expect(mockSocket.on).toHaveBeenCalled();
		await act(async () => {
			triggerSocketEvent("disconnect");
		});
		expect(result.current.connectionState).toBe("offline");

		await act(async () => {
			triggerSocketEvent("reconnecting");
		});
		expect(result.current.connectionState).toBe("reconnecting");

		await act(async () => {
			triggerSocketEvent("connect");
		});
		expect(result.current.connectionState).toBe("connected");
	});

	it("surfaces invalid kiosk token errors from the socket", async () => {
		const { result } = renderHook(() => useLobbyQueue(lobbyDoctorFixture.doctorId, "signed-token"));

		await act(async () => {
			triggerSocketEvent("exception", { message: "unauthorized" });
		});

		expect(result.current.error?.status).toBe(401);
		expect(result.current.error?.message).toBe("Invalid or expired lobby link");
	});
});
