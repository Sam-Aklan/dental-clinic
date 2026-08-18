import { Button } from "@/components/ui/button";
import type { DoctorQueueAppointment } from "@/types";
import { canCompleteAppointment, canConfirmAppointment, canMarkNoShow, canStartAppointment } from "@/lib/doctor-queue";
import { FollowUpScheduleDialog } from "@/components/follow-ups";
import { mapDoctorQueueAppointmentToFollowUpSource } from "@/lib/follow-ups";
import { useAuthStore } from "@/stores";
import { useDoctor } from "@/hooks/doctors-admin";
import { useTranslation } from "react-i18next";
import { useState } from "react";

interface StatusActionMenuProps {
	appointment: DoctorQueueAppointment;
	onStatusChange: (id: string, status: DoctorQueueAppointment["status"], needsFollowUp?: boolean) => void;
	onMarkNoFollowUpNeeded: (id: string, status: DoctorQueueAppointment["status"]) => void;
}

export function StatusActionMenu({ appointment, onStatusChange, onMarkNoFollowUpNeeded }: StatusActionMenuProps) {
	const { t } = useTranslation();
	const doctorProfileId = useAuthStore((state) => state.user?.doctorProfileId ?? null);
	const doctorProfileQuery = useDoctor(doctorProfileId ?? "");
	const [followUpOpen, setFollowUpOpen] = useState(false);
	const doctorName = doctorProfileQuery.data ? [doctorProfileQuery.data.firstName, doctorProfileQuery.data.lastName].filter(Boolean).join(" ").trim() : null;
	const sourceAppointment = mapDoctorQueueAppointmentToFollowUpSource(appointment, doctorProfileId, doctorName);
	return (
		<div className="flex flex-wrap gap-2">
			{canConfirmAppointment(appointment) ? <Button size="sm" onClick={() => onStatusChange(appointment.id, "CONFIRMED")}>{t("queue.actions.confirm")}</Button> : null}
			{canStartAppointment(appointment) ? <Button size="sm" variant="secondary" onClick={() => onStatusChange(appointment.id, "IN_PROGRESS")}>{t("queue.actions.start")}</Button> : null}
			{canCompleteAppointment(appointment) ? <Button size="sm" variant="secondary" onClick={() => onStatusChange(appointment.id, "COMPLETED", true)}>{t("queue.actions.complete")}</Button> : null}
			{canMarkNoShow(appointment) ? <Button size="sm" variant="outline" onClick={() => onStatusChange(appointment.id, "NO_SHOW")}>{t("queue.actions.noShow")}</Button> : null}
			{sourceAppointment ? <Button size="sm" variant="outline" onClick={() => setFollowUpOpen(true)}>{t("followUps.scheduling.action")}</Button> : null}
			{sourceAppointment ? <Button size="sm" variant="secondary" onClick={() => onMarkNoFollowUpNeeded(appointment.id, appointment.status)}>{t("queue.actions.markNoFollowUpNeeded")}</Button> : null}
			{sourceAppointment ? <FollowUpScheduleDialog open={followUpOpen} sourceAppointment={sourceAppointment} onOpenChange={setFollowUpOpen} /> : null}
		</div>
	);
}
