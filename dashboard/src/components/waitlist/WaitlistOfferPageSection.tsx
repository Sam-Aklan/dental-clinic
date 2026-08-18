import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useWaitlistOfferQuery, useWaitlistOfferActions, useWaitlistOfferErrorHandler } from "@/hooks/waitlist";
import { getWaitlistOfferPageState, isWaitlistOfferActionDisabled } from "@/lib/waitlist/helpers/waitlist-offer.helper";
import { OfferCountdown } from "./OfferCountdown";
import { OfferDetailsCard } from "./OfferDetailsCard";
import { OfferActionDialog } from "./OfferActionDialog";
import { ROUTE_BOOK_APPOINTMENTS, ROUTE_WAITLIST, ROUTE_HOME } from "@/constants/routes";
import type { OfferPageState } from "@/types";

export function WaitlistOfferPageSection() {
  const { t } = useTranslation();
  const { _splat } = useParams({ from: "/_authenticated/_patient/offers/$" });
  const offerId = _splat?decodeURIComponent(_splat):"";
  const query = useWaitlistOfferQuery(offerId);
  const { accept, decline, acceptMutation, declineMutation } = useWaitlistOfferActions(offerId);
  const { handleMutationError } = useWaitlistOfferErrorHandler();
  const { data: offer } = query;

  const pageState: OfferPageState = getWaitlistOfferPageState(offer, {
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
  });

  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const actionsDisabled = isWaitlistOfferActionDisabled(pageState);

  async function handleAcceptConfirm() {
    setActionError(null);
    try {
      await accept();
      setAcceptDialogOpen(false);
    } catch (error) {
      const result = handleMutationError(error);
      if (result) {
        setActionError(result.code === "SLOT_UNAVAILABLE" ? t("offers.unavailable") : t("offers.acceptError"));
      }
    }
  }

  async function handleDeclineConfirm() {
    setActionError(null);
    try {
      await decline();
      setDeclineDialogOpen(false);
    } catch (error) {
      const result = handleMutationError(error);
      if (result) {
        setActionError(result.code === "SLOT_UNAVAILABLE" ? t("offers.unavailable") : t("offers.declineError"));
      }
    }
  }

  function handleCountdownExpired() {
    query.refetch();
  }

  if (pageState === "loading") {
    return (
      <div className="flex flex-col gap-4 p-6" data-testid="offer-loading">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (pageState === "not-found") {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center" data-testid="offer-not-found">
        <h2 className="text-xl font-semibold">{t("offers.notFound")}</h2>
        <Button asChild variant="outline">
          <Link to={ROUTE_WAITLIST}>{t("offers.goToWaitlist")}</Link>
        </Button>
      </div>
    );
  }

  if (pageState === "forbidden") {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center" data-testid="offer-forbidden">
        <h2 className="text-xl font-semibold">{t("offers.forbidden")}</h2>
        <Button asChild variant="outline">
          <Link to={ROUTE_HOME}>{t("offers.goHome")}</Link>
        </Button>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center" data-testid="offer-error">
        <h2 className="text-xl font-semibold">{t("offers.genericError")}</h2>
        <Button onClick={() => query.refetch()}>{t("offers.retry")}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6" data-testid="waitlist-offer-page">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-heading font-semibold">{t("offers.title")}</h1>

        {pageState === "accepted" && (
          <div
            aria-live="polite"
            aria-atomic="true"
            data-testid="offer-accepted-state"
          >
            <Alert variant="default">
              <AlertDescription>
                <p className="font-semibold">{t("offers.accepted")}</p>
                <p className="text-sm">{t("offers.acceptedDescription")}</p>
                <p className="text-sm mt-2">{t("offers.nextStepAppointments")}</p>
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button asChild>
                <Link to={ROUTE_BOOK_APPOINTMENTS}>{t("offers.goToAppointments")}</Link>
              </Button>
            </div>
          </div>
        )}

        {pageState === "declined" && (
          <div
            aria-live="polite"
            aria-atomic="true"
            data-testid="offer-declined-state"
          >
            <Alert variant="default">
              <AlertDescription>
                <p className="font-semibold">{t("offers.declined")}</p>
                <p className="text-sm">{t("offers.declinedDescription")}</p>
                <p className="text-sm mt-2">{t("offers.nextStepWaitlist")}</p>
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link to={ROUTE_WAITLIST}>{t("offers.goToWaitlist")}</Link>
              </Button>
            </div>
          </div>
        )}

        {pageState === "expired" && (
          <div
            aria-live="polite"
            aria-atomic="true"
            data-testid="offer-expired-state"
          >
            <Alert variant="destructive">
              <AlertDescription>
                <p className="font-semibold">{t("offers.expired")}</p>
                <p className="text-sm">{t("offers.safeNextStep")}</p>
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link to={ROUTE_WAITLIST}>{t("offers.goToWaitlist")}</Link>
              </Button>
            </div>
          </div>
        )}

        {pageState === "pending" && offer && (
          <div data-testid="offer-pending-state">
            <OfferDetailsCard offer={offer} />

            <div className="mt-4">
              <OfferCountdown
                expiresAt={offer.expiresAt}
                onExpired={handleCountdownExpired}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3" data-testid="offer-actions">
              <Button
                onClick={() => {
                  setActionError(null);
                  setAcceptDialogOpen(true);
                }}
                disabled={actionsDisabled || acceptMutation.isPending}
                data-testid="accept-offer-button"
              >
                {t("offers.accept")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setActionError(null);
                  setDeclineDialogOpen(true);
                }}
                disabled={actionsDisabled || declineMutation.isPending}
                data-testid="decline-offer-button"
              >
                {t("offers.decline")}
              </Button>
            </div>

            {actionError && (
              <Alert variant="destructive" className="mt-4" data-testid="offer-action-error">
                <AlertDescription>{actionError}</AlertDescription>
              </Alert>
            )}

            <OfferActionDialog
              open={acceptDialogOpen}
              onOpenChange={setAcceptDialogOpen}
              title={t("offers.acceptDialogTitle")}
              description={t("offers.acceptDialogDescription")}
              confirmLabel={t("offers.accept")}
              cancelLabel={t("offers.cancel")}
              isPending={acceptMutation.isPending}
              onConfirm={handleAcceptConfirm}
              error={actionError}
              data-testid="offer-accept-dialog"
            />

            <OfferActionDialog
              open={declineDialogOpen}
              onOpenChange={setDeclineDialogOpen}
              title={t("offers.declineDialogTitle")}
              description={t("offers.declineDialogDescription")}
              confirmLabel={t("offers.decline")}
              cancelLabel={t("offers.cancel")}
              isPending={declineMutation.isPending}
              onConfirm={handleDeclineConfirm}
              error={actionError}
              data-testid="offer-decline-dialog"
            />
          </div>
        )}
      </div>
    </div>
  );
}
