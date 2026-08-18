import { useEffect, useMemo, useState } from "react";
import { InfoIcon, RotateCcwIcon, SearchIcon, TriangleAlertIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { usePatientSearchQuery } from "@/hooks/patients";
import type { StaffPatientSearchDTO } from "@/types";

interface PatientLookupProps {
	selectedPatient: StaffPatientSearchDTO | null;
	selectedPatientLoading: boolean;
	warning: string | null;
	onSelectPatient: (patient: StaffPatientSearchDTO) => void;
	onClearPatient: () => void;
}

export function PatientLookup({ selectedPatient, selectedPatientLoading, warning, onSelectPatient, onClearPatient }: PatientLookupProps) {
	const { t } = useTranslation();
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");

	useEffect(() => {
		const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
		return () => window.clearTimeout(timer);
	}, [query]);

	const search = usePatientSearchQuery({ q: debouncedQuery, page: 1, pageSize: 6 });
	const hasMinChars = debouncedQuery.length >= 2;
	const resultCountLabel = useMemo(() => {
		if (!search.data) return null;
		return t("walkIn.patientLookup.resultCount", { count: search.data.total });
	}, [search.data, t]);

	function handleClear() {
		setQuery("");
		setDebouncedQuery("");
		onClearPatient();
	}

	return (
		<Card className="overflow-hidden">
			<CardHeader className="space-y-2">
				<CardTitle>{t("walkIn.patientLookup.title")}</CardTitle>
				<p className="text-sm text-muted-foreground">{t("walkIn.patientLookup.subtitle")}</p>
			</CardHeader>
			<CardContent className="space-y-4">
				{warning && (
					<Alert variant="destructive" role="alert">
						<TriangleAlertIcon className="size-4" />
						<AlertTitle>{t("walkIn.patientLookup.warningTitle")}</AlertTitle>
						<AlertDescription>{warning}</AlertDescription>
					</Alert>
				)}

				{selectedPatient ? (
					<div className="space-y-3 rounded-lg border bg-muted/20 p-4">
						<div className="flex items-start justify-between gap-3">
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">{t("walkIn.patientLookup.selectedPatient")}</p>
								<p className="text-lg font-semibold">{selectedPatient.firstName} {selectedPatient.lastName}</p>
							</div>
							<Badge variant={selectedPatient.isActive ? "default" : "secondary"}>
								{selectedPatient.isActive ? t("walkIn.patientLookup.active") : t("walkIn.patientLookup.inactive")}
							</Badge>
						</div>
						<div className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
							<p>{selectedPatient.phone ?? t("walkIn.patientLookup.noPhone")}</p>
							<p>{selectedPatient.email ?? t("walkIn.patientLookup.noEmail")}</p>
							<p>{selectedPatient.dateOfBirth ? t("walkIn.patientLookup.dob", { value: selectedPatient.dateOfBirth }) : t("walkIn.patientLookup.noDob")}</p>
						</div>
						<Button type="button" variant="outline" onClick={handleClear} className="w-full sm:w-auto">
							<RotateCcwIcon className="me-2 size-4" />
							{t("walkIn.patientLookup.changePatient")}
						</Button>
					</div>
				) : (
					<div className="space-y-4">
						<div className="relative">
							<SearchIcon className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								type="search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder={t("walkIn.patientLookup.searchPlaceholder")}
								className="ps-9"
								aria-label={t("walkIn.patientLookup.searchAriaLabel")}
							/>
						</div>

						{query.trim().length === 0 && <p className="text-sm text-muted-foreground">{t("walkIn.patientLookup.guidance")}</p>}
						{query.trim().length > 0 && !hasMinChars && <p className="text-sm text-muted-foreground">{t("walkIn.patientLookup.minChars")}</p>}

						{selectedPatientLoading && (
							<div className="space-y-3" aria-label={t("walkIn.patientLookup.loadingSelected")}>
								<Skeleton className="h-28 w-full" />
							</div>
						)}

						{hasMinChars && search.isLoading && (
							<div className="space-y-3" aria-label={t("walkIn.patientLookup.loadingResults")}>
								{Array.from({ length: 3 }).map((_, index) => (
									<Skeleton key={`patient-skeleton-${index}`} className="h-24 w-full" />
								))}
							</div>
						)}

						{search.isError && (
							<Alert role="alert" variant="destructive">
								<TriangleAlertIcon className="size-4" />
								<AlertTitle>{t("walkIn.patientLookup.errorTitle")}</AlertTitle>
								<AlertDescription>
									{((search.error as { response?: { status?: number } })?.response?.status === 403)
										? t("walkIn.patientLookup.permissionRequired")
										: t("walkIn.patientLookup.loadFailed")}
								</AlertDescription>
							</Alert>
						)}

						{hasMinChars && search.data && !search.isError && (
							<div className="space-y-3">
								<p className="text-sm text-muted-foreground" aria-live="polite">{resultCountLabel}</p>
								{search.data.data.length > 0 ? (
									<div className="space-y-2" role="listbox" aria-label={t("walkIn.patientLookup.resultsLabel")}>
										{search.data.data.map((patient) => {
											const inactive = !patient.isActive;
											return (
												<button
													key={patient.id}
													type="button"
													role="option"
													aria-selected="false"
													disabled={inactive}
													onClick={() => onSelectPatient(patient)}
													className="w-full rounded-lg border p-4 text-start transition-colors hover:border-primary hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60"
												>
													<div className="flex items-start justify-between gap-3">
														<div className="space-y-1">
															<p className="font-medium">{patient.firstName} {patient.lastName}</p>
															<p className="text-sm text-muted-foreground">{patient.phone ?? patient.email ?? patient.dateOfBirth ?? t("walkIn.patientLookup.noContact")}</p>
														</div>
														<Badge variant={patient.isActive ? "default" : "secondary"}>{patient.isActive ? t("walkIn.patientLookup.active") : t("walkIn.patientLookup.inactive")}</Badge>
													</div>
													{inactive && <p className="mt-2 text-xs text-muted-foreground">{t("walkIn.patientLookup.inactiveHint")}</p>}
												</button>
											);
										})}
									</div>
								) : (
								<div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
									<InfoIcon className="mx-auto mb-2 size-5" />
									<p>{t("walkIn.patientLookup.noResults")}</p>
										<p className="mt-1">{t("walkIn.patientLookup.newPatientUnavailable")}</p>
									</div>
								)}
							</div>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
