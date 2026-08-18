import type { AdminKpiSummaryDTO } from "@/types";
import { formatDelta, formatPercent } from "@/lib/admin-dashboard";
import { KpiCard } from "./KpiCard";

interface KpiCardsRowProps {
	data?: AdminKpiSummaryDTO;
	isLoading?: boolean;
	labels: {
		totalAppointments: string;
		completed: string;
		cancellationRate: string;
		noShowRate: string;
		activePatients: string;
		waitlistSize: string;
		currentPeriod: string;
	};
}

export function KpiCardsRow({ data, isLoading, labels }: KpiCardsRowProps) {
	const value = (fallback: string, next?: string) => (isLoading ? fallback : next ?? fallback);

	return (
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			<KpiCard label={labels.totalAppointments} value={value("--", data ? String(data.totalAppointments) : undefined)} deltaLabel={data ? formatDelta(data.deltaTotalPct) : labels.currentPeriod} />
			<KpiCard label={labels.completed} value={value("--", data ? String(data.completed) : undefined)} deltaLabel={data ? formatDelta(data.deltaCompletedPct) : labels.currentPeriod} />
			<KpiCard label={labels.cancellationRate} value={value("--", data ? formatPercent(data.cancellationRate) : undefined)} deltaLabel={labels.currentPeriod} />
			<KpiCard label={labels.noShowRate} value={value("--", data ? formatPercent(data.noShowRate) : undefined)} deltaLabel={labels.currentPeriod} />
			<KpiCard label={labels.activePatients} value={value("--", data ? String(data.activePatients) : undefined)} deltaLabel={labels.currentPeriod} />
			<KpiCard label={labels.waitlistSize} value={value("--", data ? String(data.waitlistSize) : undefined)} deltaLabel={labels.currentPeriod} />
		</div>
	);
}
