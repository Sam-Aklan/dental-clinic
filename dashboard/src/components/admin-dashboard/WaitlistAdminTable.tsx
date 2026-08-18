import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatAvailabilityWindow, formatLocalizedDate, formatDoctorName, formatPatientName } from "@/lib/admin-dashboard";
import type { AdminWaitlistFilters, WaitlistAdminRowDTO } from "@/types";

interface Props {
	data: WaitlistAdminRowDTO[];
	filters: AdminWaitlistFilters;
	total: number;
	locale: "en" | "ar";
	isLoading?: boolean;
	isError?: boolean;
	errorLabel: string;
	retryLabel: string;
	labels: {
		position: string;
		patient: string;
		doctor: string;
		availabilityWindow: string;
		joined: string;
		action: string;
		empty: string;
		page: string;
		previous: string;
		next: string;
	};
	onPageChange: (page: number) => void;
	onRetry?: () => void;
}

export function WaitlistAdminTable({ data, filters, total, locale, isLoading, isError, errorLabel, retryLabel, labels, onPageChange, onRetry }: Props) {
	const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));

	return (
		<div className="space-y-4">
			<div className="rounded-lg border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{labels.position}</TableHead>
							<TableHead>{labels.patient}</TableHead>
							<TableHead>{labels.doctor}</TableHead>
							<TableHead>{labels.availabilityWindow}</TableHead>
							<TableHead>{labels.joined}</TableHead>
							<TableHead>{labels.action}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isError ? (
							<TableRow><TableCell colSpan={6} className="py-8 text-center text-destructive"><div className="space-y-2"><p>{errorLabel}</p>{onRetry ? <Button type="button" variant="outline" size="sm" onClick={onRetry}>{retryLabel}</Button> : null}</div></TableCell></TableRow>
						) : isLoading && data.length === 0 ? (
							<TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
						) : data.length === 0 ? (
							<TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">{labels.empty}</TableCell></TableRow>
						) : data.map((row) => (
							<TableRow key={row.id}>
								<TableCell>{row.position}</TableCell>
								<TableCell>{formatPatientName(row.patient, locale)}</TableCell>
								<TableCell>{formatDoctorName(row.doctor, locale)}</TableCell>
								<TableCell>{formatAvailabilityWindow(row.availableFrom, row.availableUntil, locale)}</TableCell>
								<TableCell>{formatLocalizedDate(row.createdAt, locale)}</TableCell>
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
