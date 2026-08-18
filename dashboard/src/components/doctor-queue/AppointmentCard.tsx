import { useState } from "react";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { DoctorQueueAppointment } from "@/types";
import { formatDoctorQueueNotePreview } from "@/lib/doctor-queue";
import { StatusActionMenu } from "./StatusActionMenu";
import { AppointmentNotesDialog } from "./AppointmentNotesDialog";
import { useTranslation } from "react-i18next";

interface AppointmentCardProps {
	appointment: DoctorQueueAppointment;
	onStatusChange: (id: string, status: DoctorQueueAppointment["status"], needsFollowUp?: boolean) => void;
	onMarkNoFollowUpNeeded: (id: string, status: DoctorQueueAppointment["status"]) => void;
	onSaveNote: (id: string, notes: string) => void;
}

export function AppointmentCard({ appointment, onStatusChange, onMarkNoFollowUpNeeded, onSaveNote }: AppointmentCardProps) {
	const [notesOpen, setNotesOpen] = useState(false);
	const { t } = useTranslation();
	const patientName = appointment.patientName?.trim() || appointment.patient?.fullName?.trim() || [appointment.patient?.firstName, appointment.patient?.lastName].filter(Boolean).join(" ").trim();
	const showFollowUpNeededBadge = appointment.needsFollowUp && !appointment.followUpId;
	const showFollowUpScheduledBadge = Boolean(appointment.followUpId);

	return (
		<Card className="w-full">
			<CardHeader className="space-y-2">
				<div className="flex flex-wrap items-center gap-2">
					<div>
						{patientName ? <CardTitle className="text-base">{patientName}</CardTitle> : null}
						{/* <p className="text-sm font-medium text-muted-foreground">{formatDoctorQueuePatientLabel(appointment.position)}</p> */}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline">{t(`queue.status.${appointment.status}`)}</Badge>
						{showFollowUpNeededBadge ? <Badge variant="destructive">{t("queue.badges.followUpNeeded")}</Badge> : null}
						{showFollowUpScheduledBadge ? <Badge variant="secondary">{t("queue.badges.followUpScheduled")}</Badge> : null}
					</div>
				</div>
				<p className="text-sm text-muted-foreground">{t("queue.labels.scheduled", { time: dayjs(appointment.startsAt).format("HH:mm") })}</p>
			</CardHeader>
			<CardContent className="grid gap-2">
				{appointment.notes ? <p className="text-sm text-muted-foreground">{formatDoctorQueueNotePreview(appointment.notes)}</p> : <p className="text-sm text-muted-foreground">{t("queue.note.empty")}</p>}
				<button type="button" className="text-left text-sm font-medium text-primary" onClick={() => setNotesOpen(true)}>{t("queue.actions.editNote")}</button>
			</CardContent>
			<CardFooter className="flex flex-col items-start gap-3">
				<StatusActionMenu appointment={appointment} onStatusChange={onStatusChange} onMarkNoFollowUpNeeded={onMarkNoFollowUpNeeded} />
			</CardFooter>
			<AppointmentNotesDialog appointment={appointment} open={notesOpen} onOpenChange={setNotesOpen} onSave={(id, notes) => { onSaveNote(id, notes); setNotesOpen(false); }} />
		</Card>
	);
}
