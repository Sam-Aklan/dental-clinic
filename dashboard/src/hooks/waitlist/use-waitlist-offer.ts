import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { waitlistOfferQueryOptions } from "@/lib/waitlist/actions/waitlist.queries";
import { acceptWaitlistOffer, declineWaitlistOffer } from "@/lib/waitlist/actions/waitlist.api";
import { getWaitlistOfferErrorState } from "@/lib/waitlist/helpers/waitlist-offer.helper";
import type { OfferErrorCode, OfferPageState } from "@/types";

export function useWaitlistOfferQuery(offerId: string) {
  return useQuery(waitlistOfferQueryOptions(offerId));
}

export function useAcceptWaitlistOfferMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => acceptWaitlistOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  });
}

export function useDeclineWaitlistOfferMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => declineWaitlistOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist"] });
      queryClient.invalidateQueries({ queryKey: ["slots"] });
    },
  });
}

export function useWaitlistOfferActions(offerId: string) {
  const acceptMutation = useAcceptWaitlistOfferMutation();
  const declineMutation = useDeclineWaitlistOfferMutation();

  const accept = useCallback(() => {
    return acceptMutation.mutateAsync(offerId);
  }, [acceptMutation, offerId]);

  const decline = useCallback(() => {
    return declineMutation.mutateAsync(offerId);
  }, [declineMutation, offerId]);

  return {
    accept,
    decline,
    acceptMutation,
    declineMutation,
  };
}

export function useWaitlistOfferErrorHandler() {
  const handleMutationError = useCallback(
    (error: unknown): { pageState: OfferPageState; code?: OfferErrorCode } | null => {
      const axiosError = error as { status?: number; response?: { data?: { code?: string; message?: string } } } | undefined;
      const code = axiosError?.response?.data?.code as OfferErrorCode | undefined;

      if (code === "ALREADY_ACCEPTED" || code === "ALREADY_DECLINED") {
        return null;
      }

      return getWaitlistOfferErrorState(error);
    },
    [],
  );

  return { handleMutationError };
}
