import { Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { CANCELLATION_TREND_CHART_COLORS } from "@/constants/chart-status";
import type { CancellationTrendPointDTO } from "@/types";
import { formatLocalizedDate } from "@/lib/admin-dashboard";
import { ChartCard } from "./ChartCard";

interface Props {
	data?: CancellationTrendPointDTO[];
	isLoading?: boolean;
	isError?: boolean;
	title: string;
	errorLabel: string;
	retryLabel: string;
	onRetry?: () => void;
	locale: "en" | "ar";
	labels: { canceledByPatient: string; canceledByStaff: string; noShow: string };
}

export function CancellationTrendChart({ data = [], isLoading, isError, title, errorLabel, retryLabel, onRetry, locale, labels }: Props) {
	const chartConfig = {
		canceledByPatient: { label: labels.canceledByPatient, color: CANCELLATION_TREND_CHART_COLORS.canceledByPatient },
		canceledByStaff: { label: labels.canceledByStaff, color: CANCELLATION_TREND_CHART_COLORS.canceledByStaff },
		noShow: { label: labels.noShow, color: CANCELLATION_TREND_CHART_COLORS.noShow },
	} satisfies ChartConfig;

	return (
		<ChartCard title={title} isLoading={isLoading} isError={isError} errorLabel={errorLabel} retryLabel={retryLabel} onRetry={onRetry} summary={data.map((point) => `${formatLocalizedDate(point.date, locale)} ${point.noShow}`)}>
			<ChartContainer config={chartConfig} className="h-56 w-full">
					<LineChart data={data}>
						<XAxis dataKey="date" tickFormatter={(value) => formatLocalizedDate(String(value), locale)} />
						<YAxis />
						<ChartTooltip content={<ChartTooltipContent />} />
						<ChartLegend content={<ChartLegendContent className="flex-wrap justify-center gap-3" />} />
						<Line type="monotone" dataKey="canceledByPatient" stroke="var(--color-canceledByPatient)" strokeWidth={2} dot={false} />
						<Line type="monotone" dataKey="canceledByStaff" stroke="var(--color-canceledByStaff)" strokeWidth={2} dot={false} />
						<Line type="monotone" dataKey="noShow" stroke="var(--color-noShow)" strokeWidth={2} dot={false} />
					</LineChart>
			</ChartContainer>
		</ChartCard>
	);
}
