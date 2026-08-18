import type { QueryClient } from "@tanstack/react-query";
import { waitlistKeys } from "./waitlist.keys";
import { joinWaitlist, updateWaitlistWindow, leaveWaitlist, acceptWaitlistOffer, declineWaitlistOffer } from "./waitlist.api";
import type { JoinWaitlistDTO, UpdateWaitlistWindowDTO } from "@/types";

export function createJoinWaitlistMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (payload: JoinWaitlistDTO) => joinWaitlist(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: waitlistKeys.all }),
  };
}

export function createUpdateWaitlistWindowMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: ({ id, payload }: { id: string; payload: UpdateWaitlistWindowDTO }) =>
      updateWaitlistWindow(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: waitlistKeys.all }),
  };
}

export function createLeaveWaitlistMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (id: string) => leaveWaitlist(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: waitlistKeys.all }),
  };
}

export function createAcceptWaitlistOfferMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (offerId: string) => acceptWaitlistOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: waitlistKeys.all });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  };
}

export function createDeclineWaitlistOfferMutationOptions(queryClient: QueryClient) {
  return {
    mutationFn: (offerId: string) => declineWaitlistOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: waitlistKeys.all });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  };
}
