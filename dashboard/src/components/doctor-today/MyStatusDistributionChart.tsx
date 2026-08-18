import { useMemo } from "react";
import { Cell, Pie, PieChart } from "recharts";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ChartCard } from "@/components/admin-dashboard/ChartCard";
import { APPOINTMENT_STATUS_CHART_COLORS } from "@/constants/chart-status";
import type { DoctorTodayStatusDistributionDTO } from "@/types";
import { useTranslation } from "react-i18next";

interface Props {
	data?: DoctorTodayStatusDistributionDTO[];
	isLoading?: boolean;
	isError?: boolean;
	title: string;
	description: string;
	errorLabel: string;
	retryLabel: string;
	onRetry?: () => void;
	onStatusSelect: (status: DoctorTodayStatusDistributionDTO["status"]) => void;
	selectedStatus: DoctorTodayStatusDistributionDTO["status"][];
}
export function MyStatusDistributionChart({ data = [], isLoading, isError, title, description, errorLabel, retryLabel, onRetry, onStatusSelect, selectedStatus }: Props) {
	const { t } = useTranslation();
	const chartData = useMemo(() => {
		if (!Array.isArray(data)) {
			return [];
		}

		return data.slice().sort((left, right) => right.count - left.count);
	}, [data]);
	const chartConfig = chartData.reduce((config, item) => {
		config[item.status] = { label: t(`queue.status.${item.status}`), color: APPOINTMENT_STATUS_CHART_COLORS[item.status] };
		return config;
	}, {} as ChartConfig);
	const hasChartData = chartData.length > 0;

	return (
		<ChartCard title={title} description={description} isLoading={isLoading} isError={isError} errorLabel={errorLabel} retryLabel={retryLabel} onRetry={onRetry} summary={chartData.map((item) => `${t(`queue.status.${item.status}`)} ${item.count}`)}>
			{hasChartData ? (
				<>
					<ChartContainer config={chartConfig} className="h-56 w-full">
							<PieChart>
								<Pie data={chartData} dataKey="count" nameKey="status" innerRadius={55} outerRadius={90}>
									{chartData.map((entry) => <Cell key={entry.status} fill={APPOINTMENT_STATUS_CHART_COLORS[entry.status]} />)}
								</Pie>
								<ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" />} />
								<ChartLegend content={<ChartLegendContent nameKey="status" className="flex-wrap justify-center gap-3" />} />
							</PieChart>
					</ChartContainer>
					<div className="flex flex-wrap gap-2">
						{chartData.map((item) => {
							const isActive = selectedStatus.length === 1 && selectedStatus[0] === item.status;
							return (
								<Button key={item.status} type="button" variant={isActive ? "default" : "outline"} size="sm" onClick={() => onStatusSelect(item.status)}>
									{t(`queue.status.${item.status}`)}: {item.count}
								</Button>
							);
						})}
					</div>
				</>
			) : (
				<Empty className="min-h-56 border border-dashed border-border bg-muted/20 p-6">
					<EmptyHeader>
						<EmptyTitle>{t("doctorToday.table.empty.title")}</EmptyTitle>
						<EmptyDescription>{t("doctorToday.table.empty.description")}</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
		</ChartCard>
	);
}
