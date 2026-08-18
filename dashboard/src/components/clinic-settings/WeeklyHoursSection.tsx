import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeeklyHours, useUpdateWeeklyHours } from "@/hooks/clinic-settings";
import { weeklyScheduleSchema, type WeeklyScheduleFormValues } from "@/lib/clinic-settings";
import type { DayOfWeek } from "@/types";
import { WeekdayRow } from "./WeekdayRow";

function createDefaultWeekdays() {
	return Array.from({ length: 7 }, (_, dayOfWeek) => ({ dayOfWeek: dayOfWeek as DayOfWeek, isClosed: true, startTime: "", endTime: "" }));
}

export function WeeklyHoursSection() {
	const { t } = useTranslation();
	const { data, isLoading, isError, refetch } = useWeeklyHours();
	const mutation = useUpdateWeeklyHours();
	const [saveError, setSaveError] = useState<string | null>(null);
	const {
		control,
		register,
		handleSubmit,
		reset,
		watch,
		setValue,
		formState: { errors, isDirty },
	} = useForm<WeeklyScheduleFormValues>({
		resolver: zodResolver(weeklyScheduleSchema) as Resolver<WeeklyScheduleFormValues>,
		defaultValues: { weekdays: createDefaultWeekdays() },
	});
	const { fields } = useFieldArray({ control, name: "weekdays" });

	useEffect(() => {
		if (!data) {
			return;
		}

		reset({
			weekdays: data.length === 7 ? data.map((row) => ({ ...row, dayOfWeek: row.dayOfWeek as DayOfWeek, startTime: row.startTime ?? "", endTime: row.endTime ?? "" })) : createDefaultWeekdays(),
		});
	}, [data, reset]);

	if (isLoading) {
		return (
			<Card>
				<CardHeader><CardTitle>{t("clinicSettings.weeklyHours.title")}</CardTitle></CardHeader>
				<CardContent className="grid gap-3" aria-busy="true">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card>
				<CardHeader><CardTitle>{t("clinicSettings.weeklyHours.title")}</CardTitle></CardHeader>
				<CardContent>
					<Alert variant="destructive" role="alert"><AlertDescription>{t("clinicSettings.errors.loadFailed")}</AlertDescription></Alert>
					<Button variant="outline" className="mt-4" onClick={() => void refetch()}>{t("clinicSettings.errors.retry")}</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader><CardTitle>{t("clinicSettings.weeklyHours.title")}</CardTitle></CardHeader>
			<CardContent className="grid gap-4">
		<form
			onSubmit={handleSubmit((values) => {
				setSaveError(null);
				mutation.mutate(
					values.weekdays.map((row) => ({
						dayOfWeek: row.dayOfWeek as DayOfWeek,
						isClosed: row.isClosed,
						startTime: row.isClosed || row.startTime === "" ? null : row.startTime,
						endTime: row.isClosed || row.endTime === "" ? null : row.endTime,
					})),
					{
					onError: (error) => {
						const message = (error as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
						const firstMessage = Array.isArray(message) ? message[0] : message;
						setSaveError(firstMessage ?? t("clinicSettings.errors.saveFailed"));
					},
					},
				);
			})}
					className="grid gap-4"
					noValidate
				>
					{fields.map((field, index) => (
						<WeekdayRow
							key={field.id}
							index={index}
							weekdayLabel={t(`clinicSettings.weeklyHours.days.${index}`)}
							register={register}
							isClosed={watch(`weekdays.${index}.isClosed`)}
							onClosedChange={(closed) => {
								setValue(`weekdays.${index}.isClosed`, closed, { shouldDirty: true });
								if (closed) {
									setValue(`weekdays.${index}.startTime`, "", { shouldDirty: true });
									setValue(`weekdays.${index}.endTime`, "", { shouldDirty: true });
								}
							}}
								error={
									errors.weekdays?.[index]
										? {
											startTime: errors.weekdays[index]?.startTime?.message ? t(errors.weekdays[index]?.startTime?.message as string, { defaultValue: errors.weekdays[index]?.startTime?.message as string }) : undefined,
											endTime: errors.weekdays[index]?.endTime?.message ? t(errors.weekdays[index]?.endTime?.message as string, { defaultValue: errors.weekdays[index]?.endTime?.message as string }) : undefined,
										}
								: undefined
							}
						/>
					))}
					{saveError && <Alert variant="destructive" role="alert"><AlertDescription>{t(saveError, { defaultValue: saveError })}</AlertDescription></Alert>}
					<div className="flex items-center gap-3">
						<Button type="submit" disabled={mutation.isPending} aria-busy={mutation.isPending}>
							{mutation.isPending && <Loader2 className="me-2 size-4 animate-spin" />}
							{t("clinicSettings.weeklyHours.save")}
						</Button>
						{isDirty && <span className="text-sm text-muted-foreground">{t("clinicSettings.unsavedChanges")}</span>}
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
