import type { DoctorDTO } from "@/types";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDoctorName } from "@/lib/doctors-admin";

type DoctorDirectoryItemProps = {
	doctor: DoctorDTO;
	selected?: boolean;
	onSelect: (doctorId: string) => void;
};

export function DoctorDirectoryItem({ doctor, selected = false, onSelect }: DoctorDirectoryItemProps) {
	const { t } = useTranslation();
	const availability = doctor.defaultAvailability?.trim() || t("doctorsAdmin.directory.derivedAvailability");
	return (
		<Card className={selected ? "ring-1 ring-primary" : undefined} size="sm">
			<CardContent className="flex flex-col gap-3 py-4">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<h3 className="truncate font-medium">{formatDoctorName(doctor)}</h3>
						<p className="text-sm text-muted-foreground">{doctor.specialization ?? t("doctorsAdmin.directory.notSet")}</p>
					</div>
					{doctor.isActive === undefined || doctor.isActive === null ? null : (
						<Badge variant={doctor.isActive ? "default" : "secondary"}>
							{doctor.isActive ? t("doctorsAdmin.status.active") : t("doctorsAdmin.status.inactive")}
						</Badge>
					)}
				</div>
				<p className="text-sm text-muted-foreground">{availability}</p>
				<div className="flex justify-end">
					<Button variant={selected ? "secondary" : "outline"} size="sm" onClick={() => onSelect(doctor.id)}>
						{selected ? t("doctorsAdmin.actions.selected") : t("doctorsAdmin.actions.viewProfile")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
