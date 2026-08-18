import { useQuery } from "@tanstack/react-query";
import { followUpSlotsQueryOptions, type FollowUpSlotsQueryParams } from "@/lib/follow-ups";

export function useFollowUpSlotsQuery(params: FollowUpSlotsQueryParams | null) {
	return useQuery(followUpSlotsQueryOptions(params));
}
