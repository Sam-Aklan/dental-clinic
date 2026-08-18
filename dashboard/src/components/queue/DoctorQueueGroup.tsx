import type { AppointmentStatus, DoctorQueueGroup as DoctorQueueGroupType } from "@/types";
import { QueueItem, type QueueLabels } from "./QueueItem";

interface DoctorQueueGroupProps {
	group: DoctorQueueGroupType;
	labels: QueueLabels;
	pendingActionId?: string | null;
	onStatusChange: (id: string, status: Exclude<AppointmentStatus, "CANCELED" | "NO_SHOW">) => void;
	onMarkNoFollowUpNeeded: (id: string, status: AppointmentStatus) => void;
	onCancel: (id: string, reason?: string) => void;
	onNoShow: (id: string, reason?: string) => void;
}

export function DoctorQueueGroup({ group, labels, pendingActionId, onStatusChange, onMarkNoFollowUpNeeded, onCancel, onNoShow }: DoctorQueueGroupProps) {
	return (
		<section className="grid gap-3">
			<header>
				<h2 className="text-lg font-semibold">{group.doctorName}</h2>
				<p className="text-sm text-muted-foreground">{group.appointments.length} {labels.queueItems}</p>
			</header>
			<div className="grid gap-3">
				{group.appointments.map((appointment, index) => (
					<QueueItem
						key={appointment.id}
						appointment={appointment}
						position={index + 1}
						labels={labels}
						pendingAction={pendingActionId === appointment.id ? appointment.status : null}
						onStatusChange={onStatusChange}
						onMarkNoFollowUpNeeded={onMarkNoFollowUpNeeded}
						onCancel={onCancel}
						onNoShow={onNoShow}
					/>
				))}
			</div>
		</section>
	);
}
