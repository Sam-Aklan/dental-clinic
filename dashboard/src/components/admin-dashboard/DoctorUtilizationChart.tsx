import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import type { DoctorUtilizationDTO } from "@/types";
import { formatPercent } from "@/lib/admin-dashboard";
import { ChartCard } from "./ChartCard";

interface Props {
	data?: DoctorUtilizationDTO[];
	isLoading?: boolean;
	isError?: boolean;
	title: string;
	errorLabel: string;
	retryLabel: string;
	onRetry?: () => void;
	onDrillDown?: (doctorId: string) => void;
	locale: "en" | "ar";
}

export function DoctorUtilizationChart({ data = [], isLoading, isError, title, errorLabel, retryLabel, onRetry, onDrillDown, locale }: Props) {
	const sorted = [...data].sort((left, right) => right.utilizationPct - left.utilizationPct);
	return (
		<ChartCard title={title} isLoading={isLoading} isError={isError} errorLabel={errorLabel} retryLabel={retryLabel} onRetry={onRetry} summary={sorted.map((item) => `${item.doctorName} ${formatPercent(item.utilizationPct, locale)}`)}>
			<div className="h-56">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={sorted} layout="vertical">
						<XAxis type="number" />
						<YAxis type="category" dataKey="doctorName" width={120} />
						<Tooltip />
						<Bar dataKey="utilizationPct" fill="var(--primary)" />
					</BarChart>
				</ResponsiveContainer>
			</div>
			<div className="flex flex-wrap gap-2">
				{sorted.map((item) => (
					<Button key={item.doctorId} type="button" variant="outline" size="sm" onClick={() => onDrillDown?.(item.doctorId)}>
						{item.doctorName}
					</Button>
				))}
			</div>
		</ChartCard>
	);
}
