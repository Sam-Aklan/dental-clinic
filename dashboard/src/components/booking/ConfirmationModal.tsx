import { useTranslation } from "react-i18next";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2Icon } from "lucide-react";
import type { BookingSummaryState } from "@/types";

interface ConfirmationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	summary: BookingSummaryState;
	isPending: boolean;
	validationError: string | null;
	onSubmit: () => void;
	onCancel: () => void;
}

export function ConfirmationModal({
	open,
	onOpenChange,
	summary,
	isPending,
	validationError,
	onSubmit,
	onCancel,
}: ConfirmationModalProps) {
	const { t, i18n } = useTranslation();

	return (
		<Dialog open={open} onOpenChange={onOpenChange} >
			<DialogContent isRtl={i18n.language === "ar"}>
				<DialogHeader>
					<DialogTitle>{t("booking.confirmation.title")}</DialogTitle>
					<DialogDescription>{t("booking.confirmation.subtitle")}</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					{summary.doctorName && (
						<div>
							<p className="text-sm font-medium">{t("booking.summary.doctor")}</p>
							<p className="text-muted-foreground">{summary.doctorName}</p>
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

					<p className="text-xs text-muted-foreground">{t("booking.summary.timezoneNote")}</p>
					<p className="text-xs text-muted-foreground">{t("booking.summary.cancellationNote")}</p>
				</div>

				{validationError && (
					<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" role="alert">
						{validationError}
					</div>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={onCancel} disabled={isPending}>
						{t("booking.confirmation.cancel")}
					</Button>
					<Button onClick={onSubmit} disabled={isPending} aria-busy={isPending}>
						{isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
						{t("booking.confirmation.submit")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
