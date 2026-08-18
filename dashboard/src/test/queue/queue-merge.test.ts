import { describe, expect, it } from "vitest";
import { ACTIVE_STATUSES, applyRemovedEvent, applyRemovedFromMap, applyUpdatedEvent, applyUpdatedToMap } from "@/lib/queue";
import type { QueueItem, QueueRemovedEvent, QueueUpdatedEvent } from "@/types";

const baseItems: QueueItem[] = [
	{ appointmentId: "appt-1", position: 1, status: "PENDING", startsAt: "2026-05-11T08:00:00Z", endsAt: "2026-05-11T08:15:00Z", notes: null },
	{ appointmentId: "appt-2", position: 2, status: "CONFIRMED", startsAt: "2026-05-11T08:15:00Z", endsAt: "2026-05-11T08:30:00Z", notes: "Call on arrival" },
];

describe("queue merge helpers", () => {
	it("exposes the active status list", () => {
		expect(ACTIVE_STATUSES).toEqual(["PENDING", "CONFIRMED", "IN_PROGRESS"]);
	});

	it("applies updated events and removes inactive items", () => {
		const updated: QueueUpdatedEvent = {
			appointmentId: "appt-2",
			doctorId: "doctor-1",
			position: 0,
			status: "IN_PROGRESS",
			startsAt: "2026-05-11T08:15:00Z",
			endsAt: "2026-05-11T08:30:00Z",
			notes: "Call on arrival",
			updatedAt: "2026-05-11T08:16:00Z",
		};

		const inactive: QueueUpdatedEvent = {
			...updated,
			status: "COMPLETED",
			position: null,
		};

		expect(applyUpdatedToMap(baseItems, updated)).toEqual([
			{ ...baseItems[1], position: 0, status: "IN_PROGRESS" },
			baseItems[0],
		]);
		expect(applyUpdatedToMap(baseItems, inactive)).toEqual([baseItems[0]]);
	});

	it("ignores cross-doctor events", () => {
		const updated: QueueUpdatedEvent = {
			appointmentId: "appt-2",
			doctorId: "doctor-2",
			position: 1,
			status: "IN_PROGRESS",
			startsAt: "2026-05-11T08:15:00Z",
			endsAt: "2026-05-11T08:30:00Z",
			notes: "Call on arrival",
			updatedAt: "2026-05-11T08:16:00Z",
		};

		expect(applyUpdatedToMap(baseItems, updated, "doctor-1")).toEqual(baseItems);
	});

	it("applies removal events to map helpers", () => {
		const removed: QueueRemovedEvent = { appointmentId: "appt-1", doctorId: "doctor-1" };
		const map = new Map(baseItems.map((item) => [item.appointmentId, item] as const));

		expect(applyUpdatedEvent(map, {
			appointmentId: "appt-1",
			doctorId: "doctor-1",
			position: 3,
			status: "PENDING",
			startsAt: "2026-05-11T08:45:00Z",
			endsAt: "2026-05-11T09:00:00Z",
			notes: null,
			updatedAt: "2026-05-11T08:46:00Z",
		})).toBe(map);

		expect(applyRemovedEvent(map, removed)).toBe(map);
		expect([...map.values()]).toEqual([baseItems[1]]);
		expect(applyRemovedFromMap(baseItems, removed)).toEqual([baseItems[1]]);
	});
});
