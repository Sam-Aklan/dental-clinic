import { Button } from "@/components/ui/button";
import type { AuditLogEntry } from "@/types";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { getAuditActionLabel } from "@/lib/audit-log";

export function AuditLogCard({ entry, onViewDetails }: { entry: AuditLogEntry; onViewDetails: (entry: AuditLogEntry) => void }) {
	const { t, i18n } = useTranslation();
	const actor = entry.actor ? [entry.actor.firstName, entry.actor.lastName].filter(Boolean).join(" ") || entry.actor.id : entry.actorId ?? t("auditLog.unknownActor");
	const detailsLabel = `${t("auditLog.actions.viewDetails")} · ${getAuditActionLabel(entry.action, t)} · ${dayjs(entry.createdAt).locale(i18n.language).format("YYYY-MM-DD HH:mm")}`;

	return (
		<article className="rounded-lg border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-sm font-medium">{getAuditActionLabel(entry.action, t)}</p>
					<p className="text-xs text-muted-foreground">{dayjs(entry.createdAt).locale(i18n.language).format("YYYY-MM-DD HH:mm")}</p>
				</div>
				<Button type="button" variant="outline" size="sm" aria-label={detailsLabel} onClick={() => onViewDetails(entry)}>{t("auditLog.actions.viewDetails")}</Button>
			</div>
			<div className="mt-3 grid gap-1 text-sm">
				<p>{t("auditLog.details.actor")}: {actor}</p>
				<p>{t("auditLog.details.target")}: {entry.target.type} {entry.target.id ?? t("auditLog.noTargetId")}</p>
				<p className="text-muted-foreground">{entry.summary}</p>
			</div>
		</article>
	);
}
