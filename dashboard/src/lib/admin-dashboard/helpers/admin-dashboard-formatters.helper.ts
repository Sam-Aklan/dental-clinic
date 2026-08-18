import dayjs from "dayjs";
import type { AppointmentStatus, DashboardTab, StatusDistributionDTO } from "@/types";

const EN_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
const AR_WEEKDAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"] as const;

export function formatEmptyValue(locale: "en" | "ar" = "en") {
	return locale === "ar" ? "—" : "—";
}

export function formatPercent(value?: number | null, locale: "en" | "ar" = "en") {
	if (value === null || value === undefined || Number.isNaN(value)) return formatEmptyValue(locale);
	return `${Math.round(value * 100)}%`;
}

export function formatDelta(value?: number | null, locale: "en" | "ar" = "en") {
	if (value === null || value === undefined || Number.isNaN(value)) return locale === "ar" ? "الفترة الحالية" : "Current period";
	const pct = `${Math.abs(Math.round(value * 100))}%`;
	if (value === 0) return locale === "ar" ? `0%` : `0%`;
	return value > 0 ? `↑ +${pct}` : `↓ -${pct}`;
}

export function formatLocalizedDate(value: string, locale: "en" | "ar" = "en") {
	if (!value) return formatEmptyValue(locale);
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return formatEmptyValue(locale);
	return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}

export function formatAppointmentDateTime(value: string, locale: "en" | "ar" = "en") {
	if (!value) return formatEmptyValue(locale);
	const date = dayjs(value);
	if (!date.isValid()) return formatEmptyValue(locale);
	return date.format(locale === "ar" ? "YYYY/MM/DD HH:mm" : "YYYY-MM-DD HH:mm");
}

export function formatAvailabilityWindow(from?: string | null, until?: string | null, locale: "en" | "ar" = "en") {
	if (!from && !until) return locale === "ar" ? "في أي وقت" : "Any time";
	if (from && until) return `${from} - ${until}`;
	return from ?? until ?? (locale === "ar" ? "في أي وقت" : "Any time");
}

type NamedPerson = { id?: string; firstName?: string | null; lastName?: string | null };

export function formatDoctorName(doctor?: NamedPerson | null, locale: "en" | "ar" = "en") {
	if (!doctor) return formatEmptyValue(locale);
	const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(" ").trim();
	return fullName || formatEmptyValue(locale);
}

export function formatPatientName(patient?: NamedPerson | string | null, locale: "en" | "ar" = "en") {
	if (!patient) return formatEmptyValue(locale);
	if (typeof patient === "string") return patient.trim() || formatEmptyValue(locale);
	const fullName = [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim();
	return fullName || formatEmptyValue(locale);
}

export function formatWeekdayLabel(dayOfWeek: number, locale: "en" | "ar" = "en") {
	const normalized = ((dayOfWeek % 7) + 7) % 7;
	return (locale === "ar" ? AR_WEEKDAYS : EN_WEEKDAYS)[normalized];
}

export function formatKpiSummaryLabel(status: AppointmentStatus | DashboardTab) {
	return String(status);
}

export function formatStatusCounts(statuses: StatusDistributionDTO) {
	return Object.entries(statuses).map(([status, count]) => `${status}: ${count}`);
}
