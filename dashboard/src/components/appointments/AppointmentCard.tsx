import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PatientAppointment } from "@/types";
import { formatAppointmentBookingDate, formatAppointmentDate, formatAppointmentTimeRange, formatDoctorDisplayName, isAppointmentCancelable } from "@/lib/appointments/helpers";
import { useCreatedAppointmentHighlight } from "@/hooks/appointments";

interface AppointmentCardProps {
	appointment: PatientAppointment;
	locale: string;
	statusLabel: string;
	cancelLabel: string;
	onCancel?: (appointment: PatientAppointment) => void;
	createdAppointmentId: string | null;
	recentlyCreatedLabel: string;
	noSpecializationLabel: string;
	cancellationNoticeLabel: string;
	bookingDateLabel: string;
	dateLabel: string;
	timeLabel: string;
	referenceNow?: Date;
}

export function AppointmentCard({
	appointment,
	locale,
	statusLabel,
	cancelLabel,
	onCancel,
	createdAppointmentId,
	recentlyCreatedLabel,
	noSpecializationLabel,
	cancellationNoticeLabel,
	bookingDateLabel,
	dateLabel,
	timeLabel,
	referenceNow = new Date(),
}: AppointmentCardProps) {
	const highlighted = useCreatedAppointmentHighlight(appointment.id, createdAppointmentId);
	const cancelable = isAppointmentCancelable(appointment, referenceNow);
	const doctorName = formatDoctorDisplayName(appointment.doctor);
	const specialization = appointment.doctor.specialization;

	return (
		<Card className={highlighted ? "border-primary ring-2 ring-primary/20" : undefined} aria-label={doctorName}>
			<CardHeader className="gap-2">
				<div className="flex flex-wrap items-start justify-between gap-2">
					<div className="grid gap-1">
						<h3 className="text-base font-semibold">{doctorName}</h3>
						<p className="text-sm text-muted-foreground">{specialization ?? noSpecializationLabel}</p>
					</div>
					<div className="flex items-center gap-2">
						{highlighted ? <Badge variant="secondary">{recentlyCreatedLabel}</Badge> : null}
						<Badge variant={appointment.status === "CANCELED" ? "destructive" : "outline"}>{statusLabel}</Badge>
					</div>
				</div>
			</CardHeader>
			<CardContent className="grid gap-3 text-sm">
				<p><strong>{dateLabel}:</strong> {formatAppointmentDate(appointment.startsAt, locale)}</p>
				<p><strong>{timeLabel}:</strong> {formatAppointmentTimeRange(appointment.startsAt, appointment.endsAt, locale)}</p>
				<p><strong>{bookingDateLabel}:</strong> {formatAppointmentBookingDate(appointment.createdAt, locale)}</p>

				{cancelable && onCancel ? (
					<Button className="w-fit" variant="outline" onClick={() => onCancel(appointment)}>{cancelLabel}</Button>
				) : null}
				{!cancelable && (appointment.status === "PENDING" || appointment.status === "CONFIRMED") ? (
					<p className="text-sm text-muted-foreground">{cancellationNoticeLabel}</p>
				) : null}
			</CardContent>
		</Card>
	);
}
