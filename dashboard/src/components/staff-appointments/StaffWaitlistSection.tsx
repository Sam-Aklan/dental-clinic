import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircleIcon, ChevronLeftIcon, ChevronRightIcon, LoaderCircleIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useDoctorsQuery } from "@/hooks/booking";
import { useRemoveWaitlistEntryMutation, useStaffWaitlistQuery } from "@/hooks/staff-appointments";
import { formatWaitlistDoctor, formatWaitlistPatient } from "@/lib/staff-appointments";
import type { StaffWaitlistEntryDTO } from "@/types";

const PAGE_SIZE = 10;
const ALL_DOCTORS_VALUE = "__all__";

interface StaffWaitlistSectionProps {
	locale: "en" | "ar";
}

function formatJoinedDate(locale: "en" | "ar", createdAt: string) {
	return new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(new Date(createdAt));
}

function formatAvailability(entry: StaffWaitlistEntryDTO, anyTimeLabel: string) {
	if (entry.availableFrom && entry.availableUntil) {
		return `${entry.availableFrom} - ${entry.availableUntil}`;
	}

	return anyTimeLabel;
}

export function StaffWaitlistSection({ locale }: StaffWaitlistSectionProps) {
	const { t } = useTranslation();
	const [doctorId, setDoctorId] = useState<string | undefined>(undefined);
	const [page, setPage] = useState(1);
	const [removingId, setRemovingId] = useState<string | null>(null);
	const [removeError, setRemoveError] = useState<string | null>(null);

	const waitlistQuery = useStaffWaitlistQuery({ doctorId, page, pageSize: PAGE_SIZE });
	const doctorsQuery = useDoctorsQuery();
	const removeMutation = useRemoveWaitlistEntryMutation();

	const entries = waitlistQuery.data?.data ?? [];
	const total = waitlistQuery.data?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const isInitialLoading = waitlistQuery.isPending && !waitlistQuery.data;
	const isTableBusy = waitlistQuery.isFetching || removeMutation.isPending;

	useEffect(() => {
		if (page > totalPages) {
			setPage(totalPages);
		}
	}, [page, totalPages]);

	const doctorOptions = useMemo(() => doctorsQuery.data ?? [], [doctorsQuery.data]);

	function handleDoctorChange(value: string) {
		setDoctorId(value === ALL_DOCTORS_VALUE ? undefined : value);
		setPage(1);
	}

	function handleRemove(entryId: string) {
		setRemoveError(null);
		removeMutation.mutate(entryId, {
			onSuccess: () => {
				setRemovingId(null);
				setRemoveError(null);
			},
			onError: () => {
				setRemoveError(t("appointments.waitlist.removeError"));
			},
		});
	}

	const removingEntry = entries.find((entry) => entry.id === removingId) ?? null;

	return (
		<section dir={locale === "ar" ? "rtl" : "ltr"} lang={locale} className="flex flex-col gap-6 p-4 md:p-6">
			<header className="flex flex-col gap-2">
				<h1 className="text-2xl font-semibold text-foreground">{t("appointments.tabs.waitlist")}</h1>
				<p className="text-sm text-muted-foreground">{t("appointments.waitlist.subtitle")}</p>
			</header>

			<Card>
				<CardHeader className="gap-3 border-b border-border/70 pb-4">
					<CardTitle className="text-base font-semibold">{t("appointments.waitlist.filters")}</CardTitle>
					<div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
						<div className="flex min-w-0 flex-1 flex-col gap-2 md:max-w-sm">
							<label className="text-sm font-medium text-foreground" htmlFor="doctor-filter">
								{t("appointments.waitlist.doctorFilter")}
							</label>
							<Select value={doctorId ?? ALL_DOCTORS_VALUE} onValueChange={handleDoctorChange} disabled={doctorsQuery.isLoading || doctorsQuery.isFetching}>
								<SelectTrigger id="doctor-filter" aria-label={t("appointments.waitlist.doctorFilter") }>
									<SelectValue placeholder={t("appointments.waitlist.filterAll")} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL_DOCTORS_VALUE}>{t("appointments.waitlist.filterAll")}</SelectItem>
									{doctorOptions.map((doctor) => (
										<SelectItem key={doctor.id} value={doctor.id}>
											{[doctor.firstName, doctor.lastName].filter(Boolean).join(" ")}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-2 self-start md:self-end">
							<Button variant="outline" size="sm" onClick={() => waitlistQuery.refetch()} disabled={isTableBusy}>
								{isTableBusy ? <LoaderCircleIcon className="size-4 animate-spin" /> : <RefreshCwIcon className="size-4" />}
								{t("appointments.waitlist.refresh")}
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent className="space-y-4 p-0">
					{waitlistQuery.isError && (
						<Alert variant="destructive" className="m-4">
							<AlertCircleIcon className="size-4" />
							<AlertTitle>{t("appointments.waitlist.errorTitle")}</AlertTitle>
							<AlertDescription>{t("appointments.waitlist.errorDescription")}</AlertDescription>
						</Alert>
					)}

					{waitlistQuery.isError ? null : isInitialLoading ? (
						<div className="flex min-h-48 items-center justify-center p-6 text-sm text-muted-foreground" data-testid="staff-waitlist-loading">
							{t("appointments.waitlist.loading")}
						</div>
					) : entries.length === 0 ? (
						<div className="flex min-h-48 items-center justify-center p-6 text-sm text-muted-foreground" data-testid="staff-waitlist-empty">
							{t("appointments.waitlist.empty")}
						</div>
					) : (
						<div className="px-4 pb-4">
							<div className="w-full overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead scope="col">{t("appointments.waitlist.position")}</TableHead>
											<TableHead scope="col">{t("appointments.waitlist.patient")}</TableHead>
											<TableHead scope="col">{t("appointments.waitlist.doctor")}</TableHead>
											<TableHead scope="col">{t("appointments.waitlist.availability")}</TableHead>
											<TableHead scope="col">{t("appointments.waitlist.joined")}</TableHead>
											<TableHead scope="col" className="text-end">{t("appointments.waitlist.action")}</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{entries.map((entry) => (
											<TableRow key={entry.id}>
												<TableCell>{entry.position > 0 ? t("appointments.waitlist.positionValue", { position: entry.position }) : "—"}</TableCell>
												<TableCell>{formatWaitlistPatient(entry)}</TableCell>
												<TableCell>{formatWaitlistDoctor(entry)}</TableCell>
												<TableCell>{formatAvailability(entry, t("appointments.waitlist.anyTime"))}</TableCell>
												<TableCell>{formatJoinedDate(locale, entry.createdAt)}</TableCell>
												<TableCell className="text-end">
													<Button
														variant="outline"
														size="sm"
														onClick={() => {
															setRemoveError(null);
															setRemovingId(entry.id);
														}}
														data-testid={`remove-waitlist-entry-${entry.id}`}
													>
														<Trash2Icon className="size-4" />
														{t("appointments.waitlist.action")}
													</Button>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</div>
					)}

					<div className="flex flex-col gap-3 border-t border-border/70 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-sm text-muted-foreground" data-testid="staff-waitlist-page-info">
							{t("appointments.waitlist.pageInfo", { page, totalPages })}
						</p>
						<div className="flex items-center gap-2">
							<Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isTableBusy}>
								<ChevronLeftIcon className="size-4" />
								{t("appointments.waitlist.previous")}
							</Button>
							<Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isTableBusy}>
								{t("appointments.waitlist.next")}
								<ChevronRightIcon className="size-4" />
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			<AlertDialog open={removingId !== null} onOpenChange={(open) => {
				if (!open) {
					setRemovingId(null);
					setRemoveError(null);
				}
			}}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("appointments.waitlist.removeConfirmTitle")}</AlertDialogTitle>
						<AlertDialogDescription>{t("appointments.waitlist.removeConfirmDescription", { patient: removingEntry ? formatWaitlistPatient(removingEntry) : "" })}</AlertDialogDescription>
					</AlertDialogHeader>
					{removeError && (
						<Alert variant="destructive">
							<AlertDescription>{removeError}</AlertDescription>
						</Alert>
					)}
					<AlertDialogFooter>
						<Button variant="outline" onClick={() => {
							setRemovingId(null);
							setRemoveError(null);
						}}>
							{t("appointments.waitlist.removeCancel")}
						</Button>
						<Button onClick={() => removingId && handleRemove(removingId)} disabled={removeMutation.isPending}>
							{removeMutation.isPending ? t("appointments.waitlist.removing") : t("appointments.waitlist.removeConfirm")}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</section>
	);
}
