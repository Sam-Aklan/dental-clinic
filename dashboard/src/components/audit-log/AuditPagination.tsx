import { Button } from "@/components/ui/button";
import { AUDIT_PAGE_SIZE_OPTIONS } from "@/constants/audit-log";
import type { AuditLogUrlState } from "@/types";
import { useTranslation } from "react-i18next";

type Props = {
	value: AuditLogUrlState;
	totalPages: number;
	onPageChange: (page: number) => void;
	onPageSizeChange: (pageSize: AuditLogUrlState["pageSize"]) => void;
};

export function AuditPagination({ value, totalPages, onPageChange, onPageSizeChange }: Props) {
	const { t } = useTranslation();

	return (
		<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 text-sm">
			<label className="flex items-center gap-2">
				<span>{t("auditLog.pagination.pageSize")}</span>
				<select aria-label={t("auditLog.pagination.pageSize")} className="h-9 rounded-md border border-input bg-background px-3" value={value.pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value) as AuditLogUrlState["pageSize"]) }>
					{AUDIT_PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
				</select>
			</label>
			<p aria-live="polite">{t("auditLog.pagination.pageInfo", { page: value.page, totalPages })}</p>
			<div className="flex items-center gap-2">
				<Button type="button" variant="outline" aria-label={`${t("auditLog.actions.previous")} · ${t("auditLog.pagination.pageInfo", { page: value.page, totalPages })}`} disabled={value.page <= 1} onClick={() => onPageChange(value.page - 1)}>{t("auditLog.actions.previous")}</Button>
				<Button type="button" variant="outline" aria-label={`${t("auditLog.actions.next")} · ${t("auditLog.pagination.pageInfo", { page: value.page, totalPages })}`} disabled={value.page >= totalPages} onClick={() => onPageChange(value.page + 1)}>{t("auditLog.actions.next")}</Button>
			</div>
		</div>
	);
}
