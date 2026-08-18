import type { UserFilters } from "@/types";

export const usersKeys = {
	all: ["users"] as const,
	lists: () => [...usersKeys.all, "list"] as const,
	list: (filters: UserFilters) => [...usersKeys.lists(), filters] as const,
	detail: (id: string) => [...usersKeys.all, "detail", id] as const,
};
