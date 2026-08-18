import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { adminDashboardFollowUpThresholdSchema, formatLocalizedDate } from "@/lib/admin-dashboard";
import type { AdminFollowUpsFilters, FollowUpRowDTO } from "@/types";

interface Props {
	data: FollowUpRowDTO[];
	filters: AdminFollowUpsFilters;
	total: number;
	locale: "en" | "ar";
	isLoading?: boolean;
	isError?: boolean;
	errorLabel: string;
	retryLabel: string;
	labels: {
		patient: string;
		lastAppointment: string;
		daysSince: string;
		upcoming: string;
		action: string;
		empty: string;
		threshold: string;
		updateThreshold: string;
		page: string;
		previous: string;
		next: string;
	};
	onPageChange: (page: number) => void;
	onThresholdChange: (thresholdDays: number) => void;
	onRetry?: () => void;
}

export function FollowUpsTable({ data, filters, total, locale, isLoading, isError, errorLabel, retryLabel, labels, onPageChange, onThresholdChange, onRetry }: Props) {
	const form = useForm<{ thresholdDays: number }>({
		resolver: zodResolver(adminDashboardFollowUpThresholdSchema) as never,
		defaultValues: { thresholdDays: filters.thresholdDays },
	});

	useEffect(() => {
		form.reset({ thresholdDays: filters.thresholdDays });
	}, [form, filters.thresholdDays]);

	const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));

	return (
		<div className="space-y-4">
		<form className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4" onSubmit={form.handleSubmit((values) => onThresholdChange(values.thresholdDays))}>
				<div className="grid gap-2">
					<Label htmlFor="thresholdDays">{labels.threshold}</Label>
					<Input id="thresholdDays" type="number" min={1} {...form.register("thresholdDays", { valueAsNumber: true })} />
				</div>
				<Button type="submit">{labels.updateThreshold}</Button>
			</form>

			<div className="rounded-lg border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{labels.patient}</TableHead>
							<TableHead>{labels.lastAppointment}</TableHead>
							<TableHead>{labels.daysSince}</TableHead>
							<TableHead>{labels.upcoming}</TableHead>
							<TableHead>{labels.action}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isError ? (
							<TableRow><TableCell colSpan={5} className="py-8 text-center text-destructive"><div className="space-y-2"><p>{errorLabel}</p>{onRetry ? <Button type="button" variant="outline" size="sm" onClick={onRetry}>{retryLabel}</Button> : null}</div></TableCell></TableRow>
						) : isLoading && data.length === 0 ? (
							<TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
						) : data.length === 0 ? (
							<TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">{labels.empty}</TableCell></TableRow>
						) : data.map((row) => (
							<TableRow key={row.patientId}>
								<TableCell>{row.patientName}</TableCell>
								<TableCell>{formatLocalizedDate(row.lastAppointmentDate, locale)}</TableCell>
								<TableCell>{row.daysSince}</TableCell>
								<TableCell>{row.hasUpcoming ? labels.upcoming : "-"}</TableCell>
								<TableCell><Button type="button" variant="ghost" size="sm">{labels.action}</Button></TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{pageCount > 1 ? (
				<Pagination aria-label={labels.page} className="justify-between">
					<PaginationContent className="w-full justify-between">
						<PaginationItem><PaginationPrevious href="#" text={labels.previous} onClick={(event) => { event.preventDefault(); onPageChange(Math.max(1, filters.page - 1)); }} aria-disabled={filters.page <= 1} /></PaginationItem>
						<PaginationItem><span className="text-sm text-muted-foreground">{filters.page} / {pageCount}</span></PaginationItem>
						<PaginationItem><PaginationNext href="#" text={labels.next} onClick={(event) => { event.preventDefault(); onPageChange(Math.min(pageCount, filters.page + 1)); }} aria-disabled={filters.page >= pageCount} /></PaginationItem>
					</PaginationContent>
				</Pagination>
			) : null}
		</div>
	);
}
