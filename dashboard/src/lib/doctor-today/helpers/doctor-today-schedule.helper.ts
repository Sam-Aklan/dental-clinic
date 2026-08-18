import dayjs from "dayjs";
import type { DoctorTodayScheduleAppointmentDTO, DoctorTodayScheduleRow } from "@/types";

export function sortDoctorTodayAppointments(appointments: DoctorTodayScheduleAppointmentDTO[]) {
	return [...appointments].sort((left, right) => {
		const startDiff = dayjs(left.startsAt).valueOf() - dayjs(right.startsAt).valueOf();
		if (startDiff !== 0) return startDiff;
		return left.patientSequence - right.patientSequence;
	});
}

export function formatDoctorTodayDurationLabel(startsAt: string, endsAt: string) {
	const minutes = Math.max(dayjs(endsAt).diff(dayjs(startsAt), "minute"), 0);
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function isDoctorTodayInSession(appointment: DoctorTodayScheduleAppointmentDTO) {
	return appointment.status === "IN_PROGRESS";
}

export function buildDoctorTodayScheduleRows(appointments: DoctorTodayScheduleAppointmentDTO[], minGapMinutes = 15): DoctorTodayScheduleRow[] {
	const sorted = sortDoctorTodayAppointments(appointments);
	const rows: DoctorTodayScheduleRow[] = [];

	sorted.forEach((appointment, index) => {
		rows.push({ kind: "appointment", data: appointment });

		const next = sorted[index + 1];
		if (!next) return;

		const gapMinutes = dayjs(next.startsAt).diff(dayjs(appointment.endsAt), "minute");
		if (gapMinutes >= minGapMinutes) {
			rows.push({ kind: "gap", durationMinutes: gapMinutes });
		}
	});

	return rows;
}
