import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,DialogClose } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { followUpScheduleSchema, getFollowUpClinicDayBounds, groupFollowUpSlotsByPeriod, filterFutureFollowUpSlots, type FollowUpSlotsQueryParams } from "@/lib/follow-ups";
import { useCreateFollowUpMutation, useFollowUpSlotsQuery } from "@/hooks/follow-ups";
import type { FollowUpSourceAppointment, FollowUpScheduleFormValues } from "@/types";
import { FollowUpSourceSummary } from "./FollowUpSourceSummary";
import { FollowUpSlotPicker } from "./FollowUpSlotPicker";
import { toClinicDate } from "@/lib/doctor-today";

export interface FollowUpScheduleDialogProps {
	open: boolean;
	sourceAppointment: FollowUpSourceAppointment | null;
	onOpenChange: (open: boolean) => void;
}

export function FollowUpScheduleDialog({ open, sourceAppointment, onOpenChange }: FollowUpScheduleDialogProps) {
	const { t, i18n } = useTranslation();
	const isMobile = useIsMobile();
	const titleRef = useRef<HTMLHeadingElement | null>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);
	const wasOpenRef = useRef(false);
	const [selectedDate, setSelectedDate] = useState(() => (sourceAppointment ? toClinicDate(sourceAppointment.startsAt) : toClinicDate(new Date())));
	const [selectedSlotStartsAt, setSelectedSlotStartsAt] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [announcementMessage, setAnnouncementMessage] = useState<string | null>(null);

	const form = useForm<FollowUpScheduleFormValues>({
		resolver: zodResolver(followUpScheduleSchema) as Resolver<FollowUpScheduleFormValues>,
		defaultValues: { slotStartsAt: "", reason: "", notes: "" },
	});

	const slotQueryParams: FollowUpSlotsQueryParams | null = sourceAppointment ? { doctorId: sourceAppointment.doctorId, ...getFollowUpClinicDayBounds(selectedDate) } : null;
	const slotQuery = useFollowUpSlotsQuery(slotQueryParams);
	const createMutation = useCreateFollowUpMutation({
		slotQueryParams,
		onConflict: () => {
			setSelectedSlotStartsAt(null);
			form.setValue("slotStartsAt", "", { shouldValidate: true, shouldDirty: true });
		},
	});

	useEffect(() => {
		if (open && !wasOpenRef.current) {
			returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
		}
		if (!open && wasOpenRef.current) {
			window.setTimeout(() => returnFocusRef.current?.focus(), 0);
		}
		wasOpenRef.current = open;
	}, [open]);

	const visibleSlots = useMemo(() => filterFutureFollowUpSlots(slotQuery.data ?? []), [slotQuery.data]);
	const slotGroups = useMemo(() => groupFollowUpSlotsByPeriod(visibleSlots), [visibleSlots]);

	useEffect(() => {
		if (!open || !sourceAppointment) return;
		setSelectedDate(toClinicDate(sourceAppointment.startsAt));
		setSelectedSlotStartsAt(null);
		setErrorMessage(null);
		setAnnouncementMessage(null);
		form.reset({ slotStartsAt: "", reason: "", notes: "" });
		window.setTimeout(() => titleRef.current?.focus(), 0);
	}, [form, open, sourceAppointment]);

	useEffect(() => {
		setSelectedSlotStartsAt(null);
		form.setValue("slotStartsAt", "", { shouldValidate: false, shouldDirty: true });
	}, [form, selectedDate]);

	function handleSelectSlot(startsAt: string) {
		setSelectedSlotStartsAt(startsAt);
		form.setValue("slotStartsAt", startsAt, { shouldValidate: true, shouldDirty: true });
	}

	async function handleSubmit(values: FollowUpScheduleFormValues) {
		if (!sourceAppointment) return;
		setErrorMessage(null);
		try {
			const payload = {
				patientId: sourceAppointment.patientId,
				doctorId: sourceAppointment.doctorId,
				startsAt: values.slotStartsAt,
				reason: values.reason,
				notes: values.notes?.trim() || undefined,
				sourceAppointmentId: sourceAppointment.id,
			};
			await createMutation.mutateAsync(payload);
			setAnnouncementMessage(t("followUps.scheduling.success"));
			toast.success(t("followUps.scheduling.success"));
			onOpenChange(false);
		} catch (error) {
			const message = resolveFollowUpErrorMessage(error, t);
			setErrorMessage(message);
			setAnnouncementMessage(message);
		}
	}

	if (!open || !sourceAppointment) return null;

	const body = (
		<form dir={i18n.dir()} className="grid gap-4" onSubmit={form.handleSubmit(handleSubmit)}>
			<p aria-live="polite" aria-atomic="true" role="status" className="sr-only">{announcementMessage}</p>
			<FollowUpSourceSummary sourceAppointment={sourceAppointment} />
			<FollowUpSlotPicker
				selectedDate={selectedDate}
				onDateChange={setSelectedDate}
				groups={slotGroups}
				isLoading={slotQuery.isLoading}
				isError={slotQuery.isError}
				errorMessage={slotQuery.error ? resolveFollowUpErrorMessage(slotQuery.error, t) : undefined}
				onRetry={() => slotQuery.refetch()}
				selectedSlotStartsAt={selectedSlotStartsAt}
				onSelectSlot={handleSelectSlot}
			/>
			<div className="grid gap-2">
				<label htmlFor="follow-up-reason" className="text-sm font-medium">{t("followUps.scheduling.reasonLabel")}</label>
				<Textarea id="follow-up-reason" rows={3} {...form.register("reason")} />
				{form.formState.errors.reason ? <Alert variant="destructive"><AlertDescription>{t(form.formState.errors.reason.message ?? "followUps.scheduling.errors.reasonRequired")}</AlertDescription></Alert> : null}
			</div>
			<div className="grid gap-2">
				<label htmlFor="follow-up-notes" className="text-sm font-medium">{t("followUps.scheduling.notesLabel")}</label>
				<Textarea id="follow-up-notes" rows={3} {...form.register("notes")} />
				{form.formState.errors.notes ? <Alert variant="destructive"><AlertDescription>{t(form.formState.errors.notes.message ?? "followUps.scheduling.errors.notesTooLong")}</AlertDescription></Alert> : null}
			</div>
			{form.formState.errors.slotStartsAt ? <Alert variant="destructive"><AlertDescription>{t(form.formState.errors.slotStartsAt.message ?? "followUps.scheduling.errors.slotRequired")}</AlertDescription></Alert> : null}
			{errorMessage ? <Alert variant="destructive"><AlertTitle>{t("followUps.scheduling.errorTitle")}</AlertTitle><AlertDescription>{errorMessage}</AlertDescription></Alert> : null}
			<DialogFooter className="gap-2 sm:gap-2">
				<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("followUps.scheduling.cancel")}</Button>
				<Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? t("followUps.scheduling.pending") : t("followUps.scheduling.submit")}</Button>
			</DialogFooter>
		</form>
	);

	if (isMobile) {
		return (
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side="bottom" className="h-[92vh] overflow-y-auto px-4 pb-6 sm:px-6" showCloseButton={false}>
					<SheetHeader className="px-0 pt-4">
						<SheetTitle ref={titleRef} tabIndex={-1}>{t("followUps.scheduling.title")}</SheetTitle>
						<SheetDescription>{t("followUps.scheduling.description")}</SheetDescription>
					</SheetHeader>
					{body}
				</SheetContent>
			</Sheet>
		);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl" dir={i18n.dir()}
			isRtl={i18n.language ==="ar"?true:false}
			>
				<DialogHeader>
					<DialogTitle ref={titleRef} tabIndex={-1}>{t("followUps.scheduling.title")}</DialogTitle>
					<DialogDescription>{t("followUps.scheduling.description")}</DialogDescription>
				</DialogHeader>
				{body}
			</DialogContent>
		</Dialog>
	);
}

function resolveFollowUpErrorMessage(error: unknown, t: (key: string) => string) {
	const status = (error as { response?: { status?: number; data?: { message?: string } } } | null)?.response?.status;
	const message = (error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;
	if (status === 400) return message ?? t("followUps.scheduling.errors.invalidPayload");
	if (status === 403) return t("followUps.scheduling.errors.permissionDenied");
	if (status === 404) return t("followUps.scheduling.errors.notFound");
	if (status === 409) return t("followUps.scheduling.errors.conflict");
	if (error instanceof Error && error.message) return error.message;
	return t("followUps.scheduling.errors.network");
}
