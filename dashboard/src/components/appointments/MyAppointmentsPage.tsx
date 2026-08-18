import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ROUTE_BOOK } from "@/constants/routes";
import type { AppointmentStatus, PatientAppointment } from "@/types";
import { useAppointmentsQuery, useAppointmentSearchState, useCancelAppointmentMutation } from "@/hooks/appointments";
import { getAppointmentDoctorOptions, getCancelAppointmentErrorCode, isAppointmentCancelable } from "@/lib/appointments/helpers";
import { AppointmentCard } from "./AppointmentCard";
import { AppointmentCardSkeleton } from "./AppointmentCardSkeleton";
import { AppointmentFilters } from "./AppointmentFilters";
import { AppointmentTabs } from "./AppointmentTabs";
import { AppointmentsEmptyState } from "./AppointmentsEmptyState";
import { AppointmentsErrorState } from "./AppointmentsErrorState";
import { CancelAppointmentDialog } from "./CancelAppointmentDialog";

const EMPTY_APPOINTMENTS: PatientAppointment[] = [];

export function MyAppointmentsPage() {
	const { t, i18n } = useTranslation();
	const navigate = useNavigate();
	const { state, setTab, setDoctorId, setStatuses, setPage, clearFilters, setSortBy, setSortDir } = useAppointmentSearchState();
	const query = useAppointmentsQuery(state);
	const cancelMutation = useCancelAppointmentMutation();
	const [cancelTarget, setCancelTarget] = useState<PatientAppointment | null>(null);
	const [cancelError, setCancelError] = useState<string | null>(null);

	const locale = i18n.language.startsWith("ar") ? "ar" : "en";
	const referenceNow = useMemo(() => new Date(), []);
	const appointments = query.data?.items ?? EMPTY_APPOINTMENTS;
	const totalPages = Math.max(1, Math.ceil((query.data?.total ?? 0) / Math.max(query.data?.pageSize ?? 1, 1)));
	const currentPage = query.data?.page ?? state.page;
	const doctorOptions = useMemo(() => getAppointmentDoctorOptions(appointments), [appointments]);
	const visibleAppointments = appointments;
	const hasResults = visibleAppointments.length > 0;
	const isTabEmpty = (query.data?.total ?? 0) === 0;

	function handleCancelRequest(appointment: PatientAppointment) {
		setCancelTarget(appointment);
		setCancelError(null);
	}

	function handleConfirmCancel() {
		if (!cancelTarget) return;

		cancelMutation.mutate(cancelTarget.id, {
			onSuccess: () => {
				toast.success(t("appointments.dialog.success"));
				setCancelTarget(null);
				setCancelError(null);
			},
			onError: (error) => {
				const code = getCancelAppointmentErrorCode(error);
				if (code === "network") {
					setCancelError(t("appointments.errors.network"));
					return;
				}

				if (code === "not-owned") {
					setCancelError(t("appointments.errors.notOwned"));
				} else {
					setCancelError(t("appointments.errors.tooLate"));
					void query.refetch();
				}
			},
		});
	}

	function handleStatusToggle(status: AppointmentStatus) {
		const allowed = state.statuses.includes(status);
		const nextStatuses = allowed ? state.statuses.filter((value) => value !== status) : [...state.statuses, status];
		setStatuses(nextStatuses.length > 0 ? nextStatuses : state.statuses);
	}

	const appointmentList = hasResults ? visibleAppointments : [];
	const emptyStateKey = isTabEmpty
		? state.tab === "upcoming"
			? "appointments.empty.upcoming"
			: state.tab === "past"
				? "appointments.empty.past"
				: "appointments.empty.canceled"
		: "appointments.empty.filtered";
	const canBookNew = state.tab !== "canceled";

	return (
		<div dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
			<div className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold">{t("appointments.title")}</h1>
				<p className="text-sm text-muted-foreground">{t("appointments.loading.previous")}</p>
			</div>
			<AppointmentTabs activeTab={state.tab} onChange={setTab} label={t("appointments.tabs.label")} />

			<AppointmentFilters
				activeTab={state.tab}
				doctors={doctorOptions}
				selectedDoctorId={state.doctorId}
				selectedStatuses={state.statuses}
				onDoctorChange={setDoctorId}
				onStatusToggle={handleStatusToggle}
				onClear={clearFilters}
				labelDoctor={t("appointments.filters.doctor")}
				labelStatuses={t("appointments.filters.statuses")}
				labelAllDoctors={t("appointments.filters.allDoctors")}
				labelClear={t("appointments.filters.clear")}
				sortBy={state.sortBy}
				sortDir={state.sortDir}
				onSortByChange={setSortBy}
				onSortDirChange={setSortDir}
			/>

			{query.isError ? (
				<AppointmentsErrorState
					title={t("appointments.errors.title")}
					description={t("appointments.errors.loadFailed")}
					retryLabel={t("appointments.errors.retry")}
					onRetry={() => query.refetch()}
				/>
			) : query.isLoading && appointmentList.length === 0 ? (
				<div className="grid gap-4">
					<AppointmentCardSkeleton />
					<AppointmentCardSkeleton />
				</div>
			) : hasResults ? (
				<div className="grid gap-4">
				{appointmentList.map((appointment) => {
					const statusKey = appointment.status === "IN_PROGRESS" ? "inProgress" : appointment.status === "NO_SHOW" ? "noShow" : appointment.status.toLowerCase();
					const statusLabel = t(`appointments.status.${statusKey}`);
					const cancellationNotice = !isAppointmentCancelable(appointment, referenceNow) && (appointment.status === "PENDING" || appointment.status === "CONFIRMED") ? t("appointments.cancellation.notice") : "";

					return (
						<AppointmentCard
							key={appointment.id}
							appointment={appointment}
							locale={locale}
								statusLabel={statusLabel}
								cancelLabel={t("appointments.actions.cancel")}
								onCancel={handleCancelRequest}
								createdAppointmentId={state.createdAppointmentId}
								recentlyCreatedLabel={t("appointments.highlight.recent")}
								noSpecializationLabel={t("appointments.card.noSpecialization")}
								cancellationNoticeLabel={cancellationNotice}
								bookingDateLabel={t("appointments.card.bookingDate")}
								dateLabel={t("appointments.card.date")}
								timeLabel={t("appointments.card.time")}
								referenceNow={referenceNow}
							/>
						);
					})}
				</div>
			) : (
				<AppointmentsEmptyState
					title={t(`${emptyStateKey}.title`)}
					description={t(`${emptyStateKey}.description`)}
					actionLabel={canBookNew ? t("appointments.actions.bookNew") : undefined}
					onAction={() => navigate({ to: ROUTE_BOOK })}
				/>
			)}

			{totalPages > 1 ? (
				<Pagination aria-label={t("appointments.pagination.label")} className="justify-between">
					<PaginationContent className="w-full justify-between">
						<PaginationItem>
							<PaginationPrevious
								href="#"
								text={t("appointments.pagination.previous")}
								onClick={(event) => {
									event.preventDefault();
									setPage(Math.max(1, currentPage - 1));
								}}
								aria-disabled={currentPage <= 1}
							/>
						</PaginationItem>
						<PaginationItem>
							<span className="text-sm text-muted-foreground">{t("appointments.pagination.page", { page: currentPage, totalPages })}</span>
						</PaginationItem>
						<PaginationItem>
							<PaginationNext
								href="#"
								text={t("appointments.pagination.next")}
								onClick={(event) => {
									event.preventDefault();
									setPage(Math.min(totalPages, currentPage + 1));
								}}
								aria-disabled={currentPage >= totalPages}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			) : null}

			<CancelAppointmentDialog
				appointment={cancelTarget}
				open={!!cancelTarget}
				locale={locale}
				errorMessage={cancelError}
				isPending={cancelMutation.isPending}
				onOpenChange={(open) => {
					if (!open && !cancelMutation.isPending) {
						setCancelTarget(null);
						setCancelError(null);
					}
				}}
				onConfirm={handleConfirmCancel}
				title={t("appointments.dialog.title")}
				description={t("appointments.dialog.description")}
								confirmLabel={t("appointments.dialog.confirm")}
								cancelLabel={t("appointments.dialog.cancel")}
								retryLabel={t("appointments.dialog.retry")}
								bookingDateLabel={t("appointments.card.bookingDate")}
				doctorLabel={t("appointments.card.doctor")}
				dateLabel={t("appointments.card.date")}
				timeLabel={t("appointments.card.time")}
			/>
		</div>
	);
}
