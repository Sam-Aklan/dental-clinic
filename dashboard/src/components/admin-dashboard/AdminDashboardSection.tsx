import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks";
import { useAdminDashboardAnalyticsQueries, useAdminDashboardUrlState, useAdminKpiSummaryQuery, useAdminWaitlistSummaryQuery } from "@/hooks/admin-dashboard";
import type { AdminDashboardUrlState } from "@/types";
import { KpiCardsRow } from "./KpiCardsRow";
import { DashboardFilters } from "./DashboardFilters";
import { AppointmentTrendsChart } from "./AppointmentTrendsChart";
import { StatusDistributionChart } from "./StatusDistributionChart";
import { DoctorUtilizationChart } from "./DoctorUtilizationChart";
import { BusiestDaysChart } from "./BusiestDaysChart";
import { CancellationTrendChart } from "./CancellationTrendChart";
import { WaitlistSummaryChart } from "./WaitlistSummaryChart";
import { AdminDashboardTables } from "./AdminDashboardTables";

export function AdminDashboardSection() {
	const { t } = useTranslation();
	const { lang, dir } = useLanguage();
	const dashboard = useAdminDashboardUrlState();
	const kpiQuery = useAdminKpiSummaryQuery({ from: dashboard.state.from, to: dashboard.state.to });
	const analytics = useAdminDashboardAnalyticsQueries({ from: dashboard.state.from, to: dashboard.state.to, bucket: dashboard.effectiveBucket });
	const waitlistSummaryQuery = useAdminWaitlistSummaryQuery();

	return (
		<section dir={dir} className="flex flex-col gap-6">
			<header className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold tracking-tight">{t("adminDashboard.title")}</h1>
				<p className="text-sm text-muted-foreground">{t("adminDashboard.subtitle")}</p>
			</header>

			<DashboardFilters
				state={dashboard.state}
				onApply={({ from, to, doctorId, status, patientName, bucket }) => dashboard.setState({ from, to, doctorId, status: status as AdminDashboardUrlState["status"], patientName, bucket: bucket as AdminDashboardUrlState["bucket"] })}
				onReset={dashboard.resetState}
				labels={{
					title: t("adminDashboard.filters.title"),
					from: t("adminDashboard.filters.from"),
					to: t("adminDashboard.filters.to"),
					doctorId: t("adminDashboard.filters.doctorId"),
					doctorAll: t("adminDashboard.filters.doctorAll"),
					doctorSearchPlaceholder: t("adminDashboard.filters.doctorSearchPlaceholder"),
					doctorLoading: t("adminDashboard.filters.doctorLoading"),
					doctorEmpty: t("adminDashboard.filters.doctorEmpty"),
					status: t("adminDashboard.filters.status"),
					patientName: t("adminDashboard.filters.patientName"),
					bucket: t("adminDashboard.filters.bucket"),
					apply: t("adminDashboard.filters.apply"),
					reset: t("adminDashboard.filters.reset"),
				}}
				statusOptions={[
					{ value: "PENDING", label: t("adminDashboard.status.PENDING") },
					{ value: "CONFIRMED", label: t("adminDashboard.status.CONFIRMED") },
					{ value: "IN_PROGRESS", label: t("adminDashboard.status.IN_PROGRESS") },
					{ value: "COMPLETED", label: t("adminDashboard.status.COMPLETED") },
					{ value: "CANCELED", label: t("adminDashboard.status.CANCELED") },
					{ value: "NO_SHOW", label: t("adminDashboard.status.NO_SHOW") },
				]}
				bucketOptions={[
					{ value: "auto", label: t("adminDashboard.bucket.auto") },
					{ value: "day", label: t("adminDashboard.bucket.day") },
					{ value: "week", label: t("adminDashboard.bucket.week") },
					{ value: "month", label: t("adminDashboard.bucket.month") },
				]}
				isRtl={dir ==='rtl'?true:false}
			/>

			<KpiCardsRow
				data={kpiQuery.data}
				isLoading={kpiQuery.isLoading}
				labels={{
					totalAppointments: t("adminDashboard.kpi.totalAppointments"),
					completed: t("adminDashboard.kpi.completed"),
					cancellationRate: t("adminDashboard.kpi.cancellationRate"),
					noShowRate: t("adminDashboard.kpi.noShowRate"),
					activePatients: t("adminDashboard.kpi.activePatients"),
					waitlistSize: t("adminDashboard.kpi.waitlistSize"),
					currentPeriod: t("adminDashboard.kpi.currentPeriod"),
				}}
			/>

			<div className="grid gap-4 xl:grid-cols-2">
				<AppointmentTrendsChart
					data={analytics.trends.data}
					isLoading={analytics.trends.isLoading}
					isError={analytics.trends.isError}
					title={t("adminDashboard.charts.trends")}
						errorLabel={t("adminDashboard.errors.chart")}
						retryLabel={t("adminDashboard.errors.retry")}
						locale={lang}
						labels={{ confirmed: t("adminDashboard.status.CONFIRMED"), completed: t("adminDashboard.status.COMPLETED"), canceled: t("adminDashboard.status.CANCELED"), noShow: t("adminDashboard.status.NO_SHOW") }}
						onRetry={() => analytics.trends.refetch()}
						onDrillDown={(point) => dashboard.setState({ from: point.date, to: point.date, status: point.completed > 0 ? "COMPLETED" : point.confirmed > 0 ? "CONFIRMED" : point.canceled > 0 ? "CANCELED" : "NO_SHOW", tab: "appointments", page: 1 })}
				/>
				<StatusDistributionChart
					data={analytics.statusDistribution.data}
					isLoading={analytics.statusDistribution.isLoading}
					isError={analytics.statusDistribution.isError}
					title={t("adminDashboard.charts.statusDistribution")}
					errorLabel={t("adminDashboard.errors.chart")}
					retryLabel={t("adminDashboard.errors.retry")}
					onRetry={() => analytics.statusDistribution.refetch()}
					labels={{
						PENDING: t("adminDashboard.status.PENDING"),
						CONFIRMED: t("adminDashboard.status.CONFIRMED"),
						IN_PROGRESS: t("adminDashboard.status.IN_PROGRESS"),
						COMPLETED: t("adminDashboard.status.COMPLETED"),
						CANCELED: t("adminDashboard.status.CANCELED"),
						NO_SHOW: t("adminDashboard.status.NO_SHOW"),
					}}
					onDrillDown={(status) => dashboard.setState({ status: status as AdminDashboardUrlState["status"], tab: "appointments", page: 1 })}
				/>
				<DoctorUtilizationChart
					data={analytics.doctorUtilization.data}
					isLoading={analytics.doctorUtilization.isLoading}
					isError={analytics.doctorUtilization.isError}
					title={t("adminDashboard.charts.doctorUtilization")}
					errorLabel={t("adminDashboard.errors.chart")}
					retryLabel={t("adminDashboard.errors.retry")}
					locale={lang}
					onRetry={() => analytics.doctorUtilization.refetch()}
					onDrillDown={(doctorId) => dashboard.setState({ doctorId, tab: "appointments", page: 1 })}
				/>
				<BusiestDaysChart
					data={analytics.appointmentsByWeekday.data}
					isLoading={analytics.appointmentsByWeekday.isLoading}
					isError={analytics.appointmentsByWeekday.isError}
					title={t("adminDashboard.charts.busiestDays")}
					errorLabel={t("adminDashboard.errors.chart")}
					retryLabel={t("adminDashboard.errors.retry")}
					onRetry={() => analytics.appointmentsByWeekday.refetch()}
				/>
				<CancellationTrendChart
					data={analytics.cancellationTrends.data}
					isLoading={analytics.cancellationTrends.isLoading}
					isError={analytics.cancellationTrends.isError}
					title={t("adminDashboard.charts.cancellationTrends")}
						errorLabel={t("adminDashboard.errors.chart")}
						retryLabel={t("adminDashboard.errors.retry")}
						locale={lang}
						labels={{ canceledByPatient: t("adminDashboard.charts.canceledByPatient"), canceledByStaff: t("adminDashboard.charts.canceledByStaff"), noShow: t("adminDashboard.status.NO_SHOW") }}
						onRetry={() => analytics.cancellationTrends.refetch()}
				/>
				<WaitlistSummaryChart
					data={waitlistSummaryQuery.data}
					isLoading={waitlistSummaryQuery.isLoading}
					isError={waitlistSummaryQuery.isError}
					title={t("adminDashboard.charts.waitlistSummary")}
					errorLabel={t("adminDashboard.errors.chart")}
					retryLabel={t("adminDashboard.errors.retry")}
					totalActiveLabel={t("adminDashboard.waitlistSummary.totalActive")}
					emptyLabel={t("adminDashboard.waitlistSummary.empty")}
					doctorCountLabel={t("adminDashboard.waitlistSummary.doctorCount")}
					onRetry={() => waitlistSummaryQuery.refetch()}
				/>
			</div>

			<AdminDashboardTables
				state={dashboard.state}
				appointmentsFilters={dashboard.appointmentsFilters}
				followUpsFilters={dashboard.followUpsFilters}
				waitlistFilters={dashboard.waitlistFilters}
				labels={{
					appointmentsTab: t("adminDashboard.tabs.appointments"),
					followUpsTab: t("adminDashboard.tabs.followUps"),
					waitlistTab: t("adminDashboard.tabs.waitlist"),
					appointments: {
						from: t("adminDashboard.table.appointments.from"),
						to: t("adminDashboard.table.appointments.to"),
						doctor: t("adminDashboard.table.appointments.doctor"),
						patient: t("adminDashboard.table.appointments.patient"),
						status: t("adminDashboard.table.appointments.status"),
						bookedAt: t("adminDashboard.table.appointments.bookedAt"),
						action: t("adminDashboard.table.appointments.action"),
						cancel: t("adminDashboard.table.appointments.cancel"),
						canceling: t("adminDashboard.table.appointments.canceling"),
						noActions: t("adminDashboard.table.appointments.noActions"),
						empty: t("adminDashboard.table.empty"),
						export: t("adminDashboard.export.export"),
						exporting: t("adminDashboard.export.exporting"),
						page: t("adminDashboard.table.page"),
						previous: t("adminDashboard.table.previous"),
						next: t("adminDashboard.table.next"),
					},
					followUps: {
						patient: t("adminDashboard.table.followUps.patient"),
						lastAppointment: t("adminDashboard.table.followUps.lastAppointment"),
						daysSince: t("adminDashboard.table.followUps.daysSince"),
						upcoming: t("adminDashboard.table.followUps.upcoming"),
						action: t("adminDashboard.table.followUps.action"),
						empty: t("adminDashboard.table.empty"),
						threshold: t("adminDashboard.table.followUps.threshold"),
						updateThreshold: t("adminDashboard.table.followUps.updateThreshold"),
						page: t("adminDashboard.table.page"),
						previous: t("adminDashboard.table.previous"),
						next: t("adminDashboard.table.next"),
					},
					waitlist: {
						position: t("adminDashboard.table.waitlist.position"),
						patient: t("adminDashboard.table.waitlist.patient"),
						doctor: t("adminDashboard.table.waitlist.doctor"),
						availabilityWindow: t("adminDashboard.table.waitlist.availabilityWindow"),
						joined: t("adminDashboard.table.waitlist.joined"),
						action: t("adminDashboard.table.waitlist.action"),
						empty: t("adminDashboard.table.empty"),
						page: t("adminDashboard.table.page"),
						previous: t("adminDashboard.table.previous"),
						next: t("adminDashboard.table.next"),
					},
					errors: { title: t("adminDashboard.errors.table"), retry: t("adminDashboard.errors.retry") },
				}}
				onTabChange={dashboard.setTab}
				onPageChange={dashboard.setPage}
				onSortChange={dashboard.setSort}
				onThresholdChange={dashboard.setThresholdDays}
				locale={lang}
			/>
		</section>
	);
}
