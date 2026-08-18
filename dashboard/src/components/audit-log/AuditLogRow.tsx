import { Button } from "@/components/ui/button";
import type { AuditLogEntry } from "@/types";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";
import { getAuditActionLabel } from "@/lib/audit-log";

function formatActor(entry: AuditLogEntry, unknownLabel: string) {
	if (entry.actor) {
		return [entry.actor.firstName, entry.actor.lastName].filter(Boolean).join(" ") || entry.actor.id;
	}
	return entry.actorId ?? unknownLabel;
}

function formatTarget(entry: AuditLogEntry, noTargetLabel: string) {
	return entry.target.id ? `${entry.target.type} · ${entry.target.id.slice(0, 8)}` : `${entry.target.type} · ${noTargetLabel}`;
}

export function AuditLogRow({ entry, onViewDetails }: { entry: AuditLogEntry; onViewDetails: (entry: AuditLogEntry) => void }) {
	const { t, i18n } = useTranslation();
	const detailsLabel = `${t("auditLog.actions.viewDetails")} · ${getAuditActionLabel(entry.action, t)} · ${dayjs(entry.createdAt).locale(i18n.language).format("YYYY-MM-DD HH:mm")}`;

	return (
		<tr className="border-b last:border-b-0">
			<td className="p-3 whitespace-nowrap">{dayjs(entry.createdAt).locale(i18n.language).format("YYYY-MM-DD HH:mm")}</td>
			<td className="p-3">{formatActor(entry, t("auditLog.unknownActor"))}</td>
			<td className="p-3">{getAuditActionLabel(entry.action, t)}</td>
			<td className="p-3">{formatTarget(entry, t("auditLog.noTargetId"))}</td>
			<td className="p-3">{entry.summary}</td>
			<td className="p-3 text-end">
				<Button type="button" variant="ghost" aria-label={detailsLabel} onClick={() => onViewDetails(entry)}>{t("auditLog.actions.viewDetails")}</Button>
			</td>
		</tr>
	);
}
