import type { AuditLogEntry } from "@/types";
import { AuditLogCard } from "./AuditLogCard";

export function AuditLogCards({ items, onViewDetails }: { items: AuditLogEntry[]; onViewDetails: (entry: AuditLogEntry) => void }) {
	return <div className="grid gap-3 md:hidden">{items.map((entry) => <AuditLogCard key={entry.id} entry={entry} onViewDetails={onViewDetails} />)}</div>;
}
