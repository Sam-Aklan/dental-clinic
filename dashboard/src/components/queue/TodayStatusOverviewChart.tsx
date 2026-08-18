import { Cell, Pie, PieChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { APPOINTMENT_STATUS_CHART_COLORS } from "@/constants/chart-status";
import type { AppointmentStatus, StaffQueueAppointmentDTO, TodaySummaryDTO } from "@/types";

interface TodayStatusOverviewChartProps {
	summary?: TodaySummaryDTO | null;
	appointments?: StaffQueueAppointmentDTO[];
	labels: {
		title: string;
		PENDING: string;
		CONFIRMED: string;
		IN_PROGRESS: string;
		COMPLETED: string;
		CANCELED: string;
		NO_SHOW: string;
	};
	onStatusClick?: (status: StaffQueueAppointmentDTO["status"]) => void;
}

export function TodayStatusOverviewChart({ summary, appointments = [], labels }: TodayStatusOverviewChartProps) {
	const counts: Array<{ status: AppointmentStatus; value: number }> = summary
		? [
			{ status: "IN_PROGRESS", value: summary.inProgress },
			{ status: "CONFIRMED", value: summary.waiting },
			{ status: "COMPLETED", value: summary.completed },
			{ status: "CANCELED", value: summary.canceledToday },
			{ status: "NO_SHOW", value: summary.noShow },
			{ status: "PENDING", value: summary.pendingConfirmation },
		]
		: [
			{ status: "CONFIRMED", value: appointments.filter((item) => item.status === "CONFIRMED").length },
			{ status: "IN_PROGRESS", value: appointments.filter((item) => item.status === "IN_PROGRESS").length },
			{ status: "COMPLETED", value: appointments.filter((item) => item.status === "COMPLETED").length },
			{ status: "CANCELED", value: appointments.filter((item) => item.status === "CANCELED").length },
			{ status: "NO_SHOW", value: appointments.filter((item) => item.status === "NO_SHOW").length },
		];

	const chartConfig = counts.reduce((config, item) => {
		config[item.status] = { label: labels[item.status], color: APPOINTMENT_STATUS_CHART_COLORS[item.status] };
		return config;
	}, {} as ChartConfig);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{labels.title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-72 w-full">
					<PieChart>
						<Pie data={counts} dataKey="value" nameKey="status" innerRadius={65} outerRadius={95} paddingAngle={2}>
							{counts.map((entry) => (
								<Cell key={entry.status} fill={APPOINTMENT_STATUS_CHART_COLORS[entry.status]} />
							))}
						</Pie>
						<ChartTooltip content={<ChartTooltipContent hideLabel nameKey="status" />} />
						<ChartLegend content={<ChartLegendContent nameKey="status" className="flex-wrap justify-center gap-3" />} />
					</PieChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
