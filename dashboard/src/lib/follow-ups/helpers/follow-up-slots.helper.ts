import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { CLINIC_TIMEZONE } from "@/constants";
import type { AvailableSlot, FollowUpSlotGroup } from "@/types";

dayjs.extend(utc);
dayjs.extend(timezone);

export function isFutureFollowUpSlot(startsAt: string, referenceDate: Date = new Date()): boolean {
	return dayjs(startsAt).tz(CLINIC_TIMEZONE).isAfter(dayjs(referenceDate).tz(CLINIC_TIMEZONE));
}

export function filterFutureFollowUpSlots(slots: AvailableSlot[], referenceDate: Date = new Date()): AvailableSlot[] {
	return slots.filter((slot) => isFutureFollowUpSlot(slot.startsAt, referenceDate));
}

export function getFollowUpClinicDayBounds(dateStr: string): { from: string; to: string } {
	return { from: dateStr, to: dateStr };
}

export function groupFollowUpSlotsByPeriod(slots: AvailableSlot[]): FollowUpSlotGroup[] {
	const groups: Record<FollowUpSlotGroup["period"], AvailableSlot[]> = { morning: [], afternoon: [], evening: [] };
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
	return (["morning", "afternoon", "evening"] as const).flatMap((period) => (groups[period].length > 0 ? [{ period, slots: groups[period] }] : []));
}

function getClinicHour(isoString: string): number {
	return parseInt(new Intl.DateTimeFormat("en-US", { timeZone: CLINIC_TIMEZONE, hour: "numeric", hour12: false }).format(new Date(isoString)), 10);
}
