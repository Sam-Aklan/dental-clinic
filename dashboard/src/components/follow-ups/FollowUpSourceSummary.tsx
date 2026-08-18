import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { CLINIC_TIMEZONE } from "@/constants";
import type { FollowUpSourceAppointment } from "@/types";

export function FollowUpSourceSummary({ sourceAppointment }: { sourceAppointment: FollowUpSourceAppointment }) {
	const { t, i18n } = useTranslation();
	const dateLabel = new Intl.DateTimeFormat(i18n.language, { timeZone: CLINIC_TIMEZONE, dateStyle: "medium", timeStyle: "short" }).format(new Date(sourceAppointment.startsAt));

	return (
		<Card dir={i18n.dir()}>
			<CardContent className="p-4 text-sm">
				<dl className="grid gap-3">
					<div className="grid gap-1">
						<dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("followUps.scheduling.source.patient")}</dt>
						<dd className="font-medium">{sourceAppointment.patientName}</dd>
					</div>
					<div className="grid gap-1">
						<dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("followUps.scheduling.source.doctor")}</dt>
						<dd className="font-medium">{sourceAppointment.doctorName}</dd>
					</div>
					<div className="grid gap-1">
						<dt className="text-xs uppercase tracking-wide text-muted-foreground">{t("followUps.scheduling.source.time")}</dt>
						<dd className="font-medium">{dateLabel}</dd>
					</div>
				</dl>
			</CardContent>
		</Card>
	);
}
