import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { PatientAppointment } from "@/types";
import { getAppointmentSummary } from "@/lib/appointments/helpers";

interface CancelAppointmentDialogProps {
	appointment: PatientAppointment | null;
	open: boolean;
	locale: string;
	errorMessage: string | null;
	isPending: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	title: string;
	description: string;
	confirmLabel: string;
	cancelLabel: string;
	retryLabel: string;
	bookingDateLabel: string;
	doctorLabel: string;
	dateLabel: string;
	timeLabel: string;
}

export function CancelAppointmentDialog({
	appointment,
	open,
	locale,
	errorMessage,
	isPending,
	onOpenChange,
	onConfirm,
	title,
	description,
	confirmLabel,
	cancelLabel,
	retryLabel,
	bookingDateLabel,
	doctorLabel,
	dateLabel,
	timeLabel,
}: CancelAppointmentDialogProps) {
	const summary = appointment ? getAppointmentSummary(appointment, locale) : null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				{summary ? (
					<div className="grid gap-2 rounded-lg border bg-muted/30 p-4 text-sm">
						<p><strong>{doctorLabel}:</strong> {summary.doctorName}</p>
						<p><strong>{dateLabel}:</strong> {summary.date}</p>
						<p><strong>{timeLabel}:</strong> {summary.time}</p>
						<p><strong>{bookingDateLabel}:</strong> {summary.bookingDate}</p>
					</div>
				) : null}

				{errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
						{cancelLabel}
					</Button>
					<Button onClick={onConfirm} disabled={isPending}>
						{isPending ? retryLabel : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
