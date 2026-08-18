import { useTranslation } from "react-i18next";
import { useDoctorTodayMutations, useDoctorTodaySchedule, useDoctorTodayState, useMyHourlyLoad, useMyStats, useMyStatusDistribution, useMyTrends } from "@/hooks/doctor-today";
import { useDoctor } from "@/hooks/doctors-admin";
import { monthEnd, monthStart, todayClinicDate, toClinicDate, weekEnd, weekStart } from "@/lib/doctor-today";
import { useAuthStore } from "@/stores";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { DoctorTodayHeader } from "./DoctorTodayHeader";
import { DoctorKpiCards } from "./DoctorKpiCards";
import { MyWeekAtGlanceChart } from "./MyWeekAtGlanceChart";
import { MyStatusDistributionChart } from "./MyStatusDistributionChart";
import { MyHourlyLoadChart } from "./MyHourlyLoadChart";
import { DoctorScheduleTabs } from "./DoctorScheduleTabs";
import { DoctorScheduleTable } from "./DoctorScheduleTable";

function shouldShowDoctorProfileWarning(error: unknown) {
	const status = (error as { response?: { status?: number } } | null)?.response?.status;
	return status === 403 || status === 404;
}

export function DoctorTodayPage() {
	const { t, i18n } = useTranslation();
	const doctorProfileId = useAuthStore((state) => state.user?.doctorProfileId ?? null);
	const { state, setDate, setTab, setStatus, setPage, setSort } = useDoctorTodayState();
	const { updateStatus, updateNotes, statusMutation, notesMutation } = useDoctorTodayMutations();
	const doctorProfileQuery = useDoctor(doctorProfileId ?? "");

	const scheduleQuery = useDoctorTodaySchedule(state);
	const statsQuery = useMyStats(state.date);
	const trendsQuery = useMyTrends(state.week);
	const statusDistributionQuery = useMyStatusDistribution(monthStart(state.date), monthEnd(state.date));
	const hourlyLoadQuery = useMyHourlyLoad(monthStart(state.date), monthEnd(state.date));

	const locale = i18n.language.startsWith("ar") ? "ar" : "en";
	const isTodayDate = state.date === todayClinicDate();
	const weeklyRows = scheduleQuery.data?.data ?? [];
	const lastUpdatedAt = weeklyRows.reduce<string | null>((latest, appointment) => {
		if (!latest) return appointment.updatedAt;
		return appointment.updatedAt > latest ? appointment.updatedAt : latest;
	}, null);
	const selectedDateLabel = state.tab === "today" ? toClinicDate(state.date) : `${weekStart(state.week)} → ${weekEnd(state.week)}`;

	return (
		<section dir={locale === "ar" ? "rtl" : "ltr"} className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
			{doctorProfileId ? (
				doctorProfileQuery.isError && shouldShowDoctorProfileWarning(doctorProfileQuery.error) ? (
					<Alert variant="destructive">
						<AlertTitle>{t("doctorToday.profile.warningTitle")}</AlertTitle>
						<AlertDescription>{t("doctorToday.profile.warning")}</AlertDescription>
					</Alert>
				) : (
					<Card>
						<CardContent className="grid gap-1 p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("doctorToday.profile.title")}</p>
							{doctorProfileQuery.isLoading ? (
								<p className="text-sm text-muted-foreground">{t("doctorToday.profile.loading")}</p>
							) : doctorProfileQuery.data ? (
								<>
									<p className="text-base font-semibold">{doctorProfileQuery.data.firstName} {doctorProfileQuery.data.lastName}</p>
									<p className="text-sm text-muted-foreground">{doctorProfileQuery.data.specialization ?? t("doctorToday.profile.specializationFallback")}</p>
								</>
							) : null}
						</CardContent>
					</Card>
				)
			) : null}

			<DoctorTodayHeader
				title={t("doctorToday.page.title")}
				subtitle={t("doctorToday.page.subtitle")}
				selectedDateLabel={selectedDateLabel}
				value={state.date}
				isToday={isTodayDate}
				lastUpdatedAt={lastUpdatedAt}
				onDateChange={setDate}
				onRefresh={() => void scheduleQuery.refetch()}
				myQueueLabel={t("nav.myQueue")}
			/>

			<DoctorKpiCards
				data={statsQuery.data}
				isLoading={statsQuery.isLoading}
				isError={statsQuery.isError}
				errorLabel={t("doctorToday.error.stats")}
				retryLabel={t("doctorToday.actions.retry")}
				labels={{
					total: t("doctorToday.kpi.todayTotal"),
					completed: t("doctorToday.kpi.completed"),
					remaining: t("doctorToday.kpi.remaining"),
					inSession: t("doctorToday.kpi.inSession"),
					noShows: t("doctorToday.kpi.noShows"),
					selectedDate: t("doctorToday.kpi.selectedDate"),
				}}
				onRetry={() => void statsQuery.refetch()}
			/>

			<div className="grid gap-4 lg:grid-cols-2">
				<MyWeekAtGlanceChart
					data={trendsQuery.data}
					isLoading={trendsQuery.isLoading}
					isError={trendsQuery.isError}
					title={t("doctorToday.charts.week.title")}
					description={t("doctorToday.charts.week.description")}
					errorLabel={t("doctorToday.error.trends")}
					retryLabel={t("doctorToday.actions.retry")}
					onRetry={() => void trendsQuery.refetch()}
					onSelectDay={(date) => {
						setDate(date);
						setTab("today");
					}}
					selectedDate={state.date}
					locale={locale}
				/>

				<MyStatusDistributionChart
					data={statusDistributionQuery.data}
					isLoading={statusDistributionQuery.isLoading}
					isError={statusDistributionQuery.isError}
					title={t("doctorToday.charts.status.title")}
					description={t("doctorToday.charts.status.description")}
					errorLabel={t("doctorToday.error.statusDistribution")}
					retryLabel={t("doctorToday.actions.retry")}
					onRetry={() => void statusDistributionQuery.refetch()}
					onStatusSelect={(status) => setStatus(state.status.includes(status) && state.status.length === 1 ? [] : [status])}
					selectedStatus={state.status}
				/>
			</div>

			<MyHourlyLoadChart
				data={hourlyLoadQuery.data}
				isLoading={hourlyLoadQuery.isLoading}
				isError={hourlyLoadQuery.isError}
				title={t("doctorToday.charts.hourly.title")}
				description={t("doctorToday.charts.hourly.description")}
				errorLabel={t("doctorToday.error.hourlyLoad")}
				retryLabel={t("doctorToday.actions.retry")}
				onRetry={() => void hourlyLoadQuery.refetch()}
			/>

			<div className="grid gap-4">
				<DoctorScheduleTabs activeTab={state.tab} onChange={setTab} todayLabel={t("doctorToday.tabs.today")} thisWeekLabel={t("doctorToday.tabs.thisWeek")} />

				<DoctorScheduleTable
					view={state.tab}
					appointments={scheduleQuery.data?.data ?? []}
					page={scheduleQuery.data?.page ?? state.page}
					total={scheduleQuery.data?.total ?? 0}
					pageSize={scheduleQuery.data?.pageSize ?? (state.tab === "thisWeek" ? 20 : 50)}
					isLoading={scheduleQuery.isLoading}
					isError={scheduleQuery.isError}
					errorLabel={t("doctorToday.error.schedule")}
					retryLabel={t("doctorToday.actions.retry")}
					onRetry={() => void scheduleQuery.refetch()}
					onPageChange={setPage}
					onSortChange={setSort}
					onStatusChange={setStatus}
					onUpdateStatus={updateStatus}
					onSaveNotes={updateNotes}
					pendingStatusId={statusMutation.variables?.id ?? null}
					pendingNotesId={notesMutation.variables?.id ?? null}
					selectedDate={state.date}
					selectedStatus={state.status}
					sortBy={state.sortBy}
					sortDir={state.sortDir}
				/>
			</div>
		</section>
	);
}
