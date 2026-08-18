import { Loader2Icon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { StaffBookingSummaryState } from "@/types";

interface StaffBookingConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	summary: StaffBookingSummaryState;
	isPending: boolean;
	errorMessage: string | null;
	onSubmit: () => void;
	onCancel: () => void;
}

export function StaffBookingConfirmDialog({ open, onOpenChange, summary, isPending, errorMessage, onSubmit, onCancel }: StaffBookingConfirmDialogProps) {
	const { t,i18n } = useTranslation();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent isRtl={i18n.language === "ar"}>
				<DialogHeader>
					<DialogTitle>{t("walkIn.confirmation.title")}</DialogTitle>
					<DialogDescription>{t("walkIn.confirmation.subtitle")}</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">{t("walkIn.confirmation.disclaimer")}</p>
					<div className="space-y-2 text-sm">
						<p><span className="font-medium">{t("walkIn.summary.patient")}: </span>{summary.patientName ?? "-"}</p>
						<p><span className="font-medium">{t("walkIn.summary.doctor")}: </span>{summary.doctorName ?? "-"}</p>
						<p><span className="font-medium">{t("walkIn.summary.date")}: </span>{summary.selectedDateFormatted ?? "-"}</p>
						<p><span className="font-medium">{t("walkIn.summary.time")}: </span>{summary.selectedTimeFormatted ?? "-"}</p>
					</div>
				</div>

				{errorMessage && (
					<Alert variant="destructive" role="alert">
						<AlertDescription>{errorMessage}</AlertDescription>
					</Alert>
				)}

				<DialogFooter>
					<Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
						{t("walkIn.confirmation.cancel")}
					</Button>
					<Button type="button" onClick={onSubmit} disabled={isPending} aria-busy={isPending}>
						{isPending && <Loader2Icon className="me-2 size-4 animate-spin" />}
						{t("walkIn.confirmation.confirm")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
