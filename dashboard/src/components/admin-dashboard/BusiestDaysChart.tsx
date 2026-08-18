import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WeekdayAppointmentDTO } from "@/types";
import { ChartCard } from "./ChartCard";

interface Props {
	data?: WeekdayAppointmentDTO[];
	isLoading?: boolean;
	isError?: boolean;
	title: string;
	errorLabel: string;
	retryLabel: string;
	onRetry?: () => void;
}

export function BusiestDaysChart({ data = [], isLoading, isError, title, errorLabel, retryLabel, onRetry }: Props) {
	return (
		<ChartCard title={title} isLoading={isLoading} isError={isError} errorLabel={errorLabel} retryLabel={retryLabel} onRetry={onRetry} summary={data.map((item) => `${item.label} ${item.count}`)}>
			<div className="h-56">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data}>
						<XAxis dataKey="label" />
						<YAxis />
						<Tooltip />
						<Bar dataKey="count" fill="var(--primary)" />
					</BarChart>
				</ResponsiveContainer>
			</div>
		</ChartCard>
	);
}
