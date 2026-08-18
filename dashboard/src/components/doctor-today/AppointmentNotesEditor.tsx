import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { appointmentNotesSchema } from "@/lib/doctor-today";
import type { AppointmentNotesFormValues } from "@/types";

interface Props {
	appointmentId: string;
	patientSequence: number;
	initialNotes: string | null;
	isPending?: boolean;
	onSave: (payload: { id: string; notes: string }) => Promise<unknown>;
}

export function AppointmentNotesEditor({ appointmentId, patientSequence, initialNotes, isPending, onSave }: Props) {
	const { t } = useTranslation();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const form = useForm<AppointmentNotesFormValues>({
		resolver: zodResolver(appointmentNotesSchema),
		defaultValues: { notes: initialNotes ?? "" },
	});

	useEffect(() => {
		if (!form.formState.isDirty) {
			form.reset({ notes: initialNotes ?? "" });
		}
	}, [form, initialNotes]);

	return (
		<form
			className="grid gap-3"
			onSubmit={form.handleSubmit(async (values) => {
				setErrorMessage(null);
				try {
					await onSave({ id: appointmentId, notes: values.notes });
					form.reset(values);
				} catch (error) {
					setErrorMessage(error instanceof Error ? error.message : t("doctorToday.note.saveError"));
				}
			})}
		>
			<label className="grid gap-1 text-sm font-medium">
				<span>{t("doctorToday.note.label", { sequence: patientSequence })}</span>
				<Textarea {...form.register("notes")} maxLength={1000} rows={3} />
			</label>
			<div className="flex items-center justify-between gap-3">
				<p className="text-xs text-muted-foreground">{form.watch("notes").length}/1000</p>
				<Button type="submit" size="sm" disabled={isPending || form.formState.isSubmitting}>{isPending ? t("doctorToday.actions.saving") : t("doctorToday.actions.save")}</Button>
			</div>
			{form.formState.errors.notes ? <p className="text-sm text-destructive">{String(form.formState.errors.notes.message ?? "")}</p> : null}
			{errorMessage ? <Alert variant="destructive"><AlertTitle>{t("doctorToday.note.saveErrorTitle")}</AlertTitle><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}
		</form>
	);
}
