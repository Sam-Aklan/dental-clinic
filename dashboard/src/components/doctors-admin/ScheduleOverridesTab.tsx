import type { ScheduleOverrideDTO } from "@/types";
import { useTranslation } from "react-i18next";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatOverrideTime } from "@/lib/doctors-admin";
import { ScheduleOverrideForm } from "./ScheduleOverrideForm";
import { DeleteOverrideDialog } from "./DeleteOverrideDialog";
import type { ScheduleOverrideFormValues } from "@/lib/doctors-admin";

type ScheduleOverridesTabProps = {
	overrides: ScheduleOverrideDTO[];
	isLoading: boolean;
	isError: boolean;
	errorMessage?: string | null;
	onCreate: (values: ScheduleOverrideFormValues) => void | Promise<void>;
	onDelete: (overrideId: string) => void | Promise<void>;
	isCreating?: boolean;
	isDeletingId?: string | null;
	direction?: "ltr" | "rtl";
};

export function ScheduleOverridesTab({ overrides, isLoading, isError, errorMessage, onCreate, onDelete, isCreating = false, isDeletingId = null, direction }: ScheduleOverridesTabProps) {
	const { t } = useTranslation();
	return (
		<div dir={direction} className="grid gap-4">
			<ScheduleOverrideForm submitLabel={t("doctorsAdmin.actions.addOverride")} onSubmit={onCreate} isPending={isCreating} errorMessage={errorMessage} />
			<Card>
				<CardHeader>
					<CardTitle>{t("doctorsAdmin.overrideList.title")}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{isLoading ? (
						<div className="space-y-3">
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-16 w-full" />
						</div>
					) : isError ? (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>{t("doctorsAdmin.overrideList.errorTitle")}</EmptyTitle>
								<EmptyDescription>{t("doctorsAdmin.overrideList.errorDescription")}</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : overrides.length === 0 ? (
						<Empty>
							<EmptyHeader>
								<EmptyTitle>{t("doctorsAdmin.overrideList.emptyTitle")}</EmptyTitle>
								<EmptyDescription>{t("doctorsAdmin.overrideList.emptyDescription")}</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<div className="grid gap-3">
							{overrides.map((overrideItem) => (
								<div key={overrideItem.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
									<div>
										<p className="font-medium">{overrideItem.date}</p>
										<p className="text-sm text-muted-foreground">{formatOverrideTime(overrideItem)}</p>
									</div>
									<DeleteOverrideDialog isPending={isDeletingId === overrideItem.id} onConfirm={() => onDelete(overrideItem.id)} />
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
