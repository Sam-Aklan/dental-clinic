import { format, parseISO } from "date-fns";
import type { WaitlistEntryDTO } from "@/types";

export function formatDoctorName(entry: WaitlistEntryDTO): string {
	return [entry.doctor.firstName, entry.doctor.lastName].filter(Boolean).join(" ");
}

export function formatPosition(position: number | undefined): string | null {
	if (position === undefined || position <= 0) return null;
	return `Position #${position}`;
}

export function formatAvailability(availableFrom: string | null, availableUntil: string | null): string {
	const hasFrom = !!availableFrom;
	const hasUntil = !!availableUntil;
	if (hasFrom && hasUntil) {
		return `${availableFrom} - ${availableUntil}`;
	}
	return "waitlist.anyTime";
}

export function formatJoinedDate(createdAt: string): string {
	return format(parseISO(createdAt), "d MMMM yyyy");
}
