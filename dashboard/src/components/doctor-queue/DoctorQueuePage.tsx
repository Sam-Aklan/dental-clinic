import { useMemo } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { useAppointmentNoteMutation, useAppointmentStatusMutation, useDoctorQueueDate, useDoctorQueueFilters, useDoctorQueueQuery, useDoctorQueueSections, useDoctorQueueSocket } from "@/hooks/doctor-queue";
import { useDoctor } from "@/hooks/doctors-admin";
import { useAuthStore } from "@/stores";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { DoctorQueueEmptyState } from "./DoctorQueueStates";
import { DoctorQueueErrorState } from "./DoctorQueueStates";
import { DoctorQueueSkeleton } from "./DoctorQueueStates";
import { QueueFreshnessIndicator } from "./QueueFreshnessIndicator";
import { QueueFilterBar } from "./QueueFilterBar";
import { QueueSection } from "./QueueSection";
import { QueueSummaryBar } from "./QueueSummaryBar";

function shouldShowDoctorProfileWarning(error: unknown) {
	const status = (error as { response?: { status?: number } } | null)?.response?.status;
	return status === 403 || status === 404;
}

export function DoctorQueuePage() {
	const { t } = useTranslation();
	const doctorProfileId = useAuthStore((state) => state.user?.doctorProfileId ?? null);
	const { clinicDate } = useDoctorQueueDate();
	const filters = useDoctorQueueFilters();
	const doctorProfileQuery = useDoctor(doctorProfileId ?? "");
	const queueQuery = useDoctorQueueQuery(clinicDate);
	const statusMutation = useAppointmentStatusMutation();
	const noteMutation = useAppointmentNoteMutation();
	const { connectionState, isReconnecting } = useDoctorQueueSocket(clinicDate);

	const { summary, sections } = useDoctorQueueSections(queueQuery.data, filters.state);
	const lastUpdatedAt = useMemo(() => queueQuery.data?.reduce<string | null>((latest, appointment) => {
		if (!latest) return appointment.updatedAt;
		return dayjs(appointment.updatedAt).isAfter(latest) ? appointment.updatedAt : latest;
	}, null) ?? null, [queueQuery.data]);

	if (queueQuery.isLoading) {
		return <DoctorQueueSkeleton />;
	}

	if (queueQuery.isError) {
		return <DoctorQueueErrorState message={t("queue.error.load")} onRetry={() => queueQuery.refetch()} />;
	}

	const isEmpty = (queueQuery.data?.length ?? 0) === 0;

	return (
		<section className="grid gap-4 p-4 md:p-6">
			<header className="grid gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="text-2xl font-semibold">{t("queue.page.title")}</h1>
					{isReconnecting ? <span className="text-sm text-muted-foreground">{t("queue.status.reconnecting")}</span> : null}
				</div>
				<p className="text-sm text-muted-foreground">{t("queue.page.subtitle")}</p>
				<QueueFreshnessIndicator lastUpdatedAt={lastUpdatedAt} connectionState={connectionState} onRefresh={() => queueQuery.refetch()} />
			</header>

			{doctorProfileId ? (
				doctorProfileQuery.isError && shouldShowDoctorProfileWarning(doctorProfileQuery.error) ? (
					<Alert variant="destructive">
						<AlertTitle>{t("queue.profile.warningTitle")}</AlertTitle>
						<AlertDescription>{t("queue.profile.warning")}</AlertDescription>
					</Alert>
				) : (
					<Card>
						<CardContent className="grid gap-1 p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("queue.profile.title")}</p>
							{doctorProfileQuery.isLoading ? (
								<p className="text-sm text-muted-foreground">{t("queue.profile.loading")}</p>
							) : doctorProfileQuery.data ? (
								<>
									<p className="text-base font-semibold">{doctorProfileQuery.data.firstName} {doctorProfileQuery.data.lastName}</p>
									<p className="text-sm text-muted-foreground">{doctorProfileQuery.data.specialization ?? t("queue.profile.specializationFallback")}</p>
								</>
							) : null}
						</CardContent>
					</Card>
				)
			) : null}

			<QueueSummaryBar summary={summary} />
			<QueueFilterBar state={filters.state} onToggleStatus={filters.toggleStatus} onToggleShowFinished={filters.toggleShowFinished} onClear={filters.clearFilters} />

			{isEmpty ? <DoctorQueueEmptyState title={t("queue.empty.title")} description={t("queue.empty.description")} /> : null}

			<div className="grid gap-4">
				{sections.map((section) => (
					<QueueSection
						key={section.key}
						section={section}
						title={t(`queue.section.${section.key}`)}
						emptyLabel={t(`queue.sectionEmpty.${section.key}`)}
						onStatusChange={(id, status, needsFollowUp) => statusMutation.mutate({ id, status, needsFollowUp })}
						onMarkNoFollowUpNeeded={(id, status) => statusMutation.mutate({ id, status, needsFollowUp: false })}
						onSaveNote={(id, notes) => noteMutation.mutate({ id, notes })}
					/>
				))}
			</div>
		</section>
	);
}
