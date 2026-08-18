import type { AppointmentStatus } from "@/types";

export const APPOINTMENT_STATUS_CHART_COLORS: Record<AppointmentStatus, string> = {
	PENDING: "var(--chart-status-pending)",
	CONFIRMED: "var(--chart-status-confirmed)",
	IN_PROGRESS: "var(--chart-status-in-progress)",
	COMPLETED: "var(--chart-status-completed)",
	CANCELED: "var(--chart-status-canceled)",
	NO_SHOW: "var(--chart-status-no-show)",
};

export const APPOINTMENT_TREND_CHART_COLORS = {
	confirmed: APPOINTMENT_STATUS_CHART_COLORS.CONFIRMED,
	completed: APPOINTMENT_STATUS_CHART_COLORS.COMPLETED,
	canceled: APPOINTMENT_STATUS_CHART_COLORS.CANCELED,
	noShow: APPOINTMENT_STATUS_CHART_COLORS.NO_SHOW,
} as const;

export const CANCELLATION_TREND_CHART_COLORS = {
	canceledByPatient: "var(--chart-cancellation-patient)",
	canceledByStaff: "var(--chart-cancellation-staff)",
	noShow: APPOINTMENT_STATUS_CHART_COLORS.NO_SHOW,
} as const;
