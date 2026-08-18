import { Line, LineChart, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { APPOINTMENT_TREND_CHART_COLORS } from "@/constants/chart-status";
import type { AppointmentTrendPointDTO } from "@/types";
import { formatLocalizedDate } from "@/lib/admin-dashboard";
import { ChartCard } from "./ChartCard";

interface Props {
	data?: AppointmentTrendPointDTO[];
	isLoading?: boolean;
	isError?: boolean;
	title: string;
	errorLabel: string;
	retryLabel: string;
	onRetry?: () => void;
	onDrillDown?: (point: AppointmentTrendPointDTO) => void;
	locale: "en" | "ar";
	labels: { confirmed: string; completed: string; canceled: string; noShow: string };
}

export function AppointmentTrendsChart({ data = [], isLoading, isError, title, errorLabel, retryLabel, onRetry, onDrillDown, locale, labels }: Props) {
	const chartConfig = {
		confirmed: { label: labels.confirmed, color: APPOINTMENT_TREND_CHART_COLORS.confirmed },
		completed: { label: labels.completed, color: APPOINTMENT_TREND_CHART_COLORS.completed },
		canceled: { label: labels.canceled, color: APPOINTMENT_TREND_CHART_COLORS.canceled },
		noShow: { label: labels.noShow, color: APPOINTMENT_TREND_CHART_COLORS.noShow },
	} satisfies ChartConfig;

	return (
		<ChartCard title={title} isLoading={isLoading} isError={isError} errorLabel={errorLabel} retryLabel={retryLabel} onRetry={onRetry} summary={data.map((point) => `${formatLocalizedDate(point.date, locale)} ${point.total}`)}>
			<ChartContainer config={chartConfig} className="h-56 w-full">
					<LineChart data={data}>
						<XAxis dataKey="date" tickFormatter={(value) => formatLocalizedDate(String(value), locale)} />
						<YAxis />
						<ChartTooltip content={<ChartTooltipContent />} />
						<ChartLegend content={<ChartLegendContent className="flex-wrap justify-center gap-3" />} />
						<Line type="monotone" dataKey="confirmed" stroke="var(--color-confirmed)" strokeWidth={2} dot={false} />
						<Line type="monotone" dataKey="completed" stroke="var(--color-completed)" strokeWidth={2} dot={false} />
						<Line type="monotone" dataKey="canceled" stroke="var(--color-canceled)" strokeWidth={2} dot={false} />
						<Line type="monotone" dataKey="noShow" stroke="var(--color-noShow)" strokeWidth={2} dot={false} />
					</LineChart>
			</ChartContainer>
			<div className="flex flex-wrap gap-2">
				{data.map((point) => (
					<Button key={point.date} type="button" variant="outline" size="sm" onClick={() => onDrillDown?.(point)}>
						{formatLocalizedDate(point.date, locale)}
					</Button>
				))}
			</div>
		</ChartCard>
	);
}
