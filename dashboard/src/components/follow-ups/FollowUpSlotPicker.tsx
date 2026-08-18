import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { AvailableSlot, FollowUpSlotGroup } from "@/types";
import { CLINIC_TIMEZONE } from "@/constants";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpSlotPickerProps {
	selectedDate: string;
	onDateChange: (date: string) => void;
	groups: FollowUpSlotGroup[];
	isLoading: boolean;
	isError: boolean;
	errorMessage?: string;
	onRetry: () => void;
	selectedSlotStartsAt: string | null;
	onSelectSlot: (startsAt: string) => void;
}

export function FollowUpSlotPicker({ selectedDate, onDateChange, groups, isLoading, isError, errorMessage, onRetry, selectedSlotStartsAt, onSelectSlot }: FollowUpSlotPickerProps) {
	const { t, i18n } = useTranslation();
	const [isDateOpen, setIsDateOpen] = useState(false);
	const selectedDateValue = parseSelectedDate(selectedDate);
	const selectedDateLabel = formatSelectedDate(selectedDate, i18n.language);

	return (
		<div dir={i18n.dir()} className="grid gap-4">
			<div className="grid gap-2">
				<label htmlFor="follow-up-date" className="text-sm font-medium">{t("followUps.scheduling.dateLabel")}</label>
				<Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
					<PopoverTrigger asChild>
						<Button
							id="follow-up-date"
							type="button"
							variant="outline"
							aria-label={selectedDateLabel ? `${t("followUps.scheduling.dateLabel")}: ${selectedDateLabel}` : t("followUps.scheduling.dateLabel")}
							className={cn("w-full justify-between font-normal", !selectedDateValue && "text-muted-foreground")}
						>
							<span className="truncate">{selectedDateLabel || t("followUps.scheduling.dateLabel")}</span>
							<CalendarIcon className="ms-2 size-4 shrink-0 text-muted-foreground" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={selectedDateValue}
							onSelect={(date) => {
								if (!date) return;
								onDateChange(toDateValue(date));
								setIsDateOpen(false);
							}}
						/>
					</PopoverContent>
				</Popover>
			</div>

			{isError ? (
				<Alert variant="destructive">
					<AlertTitle>{t("followUps.scheduling.errors.slotsUnavailableTitle")}</AlertTitle>
					<AlertDescription className="grid gap-2">
						<p>{errorMessage ?? t("followUps.scheduling.errors.slotsUnavailable")}</p>
						<Button type="button" variant="outline" size="sm" onClick={onRetry}>{t("followUps.scheduling.retry")}</Button>
					</AlertDescription>
				</Alert>
			) : null}

			{isLoading ? <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{t("followUps.scheduling.loadingSlots")}</p> : null}

			{!isLoading && !isError && groups.length === 0 ? <p className="text-sm text-muted-foreground" role="status" aria-live="polite">{t("followUps.scheduling.emptySlots")}</p> : null}

			<div className="grid gap-4">
				{groups.map((group) => (
					<section key={group.period} className="grid gap-2">
						<h3 className="text-sm font-medium capitalize">{t(`followUps.scheduling.slotGroups.${group.period}`)}</h3>
						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{group.slots.map((slot) => (
								<SlotButton key={slot.startsAt} slot={slot} selected={selectedSlotStartsAt === slot.startsAt} onSelect={() => onSelectSlot(slot.startsAt)} />
							))}
						</div>
					</section>
				))}
			</div>
		</div>
	);
}

function parseSelectedDate(value: string) {
	if (!value) return undefined;
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatSelectedDate(value: string, locale?: string) {
	const date = parseSelectedDate(value);
	if (!date) return "";
	return new Intl.DateTimeFormat(locale, {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}

function toDateValue(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function SlotButton({ slot, selected, onSelect }: { slot: AvailableSlot; selected: boolean; onSelect: () => void }) {
	const { i18n } = useTranslation();
	const label = new Intl.DateTimeFormat(i18n.language, { hour: "2-digit", minute: "2-digit", timeZone: CLINIC_TIMEZONE }).format(new Date(slot.startsAt));
	return <Button type="button" variant={selected ? "default" : "outline"} aria-pressed={selected} onClick={onSelect} className="justify-start">{label}</Button>;
}
