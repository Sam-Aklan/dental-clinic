import { Cell, Pie, PieChart } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { APPOINTMENT_STATUS_CHART_COLORS } from "@/constants/chart-status";
import type { StatusDistributionDTO } from "@/types";
import { ChartCard } from "./ChartCard";

interface Props {
	data?: StatusDistributionDTO;
	isLoading?: boolean;
	isError?: boolean;
	title: string;
	errorLabel: string;
	retryLabel: string;
	onRetry?: () => void;
	onDrillDown?: (status: string) => void;
	labels: Record<string, string>;
}

export function StatusDistributionChart({ data, isLoading, isError, title, errorLabel, retryLabel, onRetry, onDrillDown, labels }: Props) {
	const chartData = data
		? Object.entries(data).map(([status, value]) => ({ status, value }))
		: [];
	const chartConfig = chartData.reduce((config, item) => {
		config[item.status] = { label: labels[item.status] ?? item.status, color: APPOINTMENT_STATUS_CHART_COLORS[item.status as keyof typeof APPOINTMENT_STATUS_CHART_COLORS] };
		return config;
	}, {} as ChartConfig);

	return (
		<ChartCard title={title} isLoading={isLoading} isError={isError} errorLabel={errorLabel} retryLabel={retryLabel} onRetry={onRetry} summary={chartData.map((item) => `${labels[item.status] ?? item.status} ${item.value}`)}>
			<ChartContainer config={chartConfig} className="h-56 w-full">
					<PieChart>
						<Pie data={chartData} dataKey="value" nameKey="status" outerRadius={90} innerRadius={55}>
							{chartData.map((item) => (
								<Cell key={item.status} fill={APPOINTMENT_STATUS_CHART_COLORS[item.status as keyof typeof APPOINTMENT_STATUS_CHART_COLORS]} />
							))}
						</Pie>
						<ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" />} />
						<ChartLegend content={<ChartLegendContent nameKey="status" className="flex-wrap justify-center gap-3" />} />
					</PieChart>
			</ChartContainer>
			<div className="flex flex-wrap gap-2">
				{chartData.map((item) => (
					<Button key={item.status} type="button" variant="outline" size="sm" onClick={() => onDrillDown?.(item.status)}>
						{labels[item.status] ?? item.status}
					</Button>
				))}
			</div>
		</ChartCard>
	);
}
