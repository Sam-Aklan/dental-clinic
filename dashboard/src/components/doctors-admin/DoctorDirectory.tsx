import type { DoctorDTO, DoctorsAdminUrlState } from "@/types";
import { useTranslation } from "react-i18next";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { hasStatusSupport } from "@/lib/doctors-admin";
import { DoctorDirectoryItem } from "./DoctorDirectoryItem";

type DoctorDirectoryProps = {
	doctors: DoctorDTO[];
	isLoading: boolean;
	isError: boolean;
	selectedDoctorId: string;
	search: DoctorsAdminUrlState;
	total: number;
	pageSize: number;
	onSearchChange: (patch: Partial<DoctorsAdminUrlState>) => void;
	onReset: () => void;
	onSelectDoctor: (doctorId: string) => void;
	onRetry: () => void;
};

export function DoctorDirectory({ doctors, isLoading, isError, selectedDoctorId, search, total, pageSize, onSearchChange, onReset, onSelectDoctor, onRetry }: DoctorDirectoryProps) {
	const { t } = useTranslation();
	const statusSupported = hasStatusSupport(doctors);
	const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));

	return (
		<Card className="min-w-0">
			<CardHeader className="gap-4 border-b">
				<CardTitle>{t("doctorsAdmin.directory.title")}</CardTitle>
				<div className="grid gap-3">
					<div className="grid gap-2">
						<Label htmlFor="doctor-search">{t("doctorsAdmin.directory.search")}</Label>
						<Input
							id="doctor-search"
							value={search.q}
							onChange={(event) => onSearchChange({ q: event.target.value, page: 1 })}
							placeholder={t("doctorsAdmin.directory.searchPlaceholder")}
						/>
					</div>
					<div className="grid gap-2 md:grid-cols-2">
						<div className="grid gap-2">
							<Label htmlFor="doctor-specialization">{t("doctorsAdmin.directory.specialization")}</Label>
							<Input
								id="doctor-specialization"
								value={search.specialization}
								onChange={(event) => onSearchChange({ specialization: event.target.value, page: 1 })}
								placeholder={t("doctorsAdmin.directory.specializationPlaceholder")}
							/>
						</div>
						{statusSupported ? (
							<div className="grid gap-2">
								<Label htmlFor="doctor-status">{t("doctorsAdmin.directory.status")}</Label>
								<Select
									value={search.status || "all"}
									onValueChange={(value) => onSearchChange({ status: (value === "all" ? "" : value) as DoctorsAdminUrlState["status"], page: 1 })}
								>
									<SelectTrigger id="doctor-status" aria-label={t("doctorsAdmin.directory.status")}>
										<SelectValue placeholder={t("doctorsAdmin.directory.status")} />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">{t("doctorsAdmin.directory.statusAll")}</SelectItem>
										<SelectItem value="active">{t("doctorsAdmin.directory.statusActive")}</SelectItem>
										<SelectItem value="inactive">{t("doctorsAdmin.directory.statusInactive")}</SelectItem>
									</SelectContent>
								</Select>
							</div>
						) : null}
					</div>
					<div className="flex flex-wrap gap-2">
						<Button variant="outline" size="sm" onClick={onReset}>{t("doctorsAdmin.actions.reset")}</Button>
						<Button variant="outline" size="sm" onClick={onRetry}>{t("doctorsAdmin.actions.refresh")}</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-3 py-4">
				{isLoading ? (
					<div className="space-y-3">
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
						<Skeleton className="h-24 w-full" />
					</div>
				) : isError ? (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>{t("doctorsAdmin.directory.errorTitle")}</EmptyTitle>
							<EmptyDescription>{t("doctorsAdmin.directory.errorDescription")}</EmptyDescription>
						</EmptyHeader>
						<EmptyContent>
							<Button onClick={onRetry}>{t("doctorsAdmin.actions.retry")}</Button>
						</EmptyContent>
					</Empty>
				) : doctors.length === 0 ? (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>{t("doctorsAdmin.directory.emptyTitle")}</EmptyTitle>
							<EmptyDescription>{t("doctorsAdmin.directory.emptyDescription")}</EmptyDescription>
						</EmptyHeader>
					</Empty>
				) : (
					<div className="grid gap-3">
						{doctors.map((doctor) => (
							<DoctorDirectoryItem key={doctor.id} doctor={doctor} selected={doctor.id === selectedDoctorId} onSelect={onSelectDoctor} />
						))}
						<div className="flex items-center justify-between gap-2 pt-2">
							<Button variant="outline" size="sm" disabled={search.page <= 1} onClick={() => onSearchChange({ page: Math.max(1, search.page - 1) })}>{t("doctorsAdmin.actions.previous")}</Button>
							<p className="text-sm text-muted-foreground">{t("doctorsAdmin.directory.page", { page: search.page, totalPages })}</p>
							<Button variant="outline" size="sm" disabled={search.page >= totalPages} onClick={() => onSearchChange({ page: Math.min(totalPages, search.page + 1) })}>{t("doctorsAdmin.actions.next")}</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
