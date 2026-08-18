import { queryOptions } from "@tanstack/react-query";
import { waitlistKeys } from "./waitlist.keys";
import { getMyWaitlist, getWaitlistOffer } from "./waitlist.api";
import type { WaitlistOfferDTO } from "@/types";

export function waitlistQueryOptions() {
  return queryOptions({
    queryKey: waitlistKeys.mine(),
    queryFn: getMyWaitlist,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function waitlistOfferQueryOptions(offerId: string) {
  return queryOptions<WaitlistOfferDTO>({
    queryKey: waitlistKeys.offer(offerId),
    queryFn: () => getWaitlistOffer(offerId),
    staleTime: 0,
    refetchInterval: (query) => {
      if (query.state.data?.status === "PENDING") {
        return 30_000;
      }
      return false;
    },
  });
}
