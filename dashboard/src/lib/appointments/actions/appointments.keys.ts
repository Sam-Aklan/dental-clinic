import type { AppointmentListParams } from "@/types";

export const appointmentsKeys = {
	all: ["appointments"] as const,
	lists: () => [...appointmentsKeys.all, "list"] as const,
	list: (params: AppointmentListParams) => [...appointmentsKeys.lists(), params] as const,
	cancel: (appointmentId: string) => [...appointmentsKeys.all, "cancel", appointmentId] as const,
};
