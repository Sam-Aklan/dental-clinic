import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { DoctorsAdminUrlState } from "@/types";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useIsXl } from "@/hooks/shared";
import { useDoctors, useDoctor } from "@/hooks/doctors-admin";
import { toDoctorFilters } from "@/lib/doctors-admin";
import { CreateDoctorDialog } from "./CreateDoctorDialog";
import { DoctorDirectory } from "./DoctorDirectory";
import { DoctorDetailPanel } from "./DoctorDetailPanel";

type DoctorsAdminPageProps = {
	search: DoctorsAdminUrlState;
	onUpdateSearch: (patch: Partial<DoctorsAdminUrlState>) => void;
	onResetSearch: () => void;
};

export function DoctorsAdminPage({ search, onUpdateSearch, onResetSearch }: DoctorsAdminPageProps) {
	const { t, i18n } = useTranslation();
	const isXl = useIsXl();
	const filters = useMemo(() => toDoctorFilters(search), [search]);
	const directoryQuery = useDoctors(filters);
	const selectedDoctorId = search.doctorId;
	const doctorQuery = useDoctor(selectedDoctorId);

	const selectedDoctor = doctorQuery.data ?? null;
	const showInlineDetail = isXl;
	const showDetailDialog = Boolean(selectedDoctorId) && !isXl;

	const handleCloseDetail = () => {
		onUpdateSearch({ doctorId: "", tab: "profile" });
	};

	return (
			<div dir={i18n.dir()} className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
			<div>
				<div className="mb-4 flex items-center justify-between gap-3">
					<div>
						<h1 className="text-2xl font-semibold">{t("doctorsAdmin.page.title")}</h1>
						<p className="text-sm text-muted-foreground">{t("doctorsAdmin.page.subtitle")}</p>
					</div>
					<CreateDoctorDialog />
				</div>
				<DoctorDirectory
					doctors={directoryQuery.data?.data ?? []}
					isLoading={directoryQuery.isLoading}
					isError={directoryQuery.isError}
					selectedDoctorId={selectedDoctorId}
					search={search}
					total={directoryQuery.data?.total ?? 0}
					pageSize={directoryQuery.data?.pageSize ?? 1}
					onSearchChange={(patch) => onUpdateSearch(patch)}
					onReset={onResetSearch}
					onSelectDoctor={(doctorId) => {
						onUpdateSearch({ doctorId, tab: "profile" });
					}}
					onRetry={() => void directoryQuery.refetch()}
				/>
			</div>

			{showInlineDetail ? (
				<div>
					{selectedDoctorId ? (
						<DoctorDetailPanel
							doctor={selectedDoctor}
							isLoading={doctorQuery.isLoading}
							isError={doctorQuery.isError}
							selectedTab={search.tab}
							onTabChange={(tab) => onUpdateSearch({ tab })}
							onBack={handleCloseDetail}
							direction={i18n.dir()}
						/>
					) : (
						<Card>
							<CardContent className="p-6">
								<Alert>
									<AlertTitle>{t("doctorsAdmin.detail.noSelectionTitle")}</AlertTitle>
									<AlertDescription>{t("doctorsAdmin.detail.noSelectionDescription")}</AlertDescription>
								</Alert>
							</CardContent>
						</Card>
					)}
				</div>
			) : null}

		<Dialog open={showDetailDialog} onOpenChange={(open) => { if (!open) handleCloseDetail(); }} >
				<DialogContent dir={i18n.dir()}  showCloseButton={false} className="max-h-[85vh] sm:max-w-4xl overflow-y-auto p-4 sm:p-6">
					<DialogHeader className="sr-only">
						<DialogTitle>Doctor details</DialogTitle>
						<DialogDescription>Review and update the selected doctor profile and schedule overrides.</DialogDescription>
					</DialogHeader>
					{selectedDoctorId ? (
						<DoctorDetailPanel
							doctor={selectedDoctor}
							isLoading={doctorQuery.isLoading}
							isError={doctorQuery.isError}
							selectedTab={search.tab}
							onTabChange={(tab) => onUpdateSearch({ tab })}
							onBack={handleCloseDetail}
							direction={i18n.dir()}
						/>
					) : null}
				</DialogContent>
			</Dialog>
		</div>
	);
}
