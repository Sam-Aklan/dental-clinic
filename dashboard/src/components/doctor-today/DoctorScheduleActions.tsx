import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DoctorTodayAppointmentStatus, DoctorTodayScheduleAppointmentDTO } from "@/types";

interface Props {
	appointment: DoctorTodayScheduleAppointmentDTO;
	referenceNow?: Date;
	hasOtherInProgress?: boolean;
	isPending?: boolean;
	onUpdateStatus: (payload: { id: string; status: DoctorTodayAppointmentStatus }) => Promise<unknown>;
}

export function DoctorScheduleActions({ appointment, referenceNow = new Date(), hasOtherInProgress, isPending, onUpdateStatus }: Props) {
	const { t } = useTranslation();
	const now = dayjs(referenceNow);
	const isNoShowAllowed = appointment.status === "CONFIRMED" && !dayjs(appointment.startsAt).isAfter(now);

	const handleStatus = (status: DoctorTodayAppointmentStatus) => {
		void onUpdateStatus({ id: appointment.id, status });
	};

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Badge variant={appointment.status === "IN_PROGRESS" ? "default" : "secondary"}>{t(`queue.status.${appointment.status}`)}</Badge>
			{appointment.status === "PENDING" ? <Button type="button" size="sm" disabled={isPending} onClick={() => handleStatus("CONFIRMED")}>{t("doctorToday.actions.confirm")}</Button> : null}
			{appointment.status === "CONFIRMED" ? (
				<>
					<Button type="button" size="sm" disabled={isPending || hasOtherInProgress} onClick={() => handleStatus("IN_PROGRESS")}>{t("doctorToday.actions.start")}</Button>
					{isNoShowAllowed ? <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => handleStatus("NO_SHOW")}>{t("doctorToday.actions.noShow")}</Button> : null}
				</>
			) : null}
			{appointment.status === "IN_PROGRESS" ? <Button type="button" size="sm" disabled={isPending} onClick={() => handleStatus("COMPLETED")}>{t("doctorToday.actions.complete")}</Button> : null}
		</div>
	);
}
