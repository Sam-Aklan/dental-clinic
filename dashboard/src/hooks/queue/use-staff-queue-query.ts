import { useQuery } from "@tanstack/react-query";
import { staffQueueQueryOptions } from "@/lib/queue";
import type { StaffQueueQueryParams } from "@/types";

export function useStaffQueueQuery(params: StaffQueueQueryParams) {
	return useQuery(staffQueueQueryOptions(params));
}
