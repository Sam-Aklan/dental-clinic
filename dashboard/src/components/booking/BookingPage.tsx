import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClinicSettings } from "@/hooks/clinic-settings";
import { filterFutureSlots, getClinicTodayDate, formatClinicDate, formatClinicTimeRange, parseBookingSearch, validatePreselectedDoctor, validatePreselectedDate } from "@/lib/booking";
import { useDoctorsQuery } from "@/hooks/booking/use-doctors-query";
import { useAvailableSlotsQuery } from "@/hooks/booking/use-available-slots-query";
import { useBookAppointmentMutation } from "@/hooks/booking";
import { ROUTE_BOOK_APPOINTMENTS } from "@/constants/routes";
import { BookingStepIndicator } from "./BookingStepIndicator";
import { DoctorSelector } from "./DoctorSelector";
import { SlotPicker } from "./SlotPicker";
import { BookingSummary } from "./BookingSummary";
import { ConfirmationModal } from "./ConfirmationModal";
import type { BookingSelectionState, BookingSummaryState } from "@/types";

export function BookingPage() {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
	const clinicSettings = useClinicSettings();

	const clinicToday = getClinicTodayDate();

	const [selection, setSelection] = useState<BookingSelectionState>(() => {
		const parsed = parseBookingSearch(searchParams);
		return {
			doctorId: null,
			selectedDate: validatePreselectedDate(parsed.date) ?? clinicToday,
			selectedSlotStart: null,
		};
	});
	const [preselectionApplied, setPreselectionApplied] = useState(false);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [showWaitlistCta, setShowWaitlistCta] = useState(false);

	const { data: doctors = [], isLoading: isDoctorsLoading, isError: isDoctorsError, refetch: refetchDoctors } = useDoctorsQuery();

	const { data: slots = [], isLoading: isSlotsLoading, isError: isSlotsError, refetch: refetchSlots } = useAvailableSlotsQuery(selection.doctorId, selection.selectedDate, true);

	if (!preselectionApplied && doctors.length > 0) {
		const parsed = parseBookingSearch(searchParams);
		const validDoctorId = validatePreselectedDoctor(parsed.doctorId, doctors);

		if (validDoctorId && validDoctorId !== selection.doctorId) {
			setSelection({
				doctorId: validDoctorId,
				selectedDate: selection.selectedDate,
				selectedSlotStart: null,
			});
		}
		setPreselectionApplied(true);
	}

	const selectedDoctor = useMemo(
		() => doctors.find((d) => d.id === selection.doctorId) ?? null,
		[doctors, selection.doctorId],
	);

	const selectableSlots = useMemo(() => {
		return filterFutureSlots(slots).filter((slot) => slot.status === "available");
	}, [slots]);

	const selectedSlot = useMemo(
		() => selectableSlots.find((s) => s.startsAt === selection.selectedSlotStart) ?? null,
		[selectableSlots, selection.selectedSlotStart],
	);

	useEffect(() => {
		if (selection.selectedSlotStart && !selectedSlot) {
			setSelection((prev) => {
				if (prev.selectedSlotStart !== selection.selectedSlotStart) {
					return prev;
				}

				return { ...prev, selectedSlotStart: null };
			});
		}
	}, [selectedSlot, selection.selectedSlotStart]);

	const summary = useMemo<BookingSummaryState>(() => {
		const locale = i18n.language;
		return {
			doctorName: selectedDoctor ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : null,
			doctorSpecialization: selectedDoctor?.specialization ?? null,
			selectedDateFormatted: selection.selectedDate
				? formatClinicDate(selection.selectedDate, locale)
				: null,
			selectedTimeFormatted: selectedSlot
				? formatClinicTimeRange(selectedSlot.startsAt, selectedSlot.endsAt, locale)
				: null,
			canConfirm: !!selection.doctorId && !!selectedSlot,
		};
	}, [selectedDoctor, selectedSlot, selection.selectedDate, selection.doctorId, i18n.language]);

	const { mutation, generateKey, isPending } = useBookAppointmentMutation(selection.doctorId);

	const handleSelectDoctor = useCallback((doctorId: string) => {
		setShowWaitlistCta(false);
		setSelection((prev) => ({
			...prev,
			doctorId,
			selectedSlotStart: null,
		}));
	}, []);

	const handleSelectDate = useCallback((date: string) => {
		setShowWaitlistCta(false);
		setSelection((prev) => ({
			...prev,
			selectedDate: date,
			selectedSlotStart: null,
		}));
	}, []);

	const handleSelectSlot = useCallback((startsAt: string) => {
		setShowWaitlistCta(false);
		setSelection((prev) => ({
			...prev,
			selectedSlotStart: startsAt,
		}));
	}, []);

	const handleOpenDialog = useCallback(() => {
		generateKey();
		setValidationError(null);
		setDialogOpen(true);
	}, [generateKey]);

	const handleCloseDialog = useCallback(() => {
		if (!isPending) {
			setDialogOpen(false);
			setValidationError(null);
		}
	}, [isPending]);

	const handleSubmitBooking = useCallback(() => {
		if (!selection.doctorId || !selectedSlot) return;

		setValidationError(null);

		mutation.mutate(
			{
				doctorId: selection.doctorId,
				startsAt: selectedSlot.startsAt,
			},
			{
				onSuccess: (data) => {
					setDialogOpen(false);
					toast.success(t("booking.success"));
					navigate({
						to: ROUTE_BOOK_APPOINTMENTS,
						search: { created: data.id },
					});
				},
				onError: (error: unknown) => {
					const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
					const status = axiosError?.response?.status;

					if (status === 409) {
						toast.error(t("booking.errors.slotTaken"));
						void refetchSlots();
						setShowWaitlistCta(true);
						setSelection((prev) => ({ ...prev, selectedSlotStart: null }));
						setDialogOpen(false);
					} else if (status === 400) {
						setValidationError(
							axiosError?.response?.data?.message ?? t("booking.errors.validationFailed"),
						);
					} else {
						toast.error(t("booking.errors.generic"));
					}
				},
			},
		);
	}, [selection.doctorId, selectedSlot, mutation, t, navigate, refetchSlots]);

	const bookingStep = !selection.doctorId ? 1 : !selection.selectedSlotStart ? 3 : 4;

	return (
		<div className="mx-auto max-w-4xl space-y-8 px-4 py-8">
			<BookingStepIndicator currentStep={bookingStep} />

			<h1 className="text-2xl font-bold">{t("booking.title")}</h1>

			{clinicSettings.data && (
				<Card>
					<CardHeader>
						<CardTitle>{t("booking.clinicContext.title")}</CardTitle>
					</CardHeader>
					<CardContent className="grid gap-1 text-sm text-muted-foreground">
						<p>{t("booking.clinicContext.slotDuration", { minutes: clinicSettings.data.slotDurationMinutes })}</p>
						<p>{t("booking.clinicContext.timezone", { timezone: clinicSettings.data.timeZone })}</p>
					</CardContent>
				</Card>
			)}

			<section>
				<h2 className="text-lg font-semibold mb-4">{t("booking.sections.doctor")}</h2>
				<DoctorSelector
					doctors={doctors}
					isLoading={isDoctorsLoading}
					isError={isDoctorsError}
					onRetry={() => refetchDoctors()}
					selectedDoctorId={selection.doctorId}
					onSelectDoctor={handleSelectDoctor}
				/>
			</section>

			{selection.doctorId && (
				<section>
					<h2 className="text-lg font-semibold mb-4">{t("booking.sections.dateTime")}</h2>
					<SlotPicker
						selectedDate={selection.selectedDate}
						onSelectDate={handleSelectDate}
						slots={slots}
						isLoading={isSlotsLoading}
						isError={isSlotsError}
						onRetry={() => refetchSlots()}
						selectedSlotStart={selection.selectedSlotStart}
						onSelectSlot={handleSelectSlot}
						selectedDoctorId={selection.doctorId}
						showWaitlistCta={showWaitlistCta}
						selectedDoctorName={summary.doctorName}
					/>
				</section>
			)}

			<section>
				<h2 className="text-lg font-semibold mb-4">{t("booking.sections.summary")}</h2>
				<BookingSummary summary={summary} onConfirm={handleOpenDialog} />
			</section>

			<ConfirmationModal
				open={dialogOpen}
				onOpenChange={(open) => {
					if (!open) handleCloseDialog();
					else handleOpenDialog();
				}}
				summary={summary}
				isPending={isPending}
				validationError={validationError}
				onSubmit={handleSubmitBooking}
				onCancel={handleCloseDialog}
			/>
		</div>
	);
}
