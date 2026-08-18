import dayjs from "dayjs";
import type { DoctorQueueAppointment, DoctorQueueFilterState, DoctorQueueSection, DoctorQueueSummary } from "@/types";

const WAITING_THRESHOLD_MINUTES = 30;

export function formatDoctorQueuePatientLabel(queuePosition: number) {
	return `#${queuePosition}`;
}

export function formatDoctorQueueNotePreview(notes: string | null) {
	if (!notes?.trim()) return "";
	return notes.trim().length > 80 ? `${notes.trim().slice(0, 77)}...` : notes.trim();
}

export function sortDoctorQueueAppointments(appointments: DoctorQueueAppointment[]) {
	return [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

function isWaiting(appointment: DoctorQueueAppointment, now = dayjs()) {
	return ["PENDING", "CONFIRMED"].includes(appointment.status) && dayjs(appointment.startsAt).diff(now, "minute") <= WAITING_THRESHOLD_MINUTES;
}

function isFollowUpEligible(appointment: DoctorQueueAppointment) {
	return appointment.status === "COMPLETED" && appointment.needsFollowUp && !appointment.followUpId;
}

export function buildDoctorQueueSummary(appointments: DoctorQueueAppointment[], now = dayjs()): DoctorQueueSummary {
	return appointments.reduce<DoctorQueueSummary>(
		(summary, appointment) => {
			if (appointment.status === "IN_PROGRESS") summary.inSession += 1;
			if (["PENDING", "CONFIRMED"].includes(appointment.status) && isWaiting(appointment, now)) summary.waiting += 1;
			if (["PENDING", "CONFIRMED"].includes(appointment.status) && !isWaiting(appointment, now)) summary.upcoming += 1;
			if (appointment.status === "COMPLETED") summary.completed += 1;
			if (appointment.status === "NO_SHOW") summary.noShow += 1;
			return summary;
		},
		{ inSession: 0, waiting: 0, upcoming: 0, completed: 0, noShow: 0 },
	);
}

export function buildDoctorQueueSections(appointments: DoctorQueueAppointment[], filters: DoctorQueueFilterState, now = dayjs()): DoctorQueueSection[] {
	const filtered = appointments.filter((appointment) => {
		if (filters.statuses.length > 0 && !filters.statuses.includes(appointment.status)) return false;
		return true;
	});

	const inSession = sortDoctorQueueAppointments(filtered.filter((appointment) => appointment.status === "IN_PROGRESS"));
	const waiting = sortDoctorQueueAppointments(filtered.filter((appointment) => ["PENDING", "CONFIRMED"].includes(appointment.status) && isWaiting(appointment, now)));
	const upcoming = sortDoctorQueueAppointments(filtered.filter((appointment) => ["PENDING", "CONFIRMED"].includes(appointment.status) && !isWaiting(appointment, now)));
	const followUp = sortDoctorQueueAppointments(filtered.filter((appointment) => isFollowUpEligible(appointment)));
	const finished = [...filtered.filter((appointment) => ["COMPLETED", "NO_SHOW", "CANCELED"].includes(appointment.status) && !isFollowUpEligible(appointment))].sort((a, b) => b.startsAt.localeCompare(a.startsAt));

	return [
		{ key: "inSession", appointments: inSession },
		{ key: "waiting", appointments: waiting },
		{ key: "upcoming", appointments: upcoming },
		{ key: "followUp", appointments: followUp },
		{ key: "finished", appointments: finished },
	];
}
