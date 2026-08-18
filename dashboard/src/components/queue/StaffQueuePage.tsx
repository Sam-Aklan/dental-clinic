import { useMemo } from "react";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { QueueEmptyState } from "./QueueEmptyState";
import { QueueErrorState } from "./QueueErrorState";
import { QueueKpiBanner } from "./QueueKpiBanner";
import { QueueSkeleton } from "./QueueSkeleton";
import { ReconnectingBadge } from "./ReconnectingBadge";
import { StaffQueueFilters } from "./StaffQueueFilters";
import { DoctorQueueGroup } from "./DoctorQueueGroup";
import { TodayByDoctorChart } from "./TodayByDoctorChart";
import { TodayStatusOverviewChart } from "./TodayStatusOverviewChart";
import { groupByDoctor } from "@/lib/queue";
import type { AppointmentStatus } from "@/types";
import { useQueueSocket, useStaffQueueDoctorOptions, useStaffQueueQuery, useStaffQueueSearchState, useTodayByDoctorQuery, useTodaySummaryQuery, useUpdateStatusMutation, useCancelStaffMutation } from "@/hooks/queue";
import type { QueueLabels } from "./QueueItem";

export function StaffQueuePage() {
	const { t } = useTranslation();
	const today = dayjs().format("YYYY-MM-DD");
	const search = useStaffQueueSearchState();
	const queueQuery = useStaffQueueQuery({ date: today, ...search.state });
	const summaryQuery = useTodaySummaryQuery(today);
	const doctorChartQuery = useTodayByDoctorQuery(today);
	const updateMutation = useUpdateStatusMutation();
	const cancelMutation = useCancelStaffMutation();
	const doctorFilter = useStaffQueueDoctorOptions(search.state.doctorIds);

	const grouped = useMemo(() => groupByDoctor(queueQuery.data ?? []), [queueQuery.data]);
	const visibleDoctorIds = useMemo(() => grouped.map((group) => group.doctorId), [grouped]);
	const { connectionStatus } = useQueueSocket(visibleDoctorIds);

	const filterLabels = {
		search: t("staffQueue.filters.search"),
		doctors: t("staffQueue.filters.doctors"),
		statuses: t("staffQueue.filters.statuses"),
		clear: t("staffQueue.filters.clear"),
		refresh: t("staffQueue.filters.refresh"),
	};

	const kpiLabels = {
		total: t("staffQueue.kpi.total"),
		inProgress: t("staffQueue.kpi.inProgress"),
		waiting: t("staffQueue.kpi.waiting"),
		completed: t("staffQueue.kpi.completed"),
		canceledToday: t("staffQueue.kpi.canceledToday"),
		noShow: t("staffQueue.kpi.noShow"),
		pendingConfirmation: t("staffQueue.kpi.pendingConfirmation"),
		compactWarning: t("staffQueue.kpi.compactWarning"),
	};

	const queueLabels: QueueLabels = {
		queueItems: t("staffQueue.queueItems"),
		PENDING: t("staffQueue.status.PENDING"),
		CONFIRMED: t("staffQueue.status.CONFIRMED"),
		IN_PROGRESS: t("staffQueue.status.IN_PROGRESS"),
		COMPLETED: t("staffQueue.status.COMPLETED"),
		CANCELED: t("staffQueue.status.CANCELED"),
		NO_SHOW: t("staffQueue.status.NO_SHOW"),
		action: {
			confirm: t("staffQueue.actions.confirm"),
			start: t("staffQueue.actions.start"),
			complete: t("staffQueue.actions.complete"),
			cancel: t("staffQueue.actions.cancel"),
			noShow: t("staffQueue.actions.noShow"),
			cancelDescription: t("staffQueue.actions.cancelDescription"),
			noShowDescription: t("staffQueue.actions.noShowDescription"),
		},
		updatedAt: t("staffQueue.updatedAt"),
		live: t("staffQueue.live"),
		reconnecting: t("staffQueue.reconnecting"),
		emptyTitle: t("staffQueue.empty.title"),
		emptyDescription: t("staffQueue.empty.description"),
	};

	const statusValues: AppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED", "NO_SHOW"];
	const statusOptions: Array<{ value: AppointmentStatus; label: string }> = statusValues.map((value) => ({ value, label: t(`staffQueue.status.${value}`) }));

	function handleStatusChange(id: string, status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED") {
		updateMutation.mutate({ id, status });
	}

	function handleMarkNoFollowUpNeeded(id: string, status: AppointmentStatus) {
		updateMutation.mutate({ id, status, needsFollowUp: false });
	}

	function handleCancel(id: string, reason?: string) {
		cancelMutation.mutate({ id, reason });
	}

	function handleNoShow(id: string, reason?: string) {
		void reason;
		updateMutation.mutate({ id, status: "NO_SHOW" });
	}

	if (queueQuery.isLoading || summaryQuery.isLoading || doctorChartQuery.isLoading) {
		return <QueueSkeleton />;
	}

	if (queueQuery.isError) {
		return <QueueErrorState message={t("staffQueue.errors.loadQueue")} onRetry={() => queueQuery.refetch()} />;
	}

	const isEmpty = !queueQuery.data || queueQuery.data.length === 0;

	return (
		<section className="grid gap-6 p-4 md:p-6">
			<header className="grid gap-2">
				<div className="flex flex-wrap items-center gap-2">
					<h1 className="text-2xl font-semibold">{t("staffQueue.title")}</h1>
					<ReconnectingBadge connectionStatus={connectionStatus} label={queueLabels.reconnecting} />
				</div>
				<p className="text-sm text-muted-foreground">{t("staffQueue.subtitle")}</p>
				<p className="text-xs text-muted-foreground">{queueLabels.live} · {t("staffQueue.updatedAt", { time: dayjs().format("HH:mm") })}</p>
			</header>

		<QueueKpiBanner summary={summaryQuery.data} isLoading={summaryQuery.isLoading} compact={false} labels={kpiLabels} />

			<div className="grid gap-4 xl:grid-cols-2">
				<TodayByDoctorChart data={doctorChartQuery.data ?? []} labels={{ title: t("staffQueue.charts.byDoctor"), confirmed: t("staffQueue.status.CONFIRMED"), inProgress: t("staffQueue.status.IN_PROGRESS"), completed: t("staffQueue.status.COMPLETED"), canceled: t("staffQueue.status.CANCELED") }} onDoctorClick={search.toggleDoctorId} />
				<TodayStatusOverviewChart summary={summaryQuery.data} appointments={queueQuery.data ?? []} labels={{ title: t("staffQueue.charts.statusOverview"), PENDING: t("staffQueue.status.PENDING"), CONFIRMED: t("staffQueue.status.CONFIRMED"), IN_PROGRESS: t("staffQueue.status.IN_PROGRESS"), COMPLETED: t("staffQueue.status.COMPLETED"), CANCELED: t("staffQueue.status.CANCELED"), NO_SHOW: t("staffQueue.status.NO_SHOW") }} />
			</div>

			<StaffQueueFilters
				state={search.state}
				doctorOptions={doctorFilter.options.map((doctor) => ({ id: doctor.id, label: [doctor.firstName, doctor.lastName].filter(Boolean).join(" ") }))}
				doctorSearch={doctorFilter.searchQuery}
				onDoctorSearchChange={doctorFilter.setSearchQuery}
				doctorSearchOpen={doctorFilter.isOpen}
				onDoctorSearchOpenChange={doctorFilter.handleOpenChange}
				selectedDoctorLabels={doctorFilter.selectedDoctorLabels}
				isDoctorOptionsLoading={doctorFilter.isLoading || doctorFilter.isFetching}
				statusOptions={statusOptions}
				onDoctorToggle={search.toggleDoctorId}
				onStatusToggle={search.toggleStatus}
				onSearchChange={search.replaceSearch}
				onClear={search.clearFilters}
				onRefresh={() => queueQuery.refetch()}
				labels={filterLabels}
			/>

			{isEmpty ? (
				<QueueEmptyState title={queueLabels.emptyTitle} description={queueLabels.emptyDescription} />
			) : (
				<div className="grid gap-6">
					{grouped.map((group) => (
					<DoctorQueueGroup key={group.doctorId} group={group} labels={queueLabels} onStatusChange={handleStatusChange} onMarkNoFollowUpNeeded={handleMarkNoFollowUpNeeded} onCancel={handleCancel} onNoShow={handleNoShow} />
					))}
				</div>
			)}
		</section>
	);
}
