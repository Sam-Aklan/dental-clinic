import { describe, expect, it } from "vitest";
import { deriveLobbyQueueSections } from "@/lib/lobby-queue";
import { lobbyActiveEntriesFixture, lobbyHiddenEntriesFixture, lobbyPrivateEntryFixture } from "./fixtures";

describe("deriveLobbyQueueSections", () => {
	it("sorts, filters, and caps the waiting list", () => {
		const result = deriveLobbyQueueSections([...lobbyHiddenEntriesFixture, ...lobbyActiveEntriesFixture]);

		expect(result.inProgress?.position).toBe(3);
		expect(result.nextUp?.position).toBe(4);
		expect(result.visibleWaiting).toHaveLength(8);
		expect(result.waitingOverflow).toBe(2);
		expect(result.waiting.every((entry) => entry.status !== "COMPLETED" && entry.status !== "CANCELED" && entry.status !== "NO_SHOW")).toBe(true);
	});

	it("sanitizes private runtime fields", () => {
		const result = deriveLobbyQueueSections([lobbyPrivateEntryFixture as never]);

		expect(Object.keys(result.nextUp ?? {})).toEqual(["appointmentId", "position", "startsAt", "endsAt", "notes", "status"]);
		expect(JSON.stringify(result)).not.toContain("Hidden Patient");
		expect(JSON.stringify(result)).not.toContain("patient-4");
	});
});
