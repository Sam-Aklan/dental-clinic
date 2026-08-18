import type { UseFormRegister } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { WeeklyScheduleFormValues } from "@/lib/clinic-settings";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface WeekdayRowProps {
	index: number;
	weekdayLabel: string;
	register: UseFormRegister<WeeklyScheduleFormValues>;
	isClosed: boolean;
	onClosedChange: (closed: boolean) => void;
	error?: { startTime?: string; endTime?: string };
}

export function WeekdayRow({ index, weekdayLabel, register, isClosed, onClosedChange, error }: WeekdayRowProps) {
	const { t } = useTranslation();
	return (
		<div className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[1fr_1fr_1fr]">
			<div className="flex items-center justify-between gap-3">
				<Label className="text-base font-medium">{weekdayLabel}</Label>
				<div className="flex items-center gap-2">
					<Checkbox checked={!isClosed} onCheckedChange={(checked) => onClosedChange(checked === false)} aria-label={weekdayLabel} />
					<span className="text-sm text-muted-foreground">{isClosed ? t("clinicSettings.weeklyHours.closed") : t("clinicSettings.weeklyHours.open")}</span>
				</div>
			</div>
			<div className={cn("grid gap-2", isClosed && "opacity-60")}>
				<Label htmlFor={`weekdays.${index}.startTime`}>{t("clinicSettings.weeklyHours.startTime")}</Label>
				<Input id={`weekdays.${index}.startTime`} type="time" dir="ltr" disabled={isClosed} {...register(`weekdays.${index}.startTime`)} />
				{error?.startTime && <p className="text-sm text-destructive">{error.startTime}</p>}
			</div>
			<div className={cn("grid gap-2", isClosed && "opacity-60")}>
				<Label htmlFor={`weekdays.${index}.endTime`}>{t("clinicSettings.weeklyHours.endTime")}</Label>
				<Input id={`weekdays.${index}.endTime`} type="time" dir="ltr" disabled={isClosed} {...register(`weekdays.${index}.endTime`)} />
				{error?.endTime && <p className="text-sm text-destructive">{error.endTime}</p>}
			</div>
		</div>
	);
}
