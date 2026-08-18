import type { AppointmentStatus, StaffQueueAppointmentDTO } from "@/types";

export const STAFF_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
	PENDING: ["CONFIRMED", "CANCELED"],
	CONFIRMED: ["IN_PROGRESS", "NO_SHOW", "CANCELED"],
	IN_PROGRESS: ["COMPLETED"],
	COMPLETED: [],
	CANCELED: [],
	NO_SHOW: [],
};

export function isValidTransition(current: AppointmentStatus, next: AppointmentStatus) {
	return STAFF_TRANSITIONS[current].includes(next);
}

export function getVisibleStaffTransitions(appointment: StaffQueueAppointmentDTO, now = new Date()) {
	return STAFF_TRANSITIONS[appointment.status].filter((status) => {
		if (status !== "NO_SHOW") return true;
		return appointment.status === "CONFIRMED" && new Date(appointment.startsAt).getTime() <= now.getTime();
	});
}
