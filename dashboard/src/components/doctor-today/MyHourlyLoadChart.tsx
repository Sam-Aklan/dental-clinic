import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/admin-dashboard/ChartCard";
import type { DoctorTodayHourlyLoadDTO } from "@/types";

interface Props {
	data?: DoctorTodayHourlyLoadDTO[];
	isLoading?: boolean;
	isError?: boolean;
	title: string;
	description: string;
	errorLabel: string;
	retryLabel: string;
	onRetry?: () => void;
}

export function MyHourlyLoadChart({ data = [], isLoading, isError, title, description, errorLabel, retryLabel, onRetry }: Props) {
	const chartData = useMemo(() => data.slice().sort((left, right) => left.hour - right.hour).map((item) => ({
		...item,
		hourLabel: `${String(item.hour).padStart(2, "0")}:00`,
	})), [data]);

	return (
		<ChartCard title={title} description={description} isLoading={isLoading} isError={isError} errorLabel={errorLabel} retryLabel={retryLabel} onRetry={onRetry} summary={chartData.map((item) => `${item.hourLabel} ${item.count} ${item.percentage}%`)}>
			<div className="h-64">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={chartData}>
						<XAxis dataKey="hourLabel" tickLine={false} axisLine={false} />
						<YAxis allowDecimals={false} tickLine={false} axisLine={false} />
						<Tooltip />
						<Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[8, 8, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</div>
		</ChartCard>
	);
}
