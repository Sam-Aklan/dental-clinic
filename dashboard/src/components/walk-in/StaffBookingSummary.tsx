import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { StaffBookingSummaryState } from "@/types";

interface StaffBookingSummaryProps {
	summary: StaffBookingSummaryState;
	errorMessage: string | null;
	onOpenConfirm: () => void;
}

export function StaffBookingSummary({ summary, errorMessage, onOpenConfirm }: StaffBookingSummaryProps) {
	const { t } = useTranslation();

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("walkIn.summary.title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid gap-4 sm:grid-cols-2">
					<div>
						<p className="text-sm font-medium">{t("walkIn.summary.patient")}</p>
						<p className="text-muted-foreground">{summary.patientName ?? t("walkIn.summary.missingPatient")}</p>
					</div>
					<div>
						<p className="text-sm font-medium">{t("walkIn.summary.doctor")}</p>
						<p className="text-muted-foreground">{summary.doctorName ?? t("walkIn.summary.missingDoctor")}</p>
						{summary.doctorSpecialization && <p className="text-xs text-muted-foreground">{summary.doctorSpecialization}</p>}
					</div>
					<div>
						<p className="text-sm font-medium">{t("walkIn.summary.date")}</p>
						<p className="text-muted-foreground">{summary.selectedDateFormatted ?? t("walkIn.summary.missingDate")}</p>
					</div>
					<div>
						<p className="text-sm font-medium">{t("walkIn.summary.time")}</p>
						<p className="text-muted-foreground">{summary.selectedTimeFormatted ?? t("walkIn.summary.missingTime")}</p>
					</div>
				</div>

				<p className="text-xs text-muted-foreground">{t("walkIn.summary.timezoneNote", { timezone: summary.timezone })}</p>

				<Separator />

				{!summary.canConfirm && (
					<Alert>
						<AlertDescription>{t("walkIn.summary.selectRequirements")}</AlertDescription>
					</Alert>
				)}

				{errorMessage && (
					<Alert variant="destructive" role="alert">
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				)}

				<Button type="button" className="w-full" disabled={!summary.canConfirm} onClick={onOpenConfirm}>
					{t("walkIn.summary.confirmButton")}
				</Button>

				<p className="text-xs text-muted-foreground text-center">{t("walkIn.summary.disclaimer")}</p>
			</CardContent>
		</Card>
	);
}
