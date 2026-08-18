import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { scheduleOverrideSchema, type ScheduleOverrideFormValues, toIsoDate } from "@/lib/doctors-admin";

function parseFilterDate(value: string | undefined) {
	if (!value) return undefined;
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatFilterDate(value: string | undefined, locale?: string) {
	const date = parseFilterDate(value);
	if (!date) return "";
	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}

function toFilterDateValue(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

type ScheduleOverrideFormProps = {
	defaultValues?: Partial<ScheduleOverrideFormValues>;
	submitLabel: string;
	onSubmit: (values: ScheduleOverrideFormValues) => void | Promise<void>;
	isPending?: boolean;
	errorMessage?: string | null;
	onCancel?: () => void;
};

export function ScheduleOverrideForm({ defaultValues, submitLabel, onSubmit, isPending = false, errorMessage = null, onCancel }: ScheduleOverrideFormProps) {
	const { t, i18n } = useTranslation();
	const today = toIsoDate(new Date());
	const [isDateOpen, setIsDateOpen] = useState(false);
	const form = useForm<ScheduleOverrideFormValues>({
		resolver: zodResolver(scheduleOverrideSchema),
		defaultValues: {
			date: today,
			isUnavailable: true,
			startTime: "09:00",
			endTime: "17:00",
			reason: "",
			...defaultValues,
		},
	});

	useEffect(() => {
		form.reset({
			date: today,
			isUnavailable: true,
			startTime: "09:00",
			endTime: "17:00",
			reason: "",
			...defaultValues,
		});
	}, [defaultValues, form, today]);

	const isUnavailable = Boolean(useWatch({ control: form.control, name: "isUnavailable" }));
	const dateValue = useWatch({ control: form.control, name: "date" });
	const todayDate = new Date();
	todayDate.setHours(0, 0, 0, 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("doctorsAdmin.overrideForm.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<form className="grid gap-4" onSubmit={form.handleSubmit(onSubmit)}>
					<div className="grid gap-2">
						<Label htmlFor="override-date">{t("doctorsAdmin.overrideForm.date")}</Label>
						<Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
							<PopoverTrigger asChild>
								<Button
									id="override-date"
									type="button"
									variant="outline"
									className={cn("w-full justify-between font-normal", !dateValue && "text-muted-foreground")}
								>
									<span className="truncate">{formatFilterDate(dateValue, i18n.language) || t("doctorsAdmin.overrideForm.date")}</span>
									<CalendarIcon className="ms-2 size-4 shrink-0 text-muted-foreground" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={parseFilterDate(dateValue)}
									disabled={{ before: todayDate }}
									onSelect={(date) => {
										if (!date) return;
										form.setValue("date", toFilterDateValue(date), { shouldDirty: true, shouldValidate: true });
										setIsDateOpen(false);
									}}
								/>
							</PopoverContent>
						</Popover>
						<input type="hidden" {...form.register("date")} />
						{form.formState.errors.date ? <p className="text-sm text-destructive">{t(form.formState.errors.date.message as string)}</p> : null}
					</div>
					<div className="flex items-center gap-2">
						<Checkbox checked={isUnavailable} onCheckedChange={(checked) => form.setValue("isUnavailable", Boolean(checked), { shouldDirty: true })} />
						<Label>{t("doctorsAdmin.overrideForm.unavailableAllDay")}</Label>
					</div>
					{!isUnavailable ? (
						<div className="grid gap-3 md:grid-cols-2">
							<div className="grid gap-2">
								<Label htmlFor="override-start">{t("doctorsAdmin.overrideForm.startTime")}</Label>
								<Input id="override-start" type="time" {...form.register("startTime")} />
								{form.formState.errors.startTime ? <p className="text-sm text-destructive">{t(form.formState.errors.startTime.message as string)}</p> : null}
							</div>
							<div className="grid gap-2">
								<Label htmlFor="override-end">{t("doctorsAdmin.overrideForm.endTime")}</Label>
								<Input id="override-end" type="time" {...form.register("endTime")} />
								{form.formState.errors.endTime ? <p className="text-sm text-destructive">{t(form.formState.errors.endTime.message as string)}</p> : null}
							</div>
						</div>
					) : null}
					<div className="grid gap-2">
						<Label htmlFor="override-reason">{t("doctorsAdmin.overrideForm.reason")}</Label>
						<Textarea id="override-reason" rows={3} {...form.register("reason")} />
						{form.formState.errors.reason ? <p className="text-sm text-destructive">{t(form.formState.errors.reason.message as string)}</p> : null}
					</div>
					{errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
					<div className="flex flex-wrap justify-end gap-2">
						{onCancel ? <Button type="button" variant="outline" onClick={onCancel}>{t("doctorsAdmin.actions.cancel")}</Button> : null}
						<Button type="submit" disabled={isPending}>{submitLabel}</Button>
					</div>
				</form>
			</CardContent>
			<CardFooter />
		</Card>
	);
}
