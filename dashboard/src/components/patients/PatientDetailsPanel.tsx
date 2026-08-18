import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StaffPatientDetailDTO } from "@/types";
import { Calendar, Clock, Globe, User } from "lucide-react";

interface PatientDetailsPanelProps {
  patient: StaffPatientDetailDTO | null;
  isLoading: boolean;
  isError: boolean;
  isNotFound: boolean;
  hasSelection: boolean;
  selectedPatientId: string | undefined;
  onBookPatient?: (patientId: string) => void;
  pastCount?: number;
  upcomingCount?: number;
  isLoadingCounts?: boolean;
}

export function PatientDetailsPanel({
  patient,
  isLoading,
  isError,
  isNotFound,
  hasSelection,
  onBookPatient,
  pastCount = 0,
  upcomingCount = 0,
  isLoadingCounts = false,
}: PatientDetailsPanelProps) {
  const { t } = useTranslation();

  if (!hasSelection) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-muted/30 rounded-lg">
        <User className="size-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          {t("staffPatients.detail.selectGuidance")}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (isError || isNotFound) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-muted/30 rounded-lg">
        <Calendar className="size-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          {t("staffPatients.detail.unavailable")}
        </p>
      </div>
    );
  }

  if (!patient) return null;

  const fullName = `${patient.firstName} ${patient.lastName}`;
  const languageLabel =
    patient.languagePreference === "en"
      ? t("staffPatients.detail.identity.languageEn")
      : patient.languagePreference === "ar"
        ? t("staffPatients.detail.identity.languageAr")
        : t("staffPatients.card.notProvided");

  return (
    <div className="border rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">{t("staffPatients.detail.title")}</h2>

      <section aria-label={t("staffPatients.detail.identity.label")} className="space-y-2 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-xl font-semibold">{fullName}</span>
          <Badge variant={patient.isActive ? "default" : "secondary"}>
            {patient.isActive ? t("staffPatients.card.activeStatus") : t("staffPatients.card.inactiveStatus")}
          </Badge>
        </div>

        {patient.phone && (
          <p className="text-sm text-muted-foreground">{patient.phone}</p>
        )}
        {patient.email ? (
          <p className="text-sm text-muted-foreground">{patient.email}</p>
        ) : (
          <p className="text-sm text-muted-foreground">{t("staffPatients.card.notProvided")}</p>
        )}

        {patient.dateOfBirth && (
          <p className="text-sm text-muted-foreground">
            {t("staffPatients.card.dateOfBirth")}: {new Date(patient.dateOfBirth).toLocaleDateString()}
          </p>
        )}

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Globe className="size-3" />
          <span>
            {t("staffPatients.detail.identity.languagePreference")}: {languageLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="size-3" />
          <span>
            {t("staffPatients.detail.identity.memberSince")}: {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : t("staffPatients.card.notProvided")}
          </span>
        </div>
      </section>

      <section aria-label={t("staffPatients.detail.summary.label")} className="border-t pt-4">
        <h3 className="text-sm font-medium mb-2">{t("staffPatients.detail.summary.label")}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{t("staffPatients.detail.summary.lastAppointment")}</p>
            <p className="text-sm font-medium mt-1">
              {patient.lastAppointmentAt
                ? new Date(patient.lastAppointmentAt).toLocaleDateString()
                : t("staffPatients.detail.summary.noPastVisits")}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{t("staffPatients.detail.summary.nextAppointment")}</p>
            <p className="text-sm font-medium mt-1">
              {patient.nextAppointmentAt
                ? new Date(patient.nextAppointmentAt).toLocaleDateString()
                : t("staffPatients.detail.summary.noUpcomingVisits")}
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{t("staffPatients.detail.summary.pastAppointmentsCount")}</p>
            {isLoadingCounts ? (
              <Skeleton className="h-5 w-12 mt-1" />
            ) : (
              <p className="text-sm font-semibold mt-1">{pastCount ?? 0}</p>
            )}
          </div>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">{t("staffPatients.detail.summary.upcomingAppointmentsCount")}</p>
            {isLoadingCounts ? (
              <Skeleton className="h-5 w-12 mt-1" />
            ) : (
              <p className="text-sm font-semibold mt-1">{upcomingCount ?? 0}</p>
            )}
          </div>
        </div>
      </section>

      <div className="border-t pt-4 mt-4">
        <Button className="w-full" onClick={() => onBookPatient?.(patient.id)}>
          {t("staffPatients.detail.bookForPatient")}
        </Button>
      </div>
    </div>
  );
}
