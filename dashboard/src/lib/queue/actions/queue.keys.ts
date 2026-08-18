import type { StaffQueueQueryParams } from "@/types";

export const queueKeys = {
	all: ["queue"] as const,
	staffQueue: () => [...queueKeys.all, "staff"] as const,
	staffQueueFiltered: (filters: StaffQueueQueryParams) => [...queueKeys.staffQueue(), filters] as const,
	todaySummary: () => [...queueKeys.all, "today-summary"] as const,
	todayByDoctor: () => [...queueKeys.all, "today-by-doctor"] as const,
};
