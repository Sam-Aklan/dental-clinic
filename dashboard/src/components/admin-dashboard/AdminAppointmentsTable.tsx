import { ArrowDownAZ, ArrowUpZA, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCancelAdminAppointmentMutation } from "@/hooks/admin-dashboard";
import { ExportCsvButton } from "./ExportCsvButton";
import { formatAppointmentDateTime, formatDoctorName, formatPatientName } from "@/lib/admin-dashboard";
import type { AdminAppointmentRowDTO, AdminAppointmentsFilters } from "@/types";

interface Props {
	data: AdminAppointmentRowDTO[];
	filters: AdminAppointmentsFilters;
	total: number;
	isLoading?: boolean;
	isError?: boolean;
	errorLabel: string;
	retryLabel: string;
	labels: {
		from: string;
		to: string;
		doctor: string;
		patient: string;
		status: string;
		bookedAt: string;
		action: string;
		cancel: string;
		canceling: string;
		noActions: string;
		empty: string;
		export: string;
		exporting: string;
		page: string;
		previous: string;
		next: string;
	};
	onPageChange: (page: number) => void;
	onSortChange: (sortBy: AdminAppointmentsFilters["sortBy"], sortDir: AdminAppointmentsFilters["sortDir"]) => void;
	onRetry?: () => void;
}

function SortButton({ active, direction, label, onClick }: { active: boolean; direction: AdminAppointmentsFilters["sortDir"]; label: string; onClick: () => void }) {
	return (
		<Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={onClick}>
			{label}
			{active ? direction === "asc" ? <ArrowUpZA className="ml-2 size-4" /> : <ArrowDownAZ className="ml-2 size-4" /> : null}
		</Button>
	);
}

function isCancelableAppointment(status: AdminAppointmentRowDTO["status"]) {
	return status === "PENDING" || status === "CONFIRMED";
}

function getStatusVariant(status: AdminAppointmentRowDTO["status"]): "default" | "secondary" | "destructive" | "outline" {
	switch (status) {
		case "COMPLETED":
			return "default";
		case "CONFIRMED":
			return "secondary";
		case "CANCELED":
		case "NO_SHOW":
			return "destructive";
		case "PENDING":
		case "IN_PROGRESS":
		default:
			return "outline";
	}
}

export function AdminAppointmentsTable({ data, filters, total, isLoading, isError, errorLabel, retryLabel, labels, onPageChange, onSortChange, onRetry }: Props) {
	const pageCount = Math.max(1, Math.ceil(total / filters.pageSize));
	const cancelMutation = useCancelAdminAppointmentMutation();
	const { t,i18n } = useTranslation();

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h3 className="text-base font-semibold">{labels.page}</h3>
				<ExportCsvButton filters={filters} labels={{ export: labels.export, exporting: labels.exporting }} />
			</div>
			<div className="rounded-lg border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead><SortButton active={filters.sortBy === "startsAt"} direction={filters.sortDir} label={labels.from} onClick={() => onSortChange("startsAt", filters.sortBy === "startsAt" && filters.sortDir === "asc" ? "desc" : "asc")} /></TableHead>
							<TableHead><SortButton active={filters.sortBy === "doctorName"} direction={filters.sortDir} label={labels.doctor} onClick={() => onSortChange("doctorName", filters.sortBy === "doctorName" && filters.sortDir === "asc" ? "desc" : "asc")} /></TableHead>
							<TableHead>{labels.patient}</TableHead>
							<TableHead><SortButton active={filters.sortBy === "status"} direction={filters.sortDir} label={labels.status} onClick={() => onSortChange("status", filters.sortBy === "status" && filters.sortDir === "asc" ? "desc" : "asc")} /></TableHead>
							<TableHead><SortButton active={filters.sortBy === "createdAt"} direction={filters.sortDir} label={labels.bookedAt} onClick={() => onSortChange("createdAt", filters.sortBy === "createdAt" && filters.sortDir === "asc" ? "desc" : "asc")} /></TableHead>
							<TableHead>{labels.action}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isError ? (
							<TableRow>
								<TableCell colSpan={6} className="py-8 text-center text-destructive">
									<div className="space-y-2">
										<p>{errorLabel}</p>
										{onRetry ? <Button type="button" variant="outline" size="sm" onClick={onRetry}>{retryLabel}</Button> : null}
									</div>
								</TableCell>
							</TableRow>
						) : isLoading && data.length === 0 ? (
							<TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Loading...</TableCell></TableRow>
						) : data.length === 0 ? (
							<TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">{labels.empty}</TableCell></TableRow>
						) : data.map((row) => (
							<TableRow key={row.id}>
								<TableCell>{formatAppointmentDateTime(row.startsAt)}</TableCell>
								<TableCell>{formatDoctorName(row.doctor)}</TableCell>
								<TableCell>{formatPatientName(row.patient)}</TableCell>
								<TableCell>
									<Badge variant={getStatusVariant(row.status)}>{t(`adminDashboard.status.${row.status}`)}</Badge>
								</TableCell>
								<TableCell>{formatAppointmentDateTime(row.createdAt)}</TableCell>
								<TableCell>
									{isCancelableAppointment(row.status) ? (
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button type="button" variant="ghost" size="sm" disabled={cancelMutation.isPending}>
													<Calendar className="mr-2 size-4" />
													{labels.action}
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													variant="destructive"
													disabled={cancelMutation.isPending}
													onClick={() => cancelMutation.mutate(row.id)}
												>
													{cancelMutation.isPending && cancelMutation.variables === row.id ? labels.canceling : labels.cancel}
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									) : (
										<Button type="button" variant="ghost" size="sm" disabled>
											<Calendar className="mr-2 size-4" />
											{labels.noActions}
										</Button>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{pageCount > 1 ? (
				<Pagination aria-label={labels.page} className="justify-between">
					<PaginationContent className="w-full justify-between">
						<PaginationItem>
							<PaginationPrevious href="#" text={labels.previous} onClick={(event) => { event.preventDefault(); onPageChange(Math.max(1, filters.page - 1)); }} aria-disabled={filters.page <= 1} isRtl={i18n.language ==='ar'?true:false} />
						</PaginationItem>
						<PaginationItem>
							<span className="text-sm text-muted-foreground">{filters.page} / {pageCount}</span>
						</PaginationItem>
						<PaginationItem>
							<PaginationNext href="#" text={labels.next} onClick={(event) => { event.preventDefault(); onPageChange(Math.min(pageCount, filters.page + 1)); }} aria-disabled={filters.page >= pageCount} isRtl={i18n.language ==='ar'?true:false} />
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			) : null}
		</div>
	);
}
