import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useWaitlistQuery, useJoinWaitlistMutation, useUpdateWaitlistWindowMutation, useLeaveWaitlistMutation } from "@/hooks/waitlist";
import { useDoctorsQuery } from "@/hooks/booking";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { WaitlistEntryCard, WaitlistEntryCardSkeleton } from "./WaitlistEntryCard";
import { AvailabilityWindowForm } from "./AvailabilityWindowForm";
import { LeaveWaitlistDialog } from "./LeaveWaitlistDialog";
import { isDoctorJoinable } from "@/lib/waitlist";
import type { AvailabilityWindowFormData } from "@/lib/waitlist";

interface WaitlistPageSectionProps {
	preselectedDoctorId?: string | null;
}

export function WaitlistPageSection({ preselectedDoctorId = null }: WaitlistPageSectionProps) {
	const { t } = useTranslation();
	const { data: entries = [], isLoading, isError, refetch } = useWaitlistQuery();
	const { data: doctors = [], isLoading: doctorsLoading, isError: doctorsError, refetch: refetchDoctors } = useDoctorsQuery();
	const joinMutation = useJoinWaitlistMutation();
	const updateMutation = useUpdateWaitlistWindowMutation();
	const leaveMutation = useLeaveWaitlistMutation();

	const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
	const [leavingEntryId, setLeavingEntryId] = useState<string | null>(null);
	const [joinFormError, setJoinFormError] = useState<string | null>(null);
	const [editFormError, setEditFormError] = useState<string | null>(null);
	const [leaveError, setLeaveError] = useState<string | null>(null);

	const handleJoin = useCallback(
		(data: AvailabilityWindowFormData) => {
			setJoinFormError(null);
			joinMutation.mutate(
				{
					doctorId: data.doctorId,
					availableFrom: data.availableFrom || null,
					availableUntil: data.availableUntil || null,
				},
				{
					onSuccess: () => setJoinFormError(null),
					onError: (error: unknown) => {
						const axiosError = error as { response?: { status?: number } };
						if (axiosError?.response?.status === 409) {
							setJoinFormError("waitlist.alreadyJoined");
						} else {
							setJoinFormError("waitlist.errors.joinFailed");
						}
					},
				},
			);
		},
		[joinMutation],
	);

	const handleEdit = useCallback(
		(data: AvailabilityWindowFormData) => {
			if (!editingEntryId) return;
			setEditFormError(null);
			updateMutation.mutate(
				{
					id: editingEntryId,
					payload: {
						availableFrom: data.availableFrom || null,
						availableUntil: data.availableUntil || null,
					},
				},
				{
					onSuccess: () => {
						setEditingEntryId(null);
						setEditFormError(null);
					},
					onError: () => {
						setEditFormError("waitlist.errors.updateFailed");
					},
				},
			);
		},
		[editingEntryId, updateMutation],
	);

	const handleLeave = useCallback(() => {
		if (!leavingEntryId) return;
		setLeaveError(null);
		leaveMutation.mutate(leavingEntryId, {
			onSuccess: () => {
				setLeavingEntryId(null);
				setLeaveError(null);
			},
			onError: () => {
				setLeaveError("waitlist.errors.leaveFailed");
			},
		});
	}, [leavingEntryId, leaveMutation]);

	const handleCancelEdit = useCallback(() => {
		setEditingEntryId(null);
		setEditFormError(null);
	}, []);

	const joinableDoctorId =
		preselectedDoctorId && isDoctorJoinable(preselectedDoctorId, entries)
			? preselectedDoctorId
			: null;

	return (
		<section className="flex flex-col gap-6 px-4 py-6 md:flex-row md:gap-8 md:px-6 lg:px-8">
			<div className="flex flex-col gap-4 md:flex-1">
				<div className="flex flex-col gap-1">
					<h1 className="text-2xl font-semibold text-foreground">{t("waitlist.title")}</h1>
					<p className="text-sm text-muted-foreground">{t("waitlist.description")}</p>
				</div>

				{isLoading && (
					<div className="flex flex-col gap-3" role="status" aria-label={t("waitlist.loadingEntries")}>
						<WaitlistEntryCardSkeleton />
						<WaitlistEntryCardSkeleton />
					</div>
				)}

				{isError && !isLoading && (
					<Alert variant="destructive" role="alert">
						<AlertDescription>{t("waitlist.errorEntries")}</AlertDescription>
						<Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
							{t("waitlist.retry")}
						</Button>
					</Alert>
				)}

				{!isLoading && !isError && entries.length === 0 && (
					<p className="text-sm text-muted-foreground py-4">{t("waitlist.empty")}</p>
				)}

				{!isLoading && !isError && entries.length > 0 && (
					<div className="flex flex-col gap-3">
						{entries.map((entry) =>
							editingEntryId === entry.id ? (
								<div key={entry.id} className="rounded-lg border p-4">
									<AvailabilityWindowForm
										mode="edit"
										doctors={doctors}
										doctorsLoading={false}
										doctorsError={false}
										onRetryDoctors={() => {}}
										activeEntries={entries}
										isPending={updateMutation.isPending}
										formError={editFormError}
										initialValues={{
											doctorId: entry.doctorId,
											availableFrom: entry.availableFrom ?? "",
											availableUntil: entry.availableUntil ?? "",
										}}
										onSubmit={handleEdit}
										onCancel={handleCancelEdit}
									/>
								</div>
							) : (
								<WaitlistEntryCard
									key={entry.id}
									entry={entry}
									onEdit={setEditingEntryId}
									onLeave={setLeavingEntryId}
								/>
							),
						)}
					</div>
				)}
			</div>

			<div className="flex flex-col gap-3 md:w-80 lg:w-96">
				<h2 className="text-lg font-semibold text-foreground">{t("waitlist.joinTitle")}</h2>
				<AvailabilityWindowForm
					mode="join"
					doctors={doctors}
					doctorsLoading={doctorsLoading}
					doctorsError={doctorsError}
					onRetryDoctors={() => refetchDoctors()}
					activeEntries={entries}
					isPending={joinMutation.isPending}
					formError={joinFormError}
					initialValues={
						joinableDoctorId
							? { doctorId: joinableDoctorId, availableFrom: "", availableUntil: "" }
							: undefined
					}
					onSubmit={handleJoin}
				/>
			</div>

			<LeaveWaitlistDialog
				open={leavingEntryId !== null}
				onOpenChange={(open) => {
					if (!open) setLeavingEntryId(null);
				}}
				onConfirm={handleLeave}
				isPending={leaveMutation.isPending}
				error={leaveError}
			/>
		</section>
	);
}
