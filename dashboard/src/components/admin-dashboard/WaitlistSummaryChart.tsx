import type { WaitlistSummaryDTO } from "@/types";
import { ChartCard } from "./ChartCard";

interface Props {
	data?: WaitlistSummaryDTO;
	isLoading?: boolean;
	isError?: boolean;
	title: string;
	errorLabel: string;
	retryLabel: string;
	totalActiveLabel: string;
	emptyLabel: string;
	doctorCountLabel: string;
	onRetry?: () => void;
}

export function WaitlistSummaryChart({ data, isLoading, isError, title, errorLabel, retryLabel, totalActiveLabel, emptyLabel, doctorCountLabel, onRetry }: Props) {
	const byDoctor = data?.byDoctor ?? [];
	const maxCount = Math.max(...byDoctor.map((entry) => entry.count), 0);

	return (
		<ChartCard
			title={title}
			isLoading={isLoading}
			isError={isError}
			errorLabel={errorLabel}
			retryLabel={retryLabel}
			onRetry={onRetry}
			summary={data && byDoctor.length ? `${totalActiveLabel} ${data.totalActive}. ${byDoctor.map((entry) => `${entry.doctorName} ${entry.count}`).join(". ")}` : undefined}
		>
			{!byDoctor.length ? (
				<p className="text-sm text-muted-foreground">{emptyLabel}</p>
			) : (
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-4">
						<div className="flex flex-col gap-1">
							<p className="text-sm text-muted-foreground">{totalActiveLabel}</p>
							<p className="text-2xl font-semibold tabular-nums">{data?.totalActive ?? 0}</p>
						</div>
						<p className="text-sm text-muted-foreground">{doctorCountLabel}: {byDoctor.length}</p>
					</div>
					<ul className="flex flex-col gap-3">
						{byDoctor.map((entry) => {
							const width = maxCount > 0 ? `${Math.max((entry.count / maxCount) * 100, entry.count > 0 ? 8 : 0)}%` : "0%";

							return (
								<li key={entry.doctorId} className="flex flex-col gap-2 rounded-lg border border-border p-3">
									<div className="flex items-center justify-between gap-3">
										<span className="min-w-0 truncate text-sm font-medium">{entry.doctorName}</span>
										<span className="shrink-0 text-sm text-muted-foreground">{doctorCountLabel}: {entry.count}</span>
									</div>
									<div className="h-2 rounded-full bg-muted" aria-hidden="true">
										<div className="h-full rounded-full bg-primary" style={{ width }} />
									</div>
								</li>
							);
						})}
					</ul>
				</div>
			)}
		</ChartCard>
	);
}
