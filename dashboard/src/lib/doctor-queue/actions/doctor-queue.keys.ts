import type { DoctorQueueFilterState } from "@/types";

export const doctorQueueKeys = {
	all: ["doctor-queue"] as const,
	clinicConfig: () => [...doctorQueueKeys.all, "clinic-config"] as const,
	date: (date: string) => [...doctorQueueKeys.all, "date", date] as const,
	filters: (filters: DoctorQueueFilterState) =>
		[...doctorQueueKeys.all, "filters", filters.showFinished ? "finished" : "active", filters.statuses.join(",")] as const,
	appointmentStatus: (id: string) => [...doctorQueueKeys.all, "status", id] as const,
	appointmentNote: (id: string) => [...doctorQueueKeys.all, "note", id] as const,
};
