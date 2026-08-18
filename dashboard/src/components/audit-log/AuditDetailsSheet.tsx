import type { AuditLogEntry } from "@/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { AuditPayloadViewer } from "./AuditPayloadViewer";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import { getAuditActionLabel } from "@/lib/audit-log";

export function AuditDetailsSheet({ entry, open, onOpenChange }: { entry: AuditLogEntry | null; open: boolean; onOpenChange: (open: boolean) => void }) {
	const { t, i18n } = useTranslation();
	if (!entry) {
		return <Sheet open={open} onOpenChange={onOpenChange} />;
	}

	const actorName = entry.actor ? [entry.actor.firstName, entry.actor.lastName].filter(Boolean).join(" ") || entry.actor.id : entry.actorId ?? t("auditLog.unknownActor");
	const targetId = entry.target.id ?? t("auditLog.noTargetId");

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className=" overflow-y-auto px-4
			data-[side=right]:w-full
			data-[side=right]:sm:max-w-sm
			data-[side=right]:md:max-w-lg
			data-[side=right]:lg:max-w-xl
			data-[side=right]:xl:max-w-2xl
			data-[side=right]:2xl:max-w-3xl
			">
				<SheetHeader>
					<SheetTitle>{t("auditLog.details.title")}</SheetTitle>
				</SheetHeader>
				<div className="mt-6 space-y-4 text-sm">
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">{t("auditLog.details.actor")}</p>
						<p>{actorName}</p>
					</div>
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">{t("auditLog.details.action")}</p>
						<p>{entry.action}</p>
						<p className="text-xs text-muted-foreground">{getAuditActionLabel(entry.action, t)}</p>
					</div>
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">{t("auditLog.details.target")}</p>
						<p>{entry.target.type} {targetId}</p>
					</div>
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">{t("auditLog.details.timestamp")}</p>
						<p>{dayjs(entry.createdAt).locale(i18n.language).format("YYYY-MM-DD HH:mm")}</p>
					</div>
					<Separator />
					<div>
						<p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">{t("auditLog.details.payload")}</p>
						<AuditPayloadViewer payload={entry.payload} />
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
