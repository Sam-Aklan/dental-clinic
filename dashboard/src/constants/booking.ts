export const CLINIC_TIMEZONE = "Asia/Riyadh" as const;

export const STEP_IDS = ["doctor", "date", "time", "confirm"] as const;

export const SLOT_GROUP_IDS = ["morning", "afternoon", "evening"] as const;

export const DEFAULT_DAY_BOUNDS_HOURS = {
	fromHour: 0,
	toHour: 23,
} as const;
