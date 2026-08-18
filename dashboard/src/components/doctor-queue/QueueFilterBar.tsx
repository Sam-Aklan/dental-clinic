import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus, DoctorQueueFilterState } from "@/types";
import { useTranslation } from "react-i18next";

interface QueueFilterBarProps {
	state: DoctorQueueFilterState;
	onToggleStatus: (status: AppointmentStatus) => void;
	onToggleShowFinished: () => void;
	onClear: () => void;
}

const STATUS_OPTIONS: AppointmentStatus[] = ["PENDING", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "NO_SHOW", "CANCELED"];

export function QueueFilterBar({ state, onToggleStatus, onToggleShowFinished, onClear }: QueueFilterBarProps) {
	const { t } = useTranslation();
	return (
		<div className="grid gap-3 rounded-lg border border-border p-4">
			<div className="flex flex-wrap gap-2">
				{STATUS_OPTIONS.map((status) => (
					<Button key={status} type="button" size="sm" variant={state.statuses.includes(status) ? "default" : "outline"} onClick={() => onToggleStatus(status)}>
						{t(`queue.status.${status}`)}
					</Button>
				))}
			</div>
			<div className="flex flex-wrap items-center gap-2">
				<Button type="button" size="sm" variant={state.showFinished ? "default" : "outline"} onClick={onToggleShowFinished}>{t("queue.filters.showFinished")}</Button>
				{state.statuses.length ? <Badge variant="secondary">{state.statuses.length} selected</Badge> : null}
				<Button type="button" size="sm" variant="ghost" onClick={onClear}>{t("queue.filters.clear")}</Button>
			</div>
		</div>
	);
}
