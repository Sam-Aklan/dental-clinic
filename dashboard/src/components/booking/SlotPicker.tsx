import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTE_WAITLIST } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { filterFutureSlots, groupSlotsByClinicTime, formatClinicTimeRange, getClinicTodayDate } from "@/lib/booking";
import type { AvailableSlotDTO } from "@/types";

interface SlotPickerProps {
	selectedDate: string;
	onSelectDate: (date: string) => void;
	slots: AvailableSlotDTO[];
	isLoading: boolean;
	isError: boolean;
	onRetry: () => void;
	selectedSlotStart: string | null;
	onSelectSlot: (startsAt: string) => void;
	selectedDoctorId: string | null;
	showWaitlistCta?: boolean;
	selectedDoctorName?: string | null;
}

export function SlotPicker({
	selectedDate,
	onSelectDate,
	slots,
	isLoading,
	isError,
	onRetry,
	selectedSlotStart,
	onSelectSlot,
	selectedDoctorId,
	showWaitlistCta = false,
	selectedDoctorName = null,
}: SlotPickerProps) {
	const { t, i18n } = useTranslation();
	const locale = i18n.language;
	const [now, setNow] = useState(() => Date.now());

	useEffect(() => {
		const intervalId = window.setInterval(() => setNow(Date.now()), 60_000);
		return () => window.clearInterval(intervalId);
	}, []);

	const futureSlots = useMemo(() => {
		return filterFutureSlots(slots, new Date(now));
	}, [now, slots]);
	const slotGroups = useMemo(() => groupSlotsByClinicTime(futureSlots), [futureSlots]);
	const clinicToday = getClinicTodayDate();
	const hasOnlyPastSlotsForToday = selectedDate === clinicToday && slots.length > 0 && futureSlots.length === 0;

	function handleDateSelect(date: Date | undefined) {
		if (!date) return;
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		onSelectDate(`${year}-${month}-${day}`);
	}

	if (isError) {
		return (
			<div className="rounded-md bg-destructive/10 p-6 text-center" role="alert">
				<p className="text-destructive">{t("booking.errors.slotsFailed")}</p>
				<button
					type="button"
					onClick={onRetry}
					className="mt-2 text-sm font-medium underline underline-offset-4 hover:text-destructive/80"
				>
					{t("booking.errors.retry")}
				</button>
			</div>
		);
	}

	const shouldShowWaitlistLink = Boolean(selectedDoctorId) && !hasOnlyPastSlotsForToday && (showWaitlistCta || slotGroups.length === 0);

	return (
		<div className="space-y-6">
			<Calendar
				mode="single"
				selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
				onSelect={handleDateSelect}
				disabled={(date) => {
					const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
					return dateStr < clinicToday;
				}}
			/>

			{isLoading ? (
				<div className="space-y-2">
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={`slot-skel-${i}`} className="h-10 w-full" />
					))}
				</div>
			) : slotGroups.length > 0 ? (
				<>
					{showWaitlistCta && shouldShowWaitlistLink && (
						<div className="rounded-md bg-destructive/10 p-4 text-sm" role="status">
							<p className="text-destructive">{t("booking.errors.slotTaken")}</p>
							<Link
								to={ROUTE_WAITLIST}
								search={{ doctorId: selectedDoctorId ?? undefined }}
								className="mt-2 inline-block font-medium text-primary underline underline-offset-4 hover:text-primary/80"
							>
								{t("booking.errors.waitlistLink", { doctorName: selectedDoctorName ?? "" })}
							</Link>
						</div>
					)}
					{slotGroups.map((group) => (
						<div key={group.label} className="space-y-2">
							<h3 className="text-sm font-medium">{t(group.i18nKey)}</h3>
							<div className="flex flex-wrap gap-2">
								{group.slots.map((slot) => {
									const isSelected = slot.startsAt === selectedSlotStart;
									const isReserved = slot.status === "reserved";
									const slotTime = formatClinicTimeRange(slot.startsAt, slot.endsAt, locale);

									if (isReserved) {
										return (
											<div
												key={slot.startsAt}
												className={cn(
													"min-w-[10rem] flex-1 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-initial",
												)}
											>
												<div className="flex items-center gap-2">
													<span className="font-medium">{slotTime}</span>
													<Badge variant="destructive">{t("booking.slotStates.reserved")}</Badge>
												</div>
												<Link
													to={ROUTE_WAITLIST}
													search={{ doctorId: slot.doctorId }}
													className="mt-2 inline-block font-medium underline underline-offset-4 hover:text-destructive/80"
												>
													{t("booking.slotStates.joinWaitlist")}
												</Link>
											</div>
										);
									}

									return (
										<button
											key={slot.startsAt}
											type="button"
											className={cn(
												"min-w-[10rem] flex-1 rounded-md border px-4 py-3 text-sm transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-initial",
												isSelected && "border-primary bg-primary text-primary-foreground",
											)}
											onClick={() => onSelectSlot(slot.startsAt)}
											aria-pressed={isSelected}
										>
											{slotTime}
										</button>
									);
								})}
							</div>
						</div>
					))}
				</>
			) : (
				<div className="text-center py-6 space-y-2">
					<p className="text-muted-foreground">{t("booking.errors.noSlots")}</p>
				</div>
			)}
		</div>
	);
}
