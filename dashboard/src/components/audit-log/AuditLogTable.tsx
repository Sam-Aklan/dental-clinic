import type { AuditLogEntry, AuditSortDir, AuditSortField } from "@/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";
import { AuditLogRow } from "./AuditLogRow";

type Props = {
	items: AuditLogEntry[];
	sortBy: AuditSortField;
	sortDir: AuditSortDir;
	onSort: (field: AuditSortField) => void;
	onViewDetails: (entry: AuditLogEntry) => void;
};

export function AuditLogTable({ items, sortBy, sortDir, onSort, onViewDetails }: Props) {
	const { t } = useTranslation();
	const headers: Array<{ key: AuditSortField | "summary" | "details"; label: string; sortable?: boolean }> = [
		{ key: "createdAt", label: t("auditLog.table.time"), sortable: true },
		{ key: "actor", label: t("auditLog.table.actor"), sortable: true },
		{ key: "action", label: t("auditLog.table.action"), sortable: true },
		{ key: "targetType", label: t("auditLog.table.targetType"), sortable: true },
		{ key: "summary", label: t("auditLog.table.summary") },
		{ key: "details", label: t("auditLog.table.details") },
	];

	return (
		<div className="hidden overflow-x-auto md:block">
			<Table>
				<TableHeader>
					<TableRow>
						{headers.map((header) => (
							<TableHead key={header.key}>
								{header.sortable ? (
									<Button type="button" variant="ghost" className="-ms-3 h-auto px-3 py-2" onClick={() => onSort(header.key as AuditSortField)}>
										{header.label}{sortBy === header.key ? sortDir === "asc" ? " ↑" : " ↓" : null}
									</Button>
								) : header.label}
							</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{items.map((entry) => <AuditLogRow key={entry.id} entry={entry} onViewDetails={onViewDetails} />)}
					{items.length === 0 ? <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{t("auditLog.empty.title")}</TableCell></TableRow> : null}
				</TableBody>
			</Table>
		</div>
	);
}
