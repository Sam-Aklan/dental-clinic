import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddHoliday, useDeleteHoliday, useHolidays } from "@/hooks/clinic-settings";
import { addHolidaySchema, isHolidayDateDuplicate, type AddHolidayFormValues } from "@/lib/clinic-settings";
import { cn } from "@/lib/utils";
import { HolidayItem } from "./HolidayItem";

function parseHolidayDate(value: string) {
	if (!value) return undefined;
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatHolidayDate(value: string, locale: string) {
	const date = parseHolidayDate(value);
	if (!date) return "";
	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}

function toHolidayDateValue(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function HolidayClosuresSection() {
	const { t, i18n } = useTranslation();
	const { data, isLoading, isError, refetch } = useHolidays();
	const addHoliday = useAddHoliday();
	const deleteHoliday = useDeleteHoliday();
	const [createError, setCreateError] = useState<string | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const [isDateOpen, setIsDateOpen] = useState(false);
	const {
		register,
		handleSubmit,
		reset,
		setError,
		setValue,
		control,
		formState: { errors, isDirty },
	} = useForm<AddHolidayFormValues>({
		resolver: zodResolver(addHolidaySchema),
		defaultValues: { date: "", name: "" },
	});
	const holidayDateValue = useWatch({ control, name: "date" }) ?? "";
	const existingDates = useMemo(() => data?.map((holiday) => holiday.date) ?? [], [data]);
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	if (isLoading) {
		return (
			<Card>
				<CardHeader><CardTitle>{t("clinicSettings.holidays.title")}</CardTitle></CardHeader>
				<CardContent className="grid gap-3" aria-busy="true">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-10 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card>
				<CardHeader><CardTitle>{t("clinicSettings.holidays.title")}</CardTitle></CardHeader>
				<CardContent>
					<Alert variant="destructive" role="alert"><AlertDescription>{t("clinicSettings.errors.loadFailed")}</AlertDescription></Alert>
					<Button variant="outline" className="mt-4" onClick={() => void refetch()}>{t("clinicSettings.errors.retry")}</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader><CardTitle>{t("clinicSettings.holidays.title")}</CardTitle></CardHeader>
			<CardContent className="grid gap-4">
				<div className="grid gap-3">
					{(data ?? []).map((holiday) => {
						const dateLabel = new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(`${holiday.date}T00:00:00`));
						return (
							<HolidayItem
								key={holiday.id}
								holiday={holiday}
								dateLabel={dateLabel}
								onDelete={() => {
									setDeleteError(null);
									deleteHoliday.mutate(holiday.id, {
										onError: (error) => {
											const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
											const firstMessage = Array.isArray(message) ? message[0] : message;
											setDeleteError(firstMessage ?? t("clinicSettings.errors.saveFailed"));
										},
									});
								}}
								title={t("clinicSettings.holidays.deleteTitle")}
								description={t("clinicSettings.holidays.deleteDescription")}
								confirmLabel={t("clinicSettings.holidays.deleteConfirm")}
								cancelLabel={t("clinicSettings.holidays.deleteCancel")}
								deleteLabel={t("clinicSettings.holidays.deleteTrigger")}
								isPending={deleteHoliday.isPending}
							/>
						);
					})}
					{deleteError && <Alert variant="destructive" role="alert"><AlertDescription>{t(deleteError, { defaultValue: deleteError })}</AlertDescription></Alert>}
				</div>
				<form
					onSubmit={handleSubmit((values) => {
						setCreateError(null);
						setDeleteError(null);
						if (isHolidayDateDuplicate(values.date, existingDates)) {
							setError("date", { message: "clinicSettings.holidays.duplicateDate" });
							return;
						}
						addHoliday.mutate(values, {
							onSuccess: () => {
								reset({ date: "", name: "" });
								setIsDateOpen(false);
							},
							onError: (error) => {
								const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
								const firstMessage = Array.isArray(message) ? message[0] : message;
								if (firstMessage?.includes("date must match") || firstMessage?.includes("Holiday date must be today or in the future") || firstMessage?.includes("A holiday already exists for this date")) {
									setError("date", { message: firstMessage });
									return;
								}
								setCreateError(firstMessage ?? t("clinicSettings.errors.saveFailed"));
							},
						});
					})}
					className="grid gap-3"
					noValidate
				>
					<div className="grid gap-2 md:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="holiday-date">{t("clinicSettings.holidays.date")}</Label>
							<Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
								<PopoverTrigger asChild>
									<Button
										id="holiday-date"
										type="button"
										variant="outline"
										className={cn("w-full justify-between font-normal", !holidayDateValue && "text-muted-foreground")}
									>
										<span className="truncate">{formatHolidayDate(holidayDateValue, i18n.language) || t("clinicSettings.holidays.date")}</span>
										<CalendarIcon className="ms-2 size-4 shrink-0 text-muted-foreground" />
									</Button>
								</PopoverTrigger>
								<PopoverContent className="w-auto p-0" align="start">
									<Calendar
										mode="single"
										selected={parseHolidayDate(holidayDateValue)}
										disabled={{ before: today }}
										onSelect={(date) => {
											if (!date) return;
											setValue("date", toHolidayDateValue(date), { shouldDirty: true, shouldValidate: true });
											setIsDateOpen(false);
										}}
									/>
								</PopoverContent>
							</Popover>
							<input type="hidden" {...register("date")} />
							<p className="text-sm text-destructive">{errors.date?.message && t(errors.date.message, { defaultValue: errors.date.message })}</p>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="holiday-name">{t("clinicSettings.holidays.name")}</Label>
							<Input id="holiday-name" type="text" {...register("name")} />
							<p className="text-sm text-destructive">{errors.name?.message && t(errors.name.message, { defaultValue: errors.name.message })}</p>
						</div>
					</div>
					{createError && <Alert variant="destructive" role="alert"><AlertDescription>{t(createError, { defaultValue: createError })}</AlertDescription></Alert>}
					<div className="flex items-center gap-3">
						<Button type="submit" disabled={addHoliday.isPending} aria-busy={addHoliday.isPending}>
							{addHoliday.isPending && <Loader2 className="me-2 size-4 animate-spin" />}
							{t("clinicSettings.holidays.add")}
						</Button>
						{isDirty && <span className="text-sm text-muted-foreground">{t("clinicSettings.unsavedChanges")}</span>}
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
