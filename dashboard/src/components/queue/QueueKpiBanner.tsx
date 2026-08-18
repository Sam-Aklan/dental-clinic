import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TodaySummaryDTO } from "@/types";

interface QueueKpiBannerProps {
	summary?: TodaySummaryDTO | null;
	isLoading?: boolean;
	compact?: boolean;
	labels: {
		total: string;
		inProgress: string;
		waiting: string;
		completed: string;
		canceledToday: string;
		noShow: string;
		pendingConfirmation: string;
		compactWarning: string;
	};
}

export function QueueKpiBanner({ summary, isLoading, compact = false, labels }: QueueKpiBannerProps) {
	const cards = summary
		? [
			{ label: labels.total, value: summary.total },
			{ label: labels.inProgress, value: summary.inProgress },
			{ label: labels.waiting, value: summary.waiting },
			{ label: labels.completed, value: summary.completed },
			{ label: labels.canceledToday, value: summary.canceledToday },
			{ label: labels.noShow, value: summary.noShow },
			{ label: labels.pendingConfirmation, value: summary.pendingConfirmation },
		]
		: [];

	return (
		<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
			{isLoading
				? Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-lg" />)
				: cards.map((card) => (
					<Card key={card.label}>
						<CardHeader className="pb-2">
							<CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
						</CardHeader>
						<CardContent className="text-2xl font-semibold">{card.value}</CardContent>
					</Card>
				))}
			{compact && <p className="text-sm text-muted-foreground">{labels.compactWarning}</p>}
		</div>
	);
}
