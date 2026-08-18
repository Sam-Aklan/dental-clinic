import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WaitlistOfferDTO } from "@/types";

interface OfferDetailsCardProps {
  offer: WaitlistOfferDTO;
}

function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OfferDetailsCard({ offer }: OfferDetailsCardProps) {
  const { t } = useTranslation();
  const { doctor, offeredSlot, currentAppointment } = offer;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("offers.offeredSlot")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">
              {formatDateTime(offeredSlot.startsAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("offers.from")} {formatTime(offeredSlot.startsAt)}{" "}
              {t("offers.to")} {formatTime(offeredSlot.endsAt)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("offers.doctorLabel")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm font-medium">
            {doctor.firstName} {doctor.lastName}
          </p>
          {doctor.specialization && (
            <p className="text-xs text-muted-foreground">
              {doctor.specialization}
            </p>
          )}
        </CardContent>
      </Card>

      {currentAppointment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {t("offers.currentAppointment")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-medium">
              {formatDateTime(currentAppointment.startsAt)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("offers.from")} {formatTime(currentAppointment.startsAt)}{" "}
              {t("offers.to")} {formatTime(currentAppointment.endsAt)}
            </p>
            <p className="text-xs text-muted-foreground pt-1">
              {t("offers.compareLabel")}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
