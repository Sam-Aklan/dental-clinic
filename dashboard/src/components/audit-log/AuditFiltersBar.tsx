import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AuditLogUrlState } from "@/types";
import { useTranslation } from "react-i18next";

type Props = {
	value: AuditLogUrlState;
	onChange: (patch: Partial<AuditLogUrlState>) => void;
	onReset: () => void;
};

function parseFilterDate(value: string) {
	if (!value) return undefined;
	const date = new Date(`${value}T00:00:00`);
	return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatFilterDate(value: string) {
	const date = parseFilterDate(value);
	if (!date) return "";
	return new Intl.DateTimeFormat(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	}).format(date);
}

function toFilterDateValue(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function AuditFiltersBar({ value, onChange, onReset }: Props) {
	const { t } = useTranslation();
	const [isFromOpen, setIsFromOpen] = useState(false);
	const [isToOpen, setIsToOpen] = useState(false);

	return (
		<div className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-2 xl:grid-cols-3">
			<label className="grid gap-1 text-sm">
				<span>{t("auditLog.filters.from")}</span>
				<Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className={cn("w-full justify-between font-normal", !value.from && "text-muted-foreground")}
						>
							<span className="truncate">{formatFilterDate(value.from) || t("auditLog.filters.from")}</span>
							<CalendarIcon className="ms-2 size-4 shrink-0 text-muted-foreground" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={parseFilterDate(value.from)}
							onSelect={(date) => {
								if (!date) return;
								onChange({ from: toFilterDateValue(date) });
								setIsFromOpen(false);
							}}
						/>
					</PopoverContent>
				</Popover>
			</label>
			<label className="grid gap-1 text-sm">
				<span>{t("auditLog.filters.to")}</span>
				<Popover open={isToOpen} onOpenChange={setIsToOpen}>
					<PopoverTrigger asChild>
						<Button
							type="button"
							variant="outline"
							className={cn("w-full justify-between font-normal", !value.to && "text-muted-foreground")}
						>
							<span className="truncate">{formatFilterDate(value.to) || t("auditLog.filters.to")}</span>
							<CalendarIcon className="ms-2 size-4 shrink-0 text-muted-foreground" />
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0" align="start">
						<Calendar
							mode="single"
							selected={parseFilterDate(value.to)}
							onSelect={(date) => {
								if (!date) return;
								onChange({ to: toFilterDateValue(date) });
								setIsToOpen(false);
							}}
						/>
					</PopoverContent>
				</Popover>
			</label>
			<label className="grid gap-1 text-sm">
				<span>{t("auditLog.filters.actorId")}</span>
				<Input value={value.actorId ?? ""} onChange={(event) => onChange({ actorId: event.target.value })} placeholder={t("auditLog.filters.actorIdPlaceholder")} />
			</label>
			<label className="grid gap-1 text-sm">
				<span>{t("auditLog.filters.actorName")}</span>
				<Input value={value.actorName ?? ""} onChange={(event) => onChange({ actorName: event.target.value })} placeholder={t("auditLog.filters.actorNamePlaceholder")} />
			</label>
			<label className="grid gap-1 text-sm">
				<span>{t("auditLog.filters.action")}</span>
				<Input value={value.action ?? ""} onChange={(event) => onChange({ action: event.target.value })} placeholder={t("auditLog.filters.actionPlaceholder")} />
			</label>
			<label className="grid gap-1 text-sm">
				<span>{t("auditLog.filters.targetType")}</span>
				<Input value={value.targetType ?? ""} onChange={(event) => onChange({ targetType: event.target.value })} placeholder={t("auditLog.filters.targetTypePlaceholder")} />
			</label>
			<label className="grid gap-1 text-sm md:col-span-2 xl:col-span-3">
				<span>{t("auditLog.filters.targetId")}</span>
				<Input value={value.targetId ?? ""} onChange={(event) => onChange({ targetId: event.target.value })} placeholder={t("auditLog.filters.targetIdPlaceholder")} />
			</label>
			<div className="md:col-span-2 xl:col-span-3">
				<Button type="button" variant="outline" onClick={onReset}>
					{t("auditLog.actions.reset")}
				</Button>
			</div>
		</div>
	);
}
