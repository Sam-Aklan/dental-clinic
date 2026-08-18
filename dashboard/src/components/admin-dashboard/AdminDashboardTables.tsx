import { Button } from "@/components/ui/button";
import { useAdminDashboardTableQueries } from "@/hooks/admin-dashboard";
import type { AdminAppointmentsFilters, AdminDashboardUrlState, AdminFollowUpsFilters, AdminWaitlistFilters } from "@/types";
import { AdminAppointmentsTable } from "./AdminAppointmentsTable";
import { FollowUpsTable } from "./FollowUpsTable";
import { WaitlistAdminTable } from "./WaitlistAdminTable";

interface Props {
	state: AdminDashboardUrlState;
	appointmentsFilters: AdminAppointmentsFilters;
	followUpsFilters: AdminFollowUpsFilters;
	waitlistFilters: AdminWaitlistFilters;
	labels: {
		appointmentsTab: string;
		followUpsTab: string;
		waitlistTab: string;
		appointments: {
			from: string;
			to: string;
			doctor: string;
			patient: string;
			status: string;
			bookedAt: string;
			action: string;
			cancel: string;
			canceling: string;
			noActions: string;
			empty: string;
			export: string;
			exporting: string;
			page: string;
			previous: string;
			next: string;
		};
		followUps: {
			patient: string;
			lastAppointment: string;
			daysSince: string;
			upcoming: string;
			action: string;
			empty: string;
			threshold: string;
			updateThreshold: string;
			page: string;
			previous: string;
			next: string;
		};
		waitlist: {
			position: string;
			patient: string;
			doctor: string;
			availabilityWindow: string;
			joined: string;
			action: string;
			empty: string;
			page: string;
			previous: string;
			next: string;
		};
		errors: { title: string; retry: string };
	};
	onTabChange: (tab: AdminDashboardUrlState["tab"]) => void;
	onPageChange: (page: number) => void;
	onSortChange: (sortBy: AdminAppointmentsFilters["sortBy"], sortDir: AdminAppointmentsFilters["sortDir"]) => void;
	onThresholdChange: (thresholdDays: number) => void;
	locale: "en" | "ar";
}

export function AdminDashboardTables({ state, appointmentsFilters, followUpsFilters, waitlistFilters, labels, onTabChange, onPageChange, onSortChange, onThresholdChange, locale }: Props) {
	const queries = useAdminDashboardTableQueries(appointmentsFilters, followUpsFilters, waitlistFilters);

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-2">
				<Button type="button" variant={state.tab === "appointments" ? "default" : "outline"} onClick={() => onTabChange("appointments")}>{labels.appointmentsTab}</Button>
				<Button type="button" variant={state.tab === "follow-ups" ? "default" : "outline"} onClick={() => onTabChange("follow-ups")}>{labels.followUpsTab}</Button>
				<Button type="button" variant={state.tab === "waitlist" ? "default" : "outline"} onClick={() => onTabChange("waitlist")}>{labels.waitlistTab}</Button>
			</div>

			{state.tab === "appointments" ? (
				<AdminAppointmentsTable
					data={queries.appointments.data?.data ?? []}
					filters={appointmentsFilters}
					total={queries.appointments.data?.total ?? 0}
					isLoading={queries.appointments.isLoading}
					isError={queries.appointments.isError}
					errorLabel={labels.errors.title}
					retryLabel={labels.errors.retry}
					labels={labels.appointments}
					onPageChange={onPageChange}
					onSortChange={onSortChange}
					onRetry={() => queries.appointments.refetch()}
				/>
			) : null}

			{state.tab === "follow-ups" ? (
				<FollowUpsTable
					data={queries.followUps.data?.data ?? []}
					filters={followUpsFilters}
					total={queries.followUps.data?.total ?? 0}
					locale={locale}
					isLoading={queries.followUps.isLoading}
					isError={queries.followUps.isError}
					errorLabel={labels.errors.title}
					retryLabel={labels.errors.retry}
					labels={labels.followUps}
					onPageChange={onPageChange}
					onThresholdChange={onThresholdChange}
					onRetry={() => queries.followUps.refetch()}
				/>
			) : null}

			{state.tab === "waitlist" ? (
				<WaitlistAdminTable
					data={queries.waitlist.data?.data ?? []}
					filters={waitlistFilters}
					total={queries.waitlist.data?.total ?? 0}
					locale={locale}
					isLoading={queries.waitlist.isLoading}
					isError={queries.waitlist.isError}
					errorLabel={labels.errors.title}
					retryLabel={labels.errors.retry}
					labels={labels.waitlist}
					onPageChange={onPageChange}
					onRetry={() => queries.waitlist.refetch()}
				/>
			) : null}
		</div>
	);
}
