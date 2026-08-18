import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DoctorQueueAppointment, DoctorQueueSection } from "@/types";
import { AppointmentCard } from "./AppointmentCard";

interface QueueSectionProps {
	section: DoctorQueueSection;
	title: string;
	emptyLabel: string;
	onStatusChange: (id: string, status: DoctorQueueAppointment["status"], needsFollowUp?: boolean) => void;
	onMarkNoFollowUpNeeded: (id: string, status: DoctorQueueAppointment["status"]) => void;
	onSaveNote: (id: string, notes: string) => void;
}

export function QueueSection({ section, title, emptyLabel, onStatusChange, onMarkNoFollowUpNeeded, onSaveNote }: QueueSectionProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{title}</CardTitle>
			</CardHeader>
			<CardContent className="grid gap-3">
				{section.appointments.length === 0 ? (
					<p className="text-sm text-muted-foreground">{emptyLabel}</p>
				) : (
					section.appointments.map((appointment) => (
						<AppointmentCard key={appointment.id} appointment={appointment} onStatusChange={onStatusChange} onMarkNoFollowUpNeeded={onMarkNoFollowUpNeeded} onSaveNote={onSaveNote} />
					))
				)}
			</CardContent>
		</Card>
	);
}
