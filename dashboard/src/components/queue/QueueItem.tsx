import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { AppointmentStatus, StaffQueueAppointmentDTO } from "@/types";
import { formatQueueTime, formatPatientName, getPatientPhoneDisplay } from "@/lib/queue";
import { StatusTransitionButtons } from "./StatusTransitionButtons";
import { CancelAppointmentDialog } from "./CancelAppointmentDialog";

export interface QueueLabels {
	queueItems: string;
	PENDING: string;
	CONFIRMED: string;
	IN_PROGRESS: string;
	COMPLETED: string;
	CANCELED: string;
	NO_SHOW: string;
	action: {
		confirm: string;
		start: string;
		complete: string;
		cancel: string;
		noShow: string;
		cancelDescription: string;
		noShowDescription: string;
	};
	updatedAt: string;
	live: string;
	reconnecting: string;
	emptyTitle: string;
	emptyDescription: string;
}

interface QueueItemProps {
	appointment: StaffQueueAppointmentDTO;
	position: number;
	onStatusChange: (id: string, status: Exclude<AppointmentStatus, "CANCELED" | "NO_SHOW">) => void;
	onMarkNoFollowUpNeeded: (id: string, status: AppointmentStatus) => void;
	onCancel: (id: string, reason?: string) => void;
	onNoShow: (id: string, reason?: string) => void;
	pendingAction?: AppointmentStatus | null;
	labels: QueueLabels;
}

export function QueueItem({ appointment, position, onStatusChange, onMarkNoFollowUpNeeded, onCancel, onNoShow, pendingAction, labels }: QueueItemProps) {
	const [destructiveAction, setDestructiveAction] = useState<"CANCELED" | "NO_SHOW" | null>(null);

	const phone = useMemo(() => getPatientPhoneDisplay(appointment.patient.phone), [appointment.patient.phone]);
	// console.log("phone:",appointment.patient.phone)

	return (
		<Card>
			<CardHeader className="gap-2">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<div>
						<p className="text-sm font-medium text-muted-foreground">#{position}</p>
						<h3 className="text-base font-semibold">{formatPatientName(appointment.patient)}</h3>
					</div>
					<Badge variant="secondary">{appointment.status}</Badge>
				</div>
				<p className="text-sm text-muted-foreground">{formatQueueTime(appointment.startsAt, appointment.endsAt)}</p>
			</CardHeader>
			<CardContent className="grid gap-3">
				<div className="grid gap-1 text-sm text-muted-foreground">
					<p>{phone}</p>
					<p>{appointment.doctor.firstName} {appointment.doctor.lastName}</p>
				</div>
				<StatusTransitionButtons
					appointment={appointment}
					pendingAction={pendingAction}
					labels={labels}
					onPrimaryAction={(status) => onStatusChange(appointment.id, status)}
					onDestructiveAction={(status) => setDestructiveAction(status)}
					onMarkNoFollowUpNeeded={onMarkNoFollowUpNeeded}
				/>
			</CardContent>

			<CancelAppointmentDialog
				open={destructiveAction !== null}
				onOpenChange={(open) => setDestructiveAction(open ? destructiveAction : null)}
				title={destructiveAction === "NO_SHOW" ? labels.action.noShow : labels.action.cancel}
				description={destructiveAction === "NO_SHOW" ? labels.action.noShowDescription : labels.action.cancelDescription}
				confirmLabel={destructiveAction === "NO_SHOW" ? labels.action.noShow : labels.action.cancel}
				reasonRequired={destructiveAction === "CANCELED"}
				error={null}
				isPending={false}
				onConfirm={({ reason }) => {
					if (destructiveAction === "NO_SHOW") {
						onNoShow(appointment.id, reason);
					} else {
						onCancel(appointment.id, reason);
					}
					setDestructiveAction(null);
				}}
			/>
		</Card>
	);
}
