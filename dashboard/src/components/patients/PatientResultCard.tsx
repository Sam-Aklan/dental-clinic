import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import type { StaffPatientSearchDTO } from "@/types";

interface PatientResultCardProps {
  patient: StaffPatientSearchDTO;
  isSelected: boolean;
  onSelect: () => void;
}

export function PatientResultCard({ patient, isSelected, onSelect }: PatientResultCardProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-pressed={isSelected}
      onClick={onSelect}
      className={`w-full text-start p-4 rounded-lg border transition-colors ${
        isSelected
          ? "border-primary bg-primary/10 ring-2 ring-primary"
          : "border-border hover:border-primary/50 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-foreground">
          {patient.firstName} {patient.lastName}
        </span>
        <Badge variant={patient.isActive ? "default" : "secondary"}>
          {patient.isActive ? t("staffPatients.card.activeStatus") : t("staffPatients.card.inactiveStatus")}
        </Badge>
      </div>

      {(patient.phone || patient.email) && (
        <div className="text-sm text-muted-foreground mb-2">
          {patient.phone && <div>{patient.phone}</div>}
          {patient.email && <div>{patient.email}</div>}
        </div>
      )}

      {!patient.phone && !patient.email && (
        <div className="text-sm text-muted-foreground mb-2">
          {t("staffPatients.card.notProvided")}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {patient.lastAppointmentAt && (
          <div>
            {t("staffPatients.card.lastAppointment")}: {new Date(patient.lastAppointmentAt).toLocaleDateString()}
          </div>
        )}
        {patient.nextAppointmentAt && (
          <div>
            {t("staffPatients.card.nextAppointment")}: {new Date(patient.nextAppointmentAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </button>
  );
}
