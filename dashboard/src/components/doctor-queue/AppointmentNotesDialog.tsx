import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { appointmentNoteSchema } from "@/lib/doctor-queue";
import type { AppointmentNoteFormValues, DoctorQueueAppointment } from "@/types";
import { useTranslation } from "react-i18next";

interface AppointmentNotesDialogProps {
	appointment: DoctorQueueAppointment;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (id: string, notes: string) => void;
}

export function AppointmentNotesDialog({ appointment, open, onOpenChange, onSave }: AppointmentNotesDialogProps) {
	const inputRef = useRef<HTMLTextAreaElement | null>(null);
	const { t } = useTranslation();
	const form = useForm<AppointmentNoteFormValues>({
		resolver: zodResolver(appointmentNoteSchema),
		defaultValues: { notes: appointment.notes ?? "" },
	});
	const notesField = form.register("notes");

	useEffect(() => {
		if (open) {
			form.reset({ notes: appointment.notes ?? "" });
			window.setTimeout(() => inputRef.current?.focus(), 0);
		}
	}, [appointment.notes, form, open]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("queue.note.title")}</DialogTitle>
					<DialogDescription>{t("queue.note.description", { position: appointment.position })}</DialogDescription>
				</DialogHeader>
				<form className="grid gap-4" onSubmit={form.handleSubmit((values) => onSave(appointment.id, values.notes))}>
					<Textarea
						rows={6}
						{...notesField}
						ref={(node) => {
							notesField.ref(node);
							inputRef.current = node;
						}}
					/>
					{form.formState.errors.notes ? <Alert variant="destructive"><p className="text-sm">{form.formState.errors.notes.message}</p></Alert> : null}
					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("queue.actions.cancel")}</Button>
						<Button type="submit">{t("queue.actions.save")}</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
