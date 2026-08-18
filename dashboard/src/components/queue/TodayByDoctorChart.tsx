import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { TodayByDoctorDTO } from "@/types";

interface TodayByDoctorChartProps {
	data: TodayByDoctorDTO[];
	labels: { title: string; confirmed: string; inProgress: string; completed: string; canceled: string };
	onDoctorClick?: (doctorId: string) => void;
}

const chartConfig = {
	confirmed: { label: "Confirmed", color: "hsl(var(--chart-1))" },
	inProgress: { label: "In progress", color: "hsl(var(--chart-2))" },
	completed: { label: "Completed", color: "hsl(var(--chart-3))" },
	canceled: { label: "Canceled", color: "hsl(var(--chart-4))" },
} satisfies ChartConfig;

export function TodayByDoctorChart({ data, labels, onDoctorClick }: TodayByDoctorChartProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{labels.title}</CardTitle>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="h-72 w-full">
					<BarChart data={data} onClick={(event) => {
						const payload = (event as { activePayload?: Array<{ payload?: TodayByDoctorDTO }> }).activePayload?.[0]?.payload;
						if (payload && onDoctorClick) onDoctorClick(payload.doctorId);
					}}>
						<CartesianGrid vertical={false} />
						<XAxis dataKey="doctorName" tickLine={false} axisLine={false} />
						<YAxis allowDecimals={false} />
						<ChartTooltip content={<ChartTooltipContent />} />
						<Bar dataKey="confirmed" fill="var(--color-confirmed)" radius={4} />
						<Bar dataKey="inProgress" fill="var(--color-inProgress)" radius={4} />
						<Bar dataKey="completed" fill="var(--color-completed)" radius={4} />
						<Bar dataKey="canceled" fill="var(--color-canceled)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
