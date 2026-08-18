import type { AvailableSlotDTO, SlotGroup } from "@/types";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { CLINIC_TIMEZONE } from "@/constants";

dayjs.extend(utc);
dayjs.extend(timezone);

export function isFutureClinicSlot(startsAt: string, referenceDate: Date = new Date()): boolean {
	const now = dayjs(referenceDate).tz(CLINIC_TIMEZONE);
	return dayjs(startsAt).tz(CLINIC_TIMEZONE).isAfter(now);
}

export function filterFutureSlots(slots: AvailableSlotDTO[], referenceDate: Date = new Date()): AvailableSlotDTO[] {
	return slots.filter((slot) => isFutureClinicSlot(slot.startsAt, referenceDate));
}

export function groupSlotsByClinicTime(slots: AvailableSlotDTO[]): SlotGroup[] {
	const groups: { morning: AvailableSlotDTO[]; afternoon: AvailableSlotDTO[]; evening: AvailableSlotDTO[] } = {
		morning: [],
		afternoon: [],
		evening: [],
	};

	for (const slot of slots) {
		const hour = getClinicHour(slot.startsAt);
		if (hour < 12) {
			groups.morning.push(slot);
		} else if (hour < 17) {
			groups.afternoon.push(slot);
		} else {
			groups.evening.push(slot);
		}
	}

	const result: SlotGroup[] = [];

	if (groups.morning.length > 0) {
		result.push({ label: "morning", i18nKey: "booking.slotGroups.morning", slots: groups.morning });
	}
	if (groups.afternoon.length > 0) {
		result.push({ label: "afternoon", i18nKey: "booking.slotGroups.afternoon", slots: groups.afternoon });
	}
	if (groups.evening.length > 0) {
		result.push({ label: "evening", i18nKey: "booking.slotGroups.evening", slots: groups.evening });
	}

	return result;
}

export function findSlotByStart(slots: AvailableSlotDTO[], startsAt: string): AvailableSlotDTO | undefined {
	return slots.find((slot) => slot.startsAt === startsAt);
}

function getClinicHour(isoString: string): number {
	const date = new Date(isoString);
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: CLINIC_TIMEZONE,
		hour: "numeric",
		hour12: false,
	});
	return parseInt(formatter.format(date), 10);
}
