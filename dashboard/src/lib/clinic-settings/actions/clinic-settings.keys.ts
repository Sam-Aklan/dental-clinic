export const clinicSettingsKeys = {
	all: ["clinic-settings"] as const,
	bookingRules: () => [...clinicSettingsKeys.all, "booking-rules"] as const,
	workingHours: () => [...clinicSettingsKeys.all, "working-hours"] as const,
	holidayClosures: () => [...clinicSettingsKeys.all, "holidays"] as const,
};
