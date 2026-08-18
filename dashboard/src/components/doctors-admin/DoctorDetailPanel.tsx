import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DoctorDTO } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { DoctorProfileForm } from "./DoctorProfileForm";
import { ScheduleOverridesTab } from "./ScheduleOverridesTab";
import { createScheduleOverridePayload, formatDoctorName, normalizeApiError, updateDoctorPayload } from "@/lib/doctors-admin";
import { useCreateOverride, useDeleteOverride, useDoctorOverrides, useUpdateDoctor } from "@/hooks/doctors-admin";

type DoctorDetailPanelProps = {
	doctor: DoctorDTO | null;
	isLoading: boolean;
	isError: boolean;
	selectedTab: "profile" | "overrides";
	onTabChange: (tab: "profile" | "overrides") => void;
	onBack?: () => void;
	direction?: "ltr" | "rtl";
};

export function DoctorDetailPanel({ doctor, isLoading, isError, selectedTab, onTabChange, onBack, direction }: DoctorDetailPanelProps) {
	const { t } = useTranslation();
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [overrideErrorMessage, setOverrideErrorMessage] = useState<string | null>(null);
	const updateMutation = useUpdateDoctor();
	const createOverrideMutation = useCreateOverride();
	const deleteOverrideMutation = useDeleteOverride();
	const overridesQuery = useDoctorOverrides(doctor?.id ?? "", selectedTab === "overrides" && Boolean(doctor?.id));

	const overrideError = overrideErrorMessage ?? (overridesQuery.error ? t("doctorsAdmin.overrideList.errorTitle") : null);
	const profileDefaults = useMemo(() => {
		if (!doctor) return undefined;
		return {
			firstName: doctor.firstName,
			lastName: doctor.lastName,
			email: doctor.email ?? "",
			phone: doctor.phone ?? "",
			specialization: doctor.specialization ?? "",
			bio: doctor.bio ?? "",
			isActive: doctor.isActive ?? true,
		};
	}, [doctor]);
	const detail = useMemo(() => {
		if (!doctor) return null;
		return {
			name: formatDoctorName(doctor),
			availability: doctor.defaultAvailability?.trim() || t("doctorsAdmin.directory.derivedAvailability"),
		};
	}, [doctor, t]);

	if (isLoading) {
		return <Card><CardContent className="p-6">{t("doctorsAdmin.detail.loading")}</CardContent></Card>;
	}

	if (isError || !doctor) {
		return (
			<Alert variant="destructive" dir={direction}>
				<AlertTitle>{t("doctorsAdmin.detail.noSelectionTitle")}</AlertTitle>
				<AlertDescription>{t("doctorsAdmin.detail.noSelectionDescription")}</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="grid gap-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div>
					<h2 className="text-xl font-semibold">{detail?.name}</h2>
					<p className="text-sm text-muted-foreground">{detail?.availability}</p>
				</div>
				<div className="flex gap-2">
					<Button variant={selectedTab === "profile" ? "default" : "outline"} size="sm" onClick={() => onTabChange("profile")}>{t("doctorsAdmin.tabs.profile")}</Button>
					<Button variant={selectedTab === "overrides" ? "default" : "outline"} size="sm" onClick={() => onTabChange("overrides")}>{t("doctorsAdmin.tabs.overrides")}</Button>
					{onBack ? <Button variant="outline" size="sm" onClick={onBack}>{t("doctorsAdmin.actions.back")}</Button> : null}
				</div>
			</div>

			{selectedTab === "profile" ? (
				<DoctorProfileForm
					mode="edit"
					defaultValues={profileDefaults}
					submitLabel={t("doctorsAdmin.actions.saveChanges")}
					isPending={updateMutation.isPending}
					errorMessage={errorMessage}
					onCancel={() => setErrorMessage(null)}
					emailReadOnly={true}
					showActive={doctor.isActive !== undefined && doctor.isActive !== null}
					onSubmit={async (values) => {
						setErrorMessage(null);
						try {
							await updateMutation.mutateAsync({ id: doctor.id, payload: updateDoctorPayload(values) });
							toast.success(t("doctorsAdmin.success.updateProfile") as string || "Profile updated successfully");
						} catch (error) {
							const msg = normalizeApiError(error) || t("doctorsAdmin.errors.updateFailed") as string;
							setErrorMessage(msg);
							toast.error(msg);
						}
					}}
				/>
			) : (
				<ScheduleOverridesTab
					overrides={overridesQuery.data?.data ?? []}
					isLoading={overridesQuery.isLoading}
					isError={overridesQuery.isError}
					errorMessage={overrideError}
					isCreating={createOverrideMutation.isPending}
					isDeletingId={deleteOverrideMutation.variables?.overrideId ?? null}
					direction={direction}
					onCreate={async (values) => {
						setOverrideErrorMessage(null);
						try {
							await createOverrideMutation.mutateAsync({ doctorId: doctor.id, payload: createScheduleOverridePayload(values) });
							toast.success(t("doctorsAdmin.success.createOverride") as string || "Schedule override added successfully");
						} catch (error) {
							const msg = normalizeApiError(error) || t("doctorsAdmin.errors.createOverrideFailed") as string;
							setOverrideErrorMessage(msg);
							toast.error(msg);
						}
					}}
					onDelete={async (overrideId) => {
						try {
							await deleteOverrideMutation.mutateAsync({ doctorId: doctor.id, overrideId });
							toast.success(t("doctorsAdmin.success.deleteOverride") as string || "Schedule override deleted successfully");
						} catch {
							const msg = t("doctorsAdmin.errors.deleteOverrideFailed") as string;
							setOverrideErrorMessage(msg);
							toast.error(msg);
						}
					}}
				/>
			)}
		</div>
	);
}
