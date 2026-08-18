import type { AppointmentStatus, StaffQueueAppointmentDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { getVisibleStaffTransitions } from "@/lib/queue";
import { FollowUpScheduleDialog } from "@/components/follow-ups";
import { mapStaffQueueAppointmentToFollowUpSource } from "@/lib/follow-ups";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface StatusTransitionButtonsProps {
	appointment: StaffQueueAppointmentDTO;
	now?: Date;
	onPrimaryAction: (status: Exclude<AppointmentStatus, "CANCELED" | "NO_SHOW">) => void;
	onDestructiveAction: (status: "CANCELED" | "NO_SHOW") => void;
	onMarkNoFollowUpNeeded: (id: string, status: AppointmentStatus) => void;
	pendingAction?: AppointmentStatus | null;
	labels: Record<AppointmentStatus, string> & { action: { cancel: string; noShow: string } };
}

export function StatusTransitionButtons({ appointment, now = new Date(), onPrimaryAction, onDestructiveAction, onMarkNoFollowUpNeeded, pendingAction, labels }: StatusTransitionButtonsProps) {
	const visible = getVisibleStaffTransitions(appointment, now);
	const { t } = useTranslation();
	const [followUpOpen, setFollowUpOpen] = useState(false);
	const sourceAppointment = mapStaffQueueAppointmentToFollowUpSource(appointment);

	if (visible.length === 0 && !sourceAppointment) return null;

	return (
		<div className="flex flex-wrap gap-2">
			{visible.map((status) => {
				const label = labels[status];
				const isPending = pendingAction === status;
				if (status === "CANCELED" || status === "NO_SHOW") {
					return <Button key={status} variant="destructive" size="sm" onClick={() => onDestructiveAction(status)} disabled={pendingAction !== null}>{status === "CANCELED" ? labels.action.cancel : labels.action.noShow}</Button>;
				}
				return <Button key={status} size="sm" onClick={() => onPrimaryAction(status)} disabled={pendingAction !== null || isPending}>{label}</Button>;
			})}
			{sourceAppointment ? <Button type="button" size="sm" variant="outline" onClick={() => setFollowUpOpen(true)}>{t("followUps.scheduling.action")}</Button> : null}
			{sourceAppointment ? <Button type="button" size="sm" variant="secondary" onClick={() => onMarkNoFollowUpNeeded(appointment.id, appointment.status)}>{t("queue.actions.markNoFollowUpNeeded")}</Button> : null}
			{sourceAppointment ? <FollowUpScheduleDialog open={followUpOpen} sourceAppointment={sourceAppointment} onOpenChange={setFollowUpOpen} /> : null}
		</div>
	);
}
