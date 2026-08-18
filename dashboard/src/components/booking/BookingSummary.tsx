import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { BookingSummaryState } from "@/types";

interface BookingSummaryProps {
	summary: BookingSummaryState;
	onConfirm: () => void;
}

export function BookingSummary({ summary, onConfirm }: BookingSummaryProps) {
	const { t } = useTranslation();

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("booking.summary.title")}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{summary.doctorName && (
					<div>
						<p className="text-sm font-medium">{t("booking.summary.doctor")}</p>
						<p className="text-muted-foreground">{summary.doctorName}</p>
						{summary.doctorSpecialization && (
							<p className="text-xs text-muted-foreground">{summary.doctorSpecialization}</p>
						)}
					</div>
				)}

				{summary.selectedDateFormatted && (
					<div>
						<p className="text-sm font-medium">{t("booking.summary.date")}</p>
						<p className="text-muted-foreground">{summary.selectedDateFormatted}</p>
					</div>
				)}

				{summary.selectedTimeFormatted && (
					<div>
						<p className="text-sm font-medium">{t("booking.summary.time")}</p>
						<p className="text-muted-foreground">{summary.selectedTimeFormatted}</p>
					</div>
				)}

				<Separator />

				<p className="text-xs text-muted-foreground">{t("booking.summary.timezoneNote")}</p>

				<Button
					className="w-full"
					disabled={!summary.canConfirm}
					onClick={onConfirm}
				>
					{t("booking.summary.confirmButton")}
				</Button>

				<p className="text-xs text-muted-foreground text-center">
					{t("booking.summary.cancellationNote")}
				</p>
			</CardContent>
		</Card>
	);
}
