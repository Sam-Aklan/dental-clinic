import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { DoctorSelector, SlotPicker } from "@/components/booking";
import { useClinicSettings } from "@/hooks/clinic-settings";
import { useAvailableSlotsQuery, useCreateStaffAppointmentMutation, useDoctorsQuery } from "@/hooks/booking";
import { usePatientDetailQuery } from "@/hooks/patients";
import { ROUTE_STAFF_APPOINTMENTS } from "@/constants";
import { getClinicTodayDate } from "@/lib/booking";
import { buildWalkInSummaryState, findWalkInSlotByStart, parseWalkInSearchParams, validateWalkInDate } from "@/lib/walk-in";
import { walkInBookingSchema, type WalkInBookingFormValues } from "@/lib/walk-in";
import { PatientLookup } from "./PatientLookup";
import { StaffBookingStepper } from "./StaffBookingStepper";
import { StaffBookingSummary } from "./StaffBookingSummary";
import { StaffBookingConfirmDialog } from "./StaffBookingConfirmDialog";
import type { AvailableSlotDTO, DoctorDirectoryItemDTO, StaffPatientSearchDTO } from "@/types";

export function WalkInBookingPage() {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const searchParams = useSearch({ strict: false }) as Record<string, string | undefined>;
	const clinicSettings = useClinicSettings();
	const parsedSearch = useMemo(() => parseWalkInSearchParams(searchParams), [searchParams]);
	const clinicToday = getClinicTodayDate();
	const validDate = validateWalkInDate(parsedSearch.date) ?? clinicToday;

	const [selectedPatient, setSelectedPatient] = useState<StaffPatientSearchDTO | null>(null);
	const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>(validDate);
	const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);
	const [patientWarning, setPatientWarning] = useState<string | null>(null);
	const [dateWarning, setDateWarning] = useState<string | null>(parsedSearch.date && !validateWalkInDate(parsedSearch.date) ? t("walkIn.warnings.invalidDate") : null);
	const [submissionError, setSubmissionError] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	const form = useForm<WalkInBookingFormValues>({
		resolver: zodResolver(walkInBookingSchema),
		defaultValues: {
			patientId: "",
			doctorId: "",
			startsAt: "",
		},
		mode: "onChange",
	});

	const { setValue, trigger, setError } = form;

	const { data: doctors = [], isLoading: doctorsLoading, isError: doctorsError, refetch: refetchDoctors } = useDoctorsQuery();
	const { data: slots = [], isLoading: slotsLoading, isError: slotsError, refetch: refetchSlots } = useAvailableSlotsQuery(selectedDoctorId, selectedDate);
	const preselectedPatientId = parsedSearch.patientId;
	const preselectedDoctorId = parsedSearch.doctorId;

	const patientDetailQuery = usePatientDetailQuery(preselectedPatientId ?? "");
	const { mutation: createMutation, generateIdempotencyKey, isPending } = useCreateStaffAppointmentMutation(selectedDoctorId, selectedDate);

	useEffect(() => {
		if (!preselectedPatientId) return;
		if (patientDetailQuery.isLoading) return;
		if (patientDetailQuery.isSuccess && patientDetailQuery.data) {
			if (!patientDetailQuery.data.isActive) {
				setPatientWarning(t("walkIn.warnings.inactivePatient"));
				setSelectedPatient(null);
				setValue("patientId", "", { shouldValidate: true });
				return;
			}
			setSelectedPatient(patientDetailQuery.data);
			setValue("patientId", patientDetailQuery.data.id, { shouldValidate: true });
			setPatientWarning(null);
			return;
		}
		if (patientDetailQuery.isError) {
			const status = (patientDetailQuery.error as { response?: { status?: number } })?.response?.status;
			setPatientWarning(status === 403 ? t("walkIn.warnings.patientPermissionRequired") : t("walkIn.warnings.patientNotFound"));
			setSelectedPatient(null);
			setValue("patientId", "", { shouldValidate: true });
		}
	}, [patientDetailQuery.isLoading, patientDetailQuery.isSuccess, patientDetailQuery.isError, patientDetailQuery.data, patientDetailQuery.error, preselectedPatientId, setValue, t]);

	useEffect(() => {
		if (!preselectedDoctorId || doctors.length === 0 || selectedDoctorId) return;
		const doctor = doctors.find((item) => item.id === preselectedDoctorId && item.isActive);
		if (doctor) {
			setSelectedDoctorId(doctor.id);
			setValue("doctorId", doctor.id, { shouldValidate: true });
		}
	}, [preselectedDoctorId, doctors, selectedDoctorId, setValue]);

	useEffect(() => {
		setValue("doctorId", selectedDoctorId ?? "", { shouldValidate: true });
		if (!selectedDoctorId) {
			setSelectedSlotStart(null);
			setValue("startsAt", "", { shouldValidate: true });
		}
	}, [selectedDoctorId, setValue]);

	useEffect(() => {
		setValue("startsAt", selectedSlotStart ?? "", { shouldValidate: true });
	}, [selectedSlotStart, setValue]);

	const selectedDoctor = useMemo<DoctorDirectoryItemDTO | null>(() => doctors.find((doctor) => doctor.id === selectedDoctorId) ?? null, [doctors, selectedDoctorId]);
	const selectedSlot = useMemo<AvailableSlotDTO | undefined>(() => findWalkInSlotByStart(slots, selectedSlotStart), [slots, selectedSlotStart]);

	const summary = useMemo(() => buildWalkInSummaryState({
		patient: selectedPatient,
		doctor: selectedDoctor,
		selectedDate,
		selectedSlot,
		locale: i18n.language,
	}), [selectedPatient, selectedDoctor, selectedDate, selectedSlot, i18n.language]);

	const bookingStep = selectedPatient ? (selectedDoctor ? (selectedSlot ? 4 : 3) : 2) : 1;
	const showPatientLoading = Boolean(preselectedPatientId) && patientDetailQuery.isLoading;

	const handleSelectPatient = useCallback((patient: StaffPatientSearchDTO) => {
		setSelectedPatient(patient);
		setValue("patientId", patient.id, { shouldValidate: true });
		setPatientWarning(null);
	}, [setValue]);

	const handleClearPatient = useCallback(() => {
		setSelectedPatient(null);
		setValue("patientId", "", { shouldValidate: true });
	}, [setValue]);

	const handleSelectDoctor = useCallback((doctorId: string) => {
		setSelectedDoctorId(doctorId);
		setSelectedSlotStart(null);
		setSubmissionError(null);
	}, []);

	const handleSelectDate = useCallback((date: string) => {
		setSelectedDate(date);
		setSelectedSlotStart(null);
		setDateWarning(null);
	}, []);

	const handleSelectSlot = useCallback((startsAt: string) => {
		setSelectedSlotStart(startsAt);
		setSubmissionError(null);
	}, []);

	const handleOpenConfirm = useCallback(async () => {
		const valid = await trigger();
		if (!valid) return;
		setSubmissionError(null);
		generateIdempotencyKey();
		setDialogOpen(true);
	}, [generateIdempotencyKey, trigger]);

	const handleCloseConfirm = useCallback(() => {
		if (isPending) return;
		setDialogOpen(false);
		setSubmissionError(null);
	}, [isPending]);

	const handleSubmitBooking = useCallback(async () => {
		const isValid = await trigger();
		if (!isValid || !selectedPatient || !selectedDoctorId || !selectedSlotStart) return;

		try {
			const created = await createMutation.mutateAsync({
				patientId: selectedPatient.id,
				doctorId: selectedDoctorId,
				startsAt: selectedSlotStart,
			});
			setDialogOpen(false);
			toast.success(t("walkIn.success"));
			await navigate({ to: ROUTE_STAFF_APPOINTMENTS, search: { tab: "today", highlight: created.id } });
		} catch (error) {
			const status = (error as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
			const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
			if (status === 409) {
				toast.error(t("walkIn.errors.slotTaken"));
				setSelectedSlotStart(null);
				setValue("startsAt", "", { shouldValidate: true });
				await refetchSlots();
				setDialogOpen(false);
				return;
			}
			setSubmissionError(message ?? t("walkIn.errors.generic"));
			setError("startsAt", { type: "server", message: message ?? t("walkIn.errors.generic") });
		}
	}, [createMutation, navigate, refetchSlots, selectedDoctorId, selectedPatient, selectedSlotStart, setError, setValue, t, trigger]);

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
			<StaffBookingStepper currentStep={bookingStep} />

			<div className="space-y-2">
				<h1 className="text-2xl font-semibold tracking-tight">{t("walkIn.title")}</h1>
				<p className="text-sm text-muted-foreground">{t("walkIn.subtitle")}</p>
			</div>

			{clinicSettings.data && (
				<Card>
					<CardContent className="grid gap-1 p-4 text-sm text-muted-foreground sm:p-6">
						<p>{t("booking.clinicContext.slotDuration", { minutes: clinicSettings.data.slotDurationMinutes })}</p>
						<p>{t("booking.clinicContext.timezone", { timezone: clinicSettings.data.timeZone })}</p>
					</CardContent>
				</Card>
			)}

			{dateWarning && (
				<Alert role="alert">
					<AlertTitle>{t("walkIn.warnings.title")}</AlertTitle>
					<AlertDescription>{dateWarning}</AlertDescription>
				</Alert>
			)}

			<div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
				<div className="space-y-6">
					<PatientLookup
						selectedPatient={selectedPatient}
						selectedPatientLoading={showPatientLoading}
						warning={patientWarning}
						onSelectPatient={handleSelectPatient}
						onClearPatient={handleClearPatient}
					/>

					<Card>
						<CardContent className="space-y-4 p-4 sm:p-6">
							<div className="space-y-2">
								<h2 className="text-lg font-semibold">{t("walkIn.doctorSection.title")}</h2>
								<p className="text-sm text-muted-foreground">{t("walkIn.doctorSection.subtitle")}</p>
							</div>
							<DoctorSelector
								doctors={doctors}
								isLoading={doctorsLoading}
								isError={doctorsError}
								onRetry={refetchDoctors}
								selectedDoctorId={selectedDoctorId}
								onSelectDoctor={handleSelectDoctor}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="space-y-4 p-4 sm:p-6">
							<div className="space-y-2">
								<h2 className="text-lg font-semibold">{t("walkIn.slotSection.title")}</h2>
								<p className="text-sm text-muted-foreground">{t("walkIn.slotSection.subtitle")}</p>
							</div>
							<SlotPicker
								selectedDate={selectedDate}
								onSelectDate={handleSelectDate}
								slots={slots}
								isLoading={slotsLoading}
								isError={slotsError}
								onRetry={refetchSlots}
								selectedSlotStart={selectedSlotStart}
								onSelectSlot={handleSelectSlot}
								selectedDoctorId={selectedDoctorId}
							/>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-6">
					<StaffBookingSummary
						summary={summary}
						errorMessage={submissionError}
						onOpenConfirm={handleOpenConfirm}
					/>
				</div>
			</div>

			<StaffBookingConfirmDialog
				open={dialogOpen}
				onOpenChange={(open) => (open ? setDialogOpen(true) : handleCloseConfirm())}
				summary={summary}
				isPending={isPending}
				errorMessage={submissionError}
				onSubmit={handleSubmitBooking}
				onCancel={handleCloseConfirm}
			/>
		</div>
	);
}
