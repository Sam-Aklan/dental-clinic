import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { CLINIC_TIMEZONE } from "@/constants";

dayjs.extend(utc);
dayjs.extend(timezone);

export function toClinicDate(date: string | Date, timezoneName = CLINIC_TIMEZONE) {
	return dayjs(date).tz(timezoneName).format("YYYY-MM-DD");
}

export function todayClinicDate(referenceDate = new Date(), timezoneName = CLINIC_TIMEZONE) {
	return toClinicDate(referenceDate, timezoneName);
}

export function toClinicTime(date: string | Date, timezoneName = CLINIC_TIMEZONE) {
	return dayjs(date).tz(timezoneName).format("HH:mm");
}

export function weekStart(date: string | Date, timezoneName = CLINIC_TIMEZONE) {
	return dayjs(date).tz(timezoneName).startOf("week").format("YYYY-MM-DD");
}

export function weekEnd(date: string | Date, timezoneName = CLINIC_TIMEZONE) {
	return dayjs(date).tz(timezoneName).endOf("week").format("YYYY-MM-DD");
}

export function monthStart(date: string | Date, timezoneName = CLINIC_TIMEZONE) {
	return dayjs(date).tz(timezoneName).startOf("month").format("YYYY-MM-DD");
}

export function monthEnd(date: string | Date, timezoneName = CLINIC_TIMEZONE) {
	return dayjs(date).tz(timezoneName).endOf("month").format("YYYY-MM-DD");
}
