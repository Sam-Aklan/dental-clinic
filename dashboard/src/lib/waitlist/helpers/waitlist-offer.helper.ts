import dayjs from "dayjs";
import type { WaitlistOfferDTO, OfferTimeRemaining, OfferPageState, OfferErrorCode, OfferStatus } from "@/types";
import type { UseQueryResult } from "@tanstack/react-query";

export function getOfferTimeRemaining(expiresAt: string): OfferTimeRemaining {
  const ms = Math.max(0, dayjs(expiresAt).diff(dayjs()));
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  const formatted =
    hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;
  return { msRemaining: ms, isExpired: ms === 0, formatted };
}

export function getWaitlistOfferPageState(
  offer: WaitlistOfferDTO | undefined,
  queryState: { isPending: boolean; isError: boolean; error: unknown },
): OfferPageState {
  if (queryState.isPending && !offer) return "loading";

  if (queryState.isError) {
    const axiosError = queryState.error as { status?: number } | undefined;
    if (axiosError?.status === 404) return "not-found";
    if (axiosError?.status === 403) return "forbidden";
    return "error";
  }

  if (!offer) return "loading";

  const status = offer.status as OfferStatus;

  if (status === "EXPIRED") return "expired";
  if (status === "ACCEPTED") return "accepted";
  if (status === "DECLINED") return "declined";
  if (status === "PENDING") {
    const remaining = getOfferTimeRemaining(offer.expiresAt);
    if (remaining.isExpired) return "expired";
    return "pending";
  }

  return "error";
}

export function isWaitlistOfferActionDisabled(pageState: OfferPageState): boolean {
  return pageState !== "pending";
}

export function getWaitlistOfferErrorState(
  error: unknown,
): { pageState: OfferPageState; code?: OfferErrorCode } {
  const axiosError = error as { status?: number; response?: { data?: { code?: string } } } | undefined;
  const status = axiosError?.status;
  const code = axiosError?.response?.data?.code as OfferErrorCode | undefined;

  if (status === 404) return { pageState: "not-found" };
  if (status === 403) return { pageState: "forbidden" };
  if (code === "OFFER_EXPIRED") return { pageState: "expired", code };
  if (code === "SLOT_UNAVAILABLE") return { pageState: "expired", code };

  return { pageState: "error", code };
}

export type OfferQueryState = Pick<UseQueryResult<WaitlistOfferDTO>, "isPending" | "isError" | "error">;
