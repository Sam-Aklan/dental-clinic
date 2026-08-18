import dayjs from "dayjs";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppointmentNotesEditor } from "./AppointmentNotesEditor";
import { DoctorScheduleActions } from "./DoctorScheduleActions";
import { buildDoctorTodayScheduleRows, formatDoctorTodayDurationLabel, sortDoctorTodayAppointments, toClinicTime } from "@/lib/doctor-today";
import type { DoctorTodayAppointmentStatus, DoctorTodayScheduleAppointmentDTO, DoctorTodaySortDir, DoctorTodaySortField } from "@/types";
import { useTranslation } from "react-i18next";

interface Props {
	view: "today" | "thisWeek";
	appointments: DoctorTodayScheduleAppointmentDTO[];
	page: number;
	total: number;
	pageSize: number;
	isLoading?: boolean;
	isError?: boolean;
	errorLabel: string;
	retryLabel: string;
	onRetry?: () => void;
	onPageChange: (page: number) => void;
	onSortChange: (sortBy: DoctorTodaySortField, sortDir: DoctorTodaySortDir) => void;
	onStatusChange: (status: DoctorTodayAppointmentStatus[]) => void;
	onUpdateStatus: (payload: { id: string; status: DoctorTodayAppointmentStatus }) => Promise<unknown>;
	onSaveNotes: (payload: { id: string; notes: string }) => Promise<unknown>;
	pendingStatusId: string | null;
	pendingNotesId: string | null;
	selectedDate: string;
	selectedStatus: DoctorTodayAppointmentStatus[];
	sortBy: DoctorTodaySortField;
	sortDir: DoctorTodaySortDir;
}

const STATUS_VALUES: DoctorTodayAppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELED", "NO_SHOW"];

function getSortLabel(sortBy: DoctorTodaySortField) {
	return sortBy === "startsAt" ? "doctorToday.table.sort.startsAt" : sortBy === "status" ? "doctorToday.table.sort.status" : "doctorToday.table.sort.date";
}

function getPatientDisplayName(appointment: DoctorTodayScheduleAppointmentDTO) {
	return appointment.patientName?.trim() || appointment.patient?.fullName?.trim() || [appointment.patient?.firstName, appointment.patient?.lastName].filter(Boolean).join(" ").trim();
}

export function DoctorScheduleTable({ view, appointments, page, total, pageSize, isLoading, isError, errorLabel, retryLabel, onRetry, onPageChange, onSortChange, onStatusChange, onUpdateStatus, onSaveNotes, pendingStatusId, pendingNotesId, selectedDate, selectedStatus, sortBy, sortDir }: Props) {
	const { t } = useTranslation();
	const pageCount = Math.max(1, Math.ceil(total / pageSize));
	const desktopRows = useMemo(() => (view === "today" ? buildDoctorTodayScheduleRows(appointments) : sortDoctorTodayAppointments(appointments).map((appointment) => ({ kind: "appointment" as const, data: appointment }))), [appointments, view]);
	const hasOtherInProgress = appointments.some((appointment) => appointment.status === "IN_PROGRESS");

	const toggleSort = (nextSort: DoctorTodaySortField) => {
		if (nextSort === sortBy) {
			onSortChange(nextSort, sortDir === "asc" ? "desc" : "asc");
			return;
		}
		onSortChange(nextSort, "asc");
	};

	const toggleStatus = (status: DoctorTodayAppointmentStatus) => {
		if (selectedStatus.includes(status)) {
			onStatusChange(selectedStatus.filter((value) => value !== status));
			return;
		}
		onStatusChange([...selectedStatus, status]);
	};

	if (isError) {
		return <Alert variant="destructive"><AlertTitle>{errorLabel}</AlertTitle><AlertDescription><Button type="button" variant="outline" size="sm" onClick={onRetry}>{retryLabel}</Button></AlertDescription></Alert>;
	}

	if (isLoading && appointments.length === 0) {
		return <div className="grid gap-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 w-full rounded-lg" />)}</div>;
	}

	if (appointments.length === 0) {
		return <Alert><AlertTitle>{t("doctorToday.table.empty.title")}</AlertTitle><AlertDescription>{t("doctorToday.table.empty.description")}</AlertDescription></Alert>;
	}

	return (
		<div className="grid gap-4">
			{view === "thisWeek" ? (
				<div className="grid gap-3 rounded-lg border bg-card p-4">
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm font-medium text-muted-foreground">{t("doctorToday.filters.status")}</span>
						<Button type="button" variant={selectedStatus.length === 0 ? "default" : "outline"} size="sm" onClick={() => onStatusChange([])}>{t("doctorToday.filters.all")}</Button>
						{STATUS_VALUES.map((status) => (
							<Button key={status} type="button" variant={selectedStatus.includes(status) ? "default" : "outline"} size="sm" onClick={() => toggleStatus(status)}>{t(`queue.status.${status}`)}</Button>
						))}
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<span className="text-sm font-medium text-muted-foreground">{t("doctorToday.filters.sort")}</span>
						{(["startsAt", "status", "date"] as DoctorTodaySortField[]).map((field) => (
							<Button key={field} type="button" variant={sortBy === field ? "default" : "outline"} size="sm" onClick={() => toggleSort(field)}>
								{t(getSortLabel(field))} {sortBy === field ? (sortDir === "asc" ? "↑" : "↓") : ""}
							</Button>
						))}
					</div>
				</div>
			) : null}

			<div className="md:hidden grid gap-4">
				{desktopRows.map((row,index) => row.kind === "gap" ? (
					<div key={`gap-${row.durationMinutes}`+index} className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">{t("doctorToday.table.gap", { minutes: row.durationMinutes })}</div>
				) : (
					<Card key={row.data.id} className={row.data.status === "IN_PROGRESS" ? "border-l-4 border-l-primary" : ""}>
						<CardHeader className="space-y-2 pb-2">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div>
									<CardTitle className="text-base">{getPatientDisplayName(row.data) || t("doctorToday.table.patient")}</CardTitle>
									<p className="text-sm text-muted-foreground">{t("doctorToday.table.patientSequence", { sequence: row.data.patientSequence })}</p>
								</div>
								{row.data.status === "IN_PROGRESS" ? <Badge>{t("doctorToday.table.inSession")}</Badge> : null}
							</div>
							<p className="text-sm text-muted-foreground">{selectedDate}</p>
						</CardHeader>
						<CardContent className="grid gap-4">
							<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
								<span>{toClinicTime(row.data.startsAt)}</span>
								<span>{formatDoctorTodayDurationLabel(row.data.startsAt, row.data.endsAt)}</span>
								<span>{t(`queue.status.${row.data.status}`)}</span>
							</div>
							<AppointmentNotesEditor appointmentId={row.data.id} patientSequence={row.data.patientSequence} initialNotes={row.data.notes} onSave={onSaveNotes} isPending={pendingNotesId === row.data.id} />
							<DoctorScheduleActions appointment={row.data} hasOtherInProgress={hasOtherInProgress && row.data.status !== "IN_PROGRESS"} isPending={pendingStatusId === row.data.id} onUpdateStatus={onUpdateStatus} />
						</CardContent>
					</Card>
				))}
			</div>

			<div className="hidden md:block rounded-lg border bg-card">
				<Table>
					<TableHeader>
						<TableRow>
							{view === "thisWeek" ? <TableHead>{t("doctorToday.table.date")}</TableHead> : null}
							<TableHead>{t("doctorToday.table.time")}</TableHead>
							<TableHead>{t("doctorToday.table.patient")}</TableHead>
							<TableHead>{t("doctorToday.table.status")}</TableHead>
							<TableHead>{t("doctorToday.table.duration")}</TableHead>
							<TableHead>{t("doctorToday.table.notes")}</TableHead>
							<TableHead>{t("doctorToday.table.actions")}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{desktopRows.map((row,index) => row.kind === "gap" ? (
							<TableRow key={`gap-${row.durationMinutes}`+index}>
								<TableCell colSpan={view === "thisWeek" ? 7 : 6} className="bg-muted/30 py-4 text-center text-sm text-muted-foreground">{t("doctorToday.table.gap", { minutes: row.durationMinutes })}</TableCell>
							</TableRow>
						) : (
							<TableRow key={row.data.id} className={row.data.status === "IN_PROGRESS" ? "border-l-4 border-l-primary bg-primary/5" : ""}>
								{view === "thisWeek" ? <TableCell className="whitespace-nowrap">{dayjs(row.data.startsAt).format("YYYY-MM-DD")}</TableCell> : null}
								<TableCell className="whitespace-nowrap">{toClinicTime(row.data.startsAt)}</TableCell>
								<TableCell>
									<div>
										<p className="font-medium text-foreground">{getPatientDisplayName(row.data) || t("doctorToday.table.patient")}</p>
										<p className="text-sm text-muted-foreground">{t("doctorToday.table.patientSequence", { sequence: row.data.patientSequence })}</p>
									</div>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										{row.data.status === "IN_PROGRESS" ? <Badge>{t("doctorToday.table.inSession")}</Badge> : null}
										<span>{t(`queue.status.${row.data.status}`)}</span>
									</div>
								</TableCell>
								<TableCell>{formatDoctorTodayDurationLabel(row.data.startsAt, row.data.endsAt)}</TableCell>
								<TableCell className="min-w-[18rem]"><AppointmentNotesEditor appointmentId={row.data.id} patientSequence={row.data.patientSequence} initialNotes={row.data.notes} onSave={onSaveNotes} isPending={pendingNotesId === row.data.id} /></TableCell>
								<TableCell className="min-w-[16rem]"><DoctorScheduleActions appointment={row.data} hasOtherInProgress={hasOtherInProgress && row.data.status !== "IN_PROGRESS"} isPending={pendingStatusId === row.data.id} onUpdateStatus={onUpdateStatus} /></TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{pageCount > 1 ? (
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious href="#" text={t("doctorToday.pagination.previous")} aria-disabled={page <= 1} onClick={(event) => { event.preventDefault(); onPageChange(Math.max(1, page - 1)); }} />
						</PaginationItem>
						<PaginationItem>
							<span className="text-sm text-muted-foreground">{t("doctorToday.pagination.page", { page, totalPages: pageCount })}</span>
						</PaginationItem>
						<PaginationItem>
							<PaginationNext href="#" text={t("doctorToday.pagination.next")} aria-disabled={page >= pageCount} onClick={(event) => { event.preventDefault(); onPageChange(Math.min(pageCount, page + 1)); }} />
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			) : null}
		</div>
	);
}
