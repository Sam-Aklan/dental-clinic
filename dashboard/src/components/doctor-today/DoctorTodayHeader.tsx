import { useState } from "react";
import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";
import { CalendarDays, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ROUTE_DOCTOR_QUEUE } from "@/constants";
import { cn } from "@/lib/utils";

function parseSelectedDate(value: string) {
	if (!value) return undefined;
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatSelectedDate(value: string) {
	const date = parseSelectedDate(value);
	if (!date) return "";
	return new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}

function toDateValue(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface DoctorTodayHeaderProps {
	title: string;
	subtitle: string;
	selectedDateLabel: string;
	value: string;
	isToday: boolean;
	lastUpdatedAt: string | null;
	myQueueLabel: string;
	onDateChange: (date: string) => void;
	onRefresh: () => void;
}

export function DoctorTodayHeader({ title, subtitle, selectedDateLabel, value, isToday, lastUpdatedAt, myQueueLabel, onDateChange, onRefresh }: DoctorTodayHeaderProps) {
	const { t } = useTranslation();
	const [isDateOpen, setIsDateOpen] = useState(false);
	const formattedDate = formatSelectedDate(value);
	const selectedDate = parseSelectedDate(value);

	return (
		<Card>
			<CardContent className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
				<div className="grid gap-2">
					<div className="flex flex-wrap items-center gap-2">
						<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
						<Badge variant={isToday ? "default" : "secondary"}>{selectedDateLabel}</Badge>
					</div>
					<p className="text-sm text-muted-foreground">{subtitle}</p>
					{lastUpdatedAt ? <p className="text-xs text-muted-foreground">{dayjs(lastUpdatedAt).format("YYYY-MM-DD HH:mm")}</p> : null}
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
					<label className="grid gap-1 text-sm font-medium">
						<span className="inline-flex items-center gap-2 text-muted-foreground">
							<CalendarDays className="size-4" />
							<span>{t("doctorToday.header.date")}</span>
						</span>
						<Popover open={isDateOpen} onOpenChange={setIsDateOpen}>
							<PopoverTrigger asChild>
								<Button
									type="button"
									variant="outline"
									className={cn("w-full justify-between font-normal sm:min-w-56", !formattedDate && "text-muted-foreground")}
								>
									<span className="truncate">{formattedDate || t("doctorToday.header.date")}</span>
									<CalendarDays className="ms-2 size-4 shrink-0 text-muted-foreground" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={selectedDate}
									onSelect={(date) => {
										if (!date) return;
										onDateChange(toDateValue(date));
										setIsDateOpen(false);
									}}
								/>
							</PopoverContent>
						</Popover>
					</label>
					<Button type="button" variant="outline" onClick={onRefresh}>
						<RefreshCcw className="me-2 size-4" />
						{t("doctorToday.header.refresh")}
					</Button>
					<Button asChild type="button" variant="secondary">
						<Link to={ROUTE_DOCTOR_QUEUE}>{myQueueLabel}</Link>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
