import type { DoctorFilters } from "@/types";

export const doctorsKeys = {
	all: ["doctors"] as const,
	lists: () => [...doctorsKeys.all, "list"] as const,
	list: (filters: DoctorFilters) => [...doctorsKeys.lists(), filters] as const,
	detail: (id: string) => [...doctorsKeys.all, "detail", id] as const,
	overrides: (doctorId: string) => [...doctorsKeys.all, "overrides", doctorId] as const,
};
