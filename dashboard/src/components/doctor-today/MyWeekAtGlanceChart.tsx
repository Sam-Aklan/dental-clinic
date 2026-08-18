import { useMemo } from "react";
import dayjs from "dayjs";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { ChartCard } from "@/components/admin-dashboard/ChartCard";
import type { DoctorTodayTrendPointDTO } from "@/types";
import { useTranslation } from "react-i18next";

interface Props {
	data?: DoctorTodayTrendPointDTO[];
	isLoading?: boolean;
	isError?: boolean;
	title: string;
	description: string;
	errorLabel: string;
	retryLabel: string;
	onRetry?: () => void;
	onSelectDay: (date: string) => void;
	selectedDate: string;
	locale: "en" | "ar";
}

export function MyWeekAtGlanceChart({ data = [], isLoading, isError, title, description, errorLabel, retryLabel, onRetry, onSelectDay, selectedDate, locale }: Props) {
	const { t } = useTranslation();
	const weekdayFormatter = useMemo(() => new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", { weekday: locale === "ar" ? "short" : "short" }), [locale]);
	const chartData = useMemo(() => data.slice().sort((left, right) => dayjs(left.date).valueOf() - dayjs(right.date).valueOf()).map((item) => ({
		...item,
		label: `${weekdayFormatter.format(new Date(item.date))} ${dayjs(item.date).date()}`,
		statusLabel: item.dominantStatus ? t(`queue.status.${item.dominantStatus}`) : "-",
	})), [data, weekdayFormatter, t]);

	return (
		<ChartCard title={title} description={description} isLoading={isLoading} isError={isError} errorLabel={errorLabel} retryLabel={retryLabel} onRetry={onRetry} summary={chartData.map((item) => `${item.label} ${item.total}`)}>
			<div className="h-56">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={chartData}>
						<XAxis dataKey="label" tickLine={false} axisLine={false} />
						<YAxis allowDecimals={false} tickLine={false} axisLine={false} />
						<Tooltip />
						<Bar dataKey="total" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
					</BarChart>
				</ResponsiveContainer>
			</div>
			<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
				{chartData.map((item) => (
					<Button
						key={item.date}
						type="button"
						variant={item.date === selectedDate ? "default" : "outline"}
						className="h-auto justify-between gap-3 py-3"
						onClick={() => onSelectDay(item.date)}
					>
						<span className="text-start">
							<span className="block text-sm font-medium">{item.label}</span>
							{/* <span className="block text-xs opacity-80">{item.statusLabel}</span> */}
						</span>
						<span className="text-sm font-semibold">{item.total}</span>
					</Button>
				))}
			</div>
		</ChartCard>
	);
}
