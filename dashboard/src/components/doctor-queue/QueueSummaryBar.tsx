import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DoctorQueueSummary } from "@/types";
import { useTranslation } from "react-i18next";

interface QueueSummaryBarProps {
	summary: DoctorQueueSummary;
}

export function QueueSummaryBar({ summary }: QueueSummaryBarProps) {
	const { t } = useTranslation();
	const items = [
		{ label: t("queue.summary.inSession"), value: summary.inSession },
		{ label: t("queue.summary.waiting"), value: summary.waiting },
		{ label: t("queue.summary.upcoming"), value: summary.upcoming },
		{ label: t("queue.summary.completed"), value: summary.completed },
		{ label: t("queue.summary.noShow"), value: summary.noShow },
	];

	return (
		<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
			{items.map((item) => (
				<Card key={item.label}>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-semibold">{item.value}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
