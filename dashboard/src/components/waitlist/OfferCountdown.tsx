import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { getOfferTimeRemaining } from "@/lib/waitlist/helpers/waitlist-offer.helper";

interface OfferCountdownProps {
  expiresAt: string;
  onExpired?: () => void;
}

export function OfferCountdown({ expiresAt, onExpired }: OfferCountdownProps) {
  const { t } = useTranslation();
  const onExpiredRef = useRef(onExpired);
  const expiredCalledRef = useRef(false);
  const [remaining, setRemaining] = useState(() => getOfferTimeRemaining(expiresAt));

  useEffect(() => {
    onExpiredRef.current = onExpired;
  });

  useEffect(() => {
    expiredCalledRef.current = false;
  }, [expiresAt]);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getOfferTimeRemaining(expiresAt);
      setRemaining(next);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  useEffect(() => {
    if (remaining.isExpired && !expiredCalledRef.current) {
      expiredCalledRef.current = true;
      onExpiredRef.current?.();
    }
  });

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        setRemaining(getOfferTimeRemaining(expiresAt));
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [expiresAt]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">{t("offers.countdownLabel")}</span>
      <span
        className="font-mono tabular-nums font-semibold"
        data-testid="offer-countdown"
      >
        {remaining.formatted}
      </span>
    </div>
  );
}
