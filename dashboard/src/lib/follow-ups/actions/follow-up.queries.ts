import { queryOptions } from "@tanstack/react-query";
import { followUpKeys } from "./follow-up.keys";
import { getFollowUpSlots, type FollowUpSlotsQueryParams } from "./follow-up.api";

export function followUpSlotsQueryOptions(params: FollowUpSlotsQueryParams | null) {
	return queryOptions({
		queryKey: params ? followUpKeys.slots(params.doctorId, params.from, params.to) : followUpKeys.all,
		queryFn: () => {
			if (!params) {
				return Promise.resolve([]);
			}
			return getFollowUpSlots(params);
		},
		enabled: Boolean(params?.doctorId && params?.from && params?.to),
		staleTime: 30_000,
	});
}
