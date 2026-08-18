import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import type { DoctorTodayStatsDTO } from "@/types";

interface DoctorKpiCardsProps {
	data?: DoctorTodayStatsDTO;
	isLoading?: boolean;
	isError?: boolean;
	errorLabel: string;
	retryLabel: string;
	labels: {
		total: string;
		completed: string;
		remaining: string;
		inSession: string;
		noShows: string;
		selectedDate: string;
	};
	onRetry?: () => void;
}

const METRICS = [
	{ key: "todayTotal" as const, labelKey: "total" as const },
	{ key: "completed" as const, labelKey: "completed" as const },
	{ key: "remaining" as const, labelKey: "remaining" as const },
	{ key: "inSession" as const, labelKey: "inSession" as const },
	{ key: "noShows" as const, labelKey: "noShows" as const },
];

export function DoctorKpiCards({ data, isLoading, isError, errorLabel, retryLabel, labels, onRetry }: DoctorKpiCardsProps) {
	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertTitle>{errorLabel}</AlertTitle>
				<AlertDescription className="flex flex-wrap items-center gap-3">
					<span>{labels.selectedDate}</span>
					<Button type="button" variant="outline" size="sm" onClick={onRetry}>{retryLabel}</Button>
				</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
			{METRICS.map((metric) => (
				<Card key={metric.key}>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">{labels[metric.labelKey]}</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-semibold tracking-tight">{String(data?.[metric.key] ?? 0)}</div>}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
