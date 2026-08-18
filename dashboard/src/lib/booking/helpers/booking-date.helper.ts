import { CLINIC_TIMEZONE } from "@/constants";

export function getClinicTodayDate(): string {
	const now = new Date();
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: CLINIC_TIMEZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	return formatter.format(now);
}

export function isPastClinicDate(dateStr: string): boolean {
	const today = getClinicTodayDate();
	return dateStr < today;
}

export function getDayBounds(dateStr: string): { from: string; to: string } {
	return { from: dateStr, to: dateStr };
}

export function formatClinicDate(dateStr: string, locale: string): string {
	const [year, month, day] = dateStr.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return new Intl.DateTimeFormat(locale, {
		timeZone: CLINIC_TIMEZONE,
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
}

export function formatClinicTimeRange(startsAt: string, endsAt: string, locale: string): string {
	const startFormatter = new Intl.DateTimeFormat(locale, {
		timeZone: CLINIC_TIMEZONE,
		hour: "2-digit",
		minute: "2-digit",
	});
	const endFormatter = new Intl.DateTimeFormat(locale, {
		timeZone: CLINIC_TIMEZONE,
		hour: "2-digit",
		minute: "2-digit",
	});
	const startStr = startFormatter.format(new Date(startsAt));
	const endStr = endFormatter.format(new Date(endsAt));
	return `${startStr} - ${endStr}`;
}
