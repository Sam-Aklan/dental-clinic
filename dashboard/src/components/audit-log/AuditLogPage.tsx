import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuditDetailsSheet } from "./AuditDetailsSheet";
import { AuditFiltersBar } from "./AuditFiltersBar";
import { AuditLogCards } from "./AuditLogCards";
import { AuditLogSkeleton } from "./AuditLogSkeleton";
import { AuditLogTable } from "./AuditLogTable";
import { AuditPagination } from "./AuditPagination";
import { useAuditLogQuery, useAuditLogUrlState } from "@/hooks/audit-log";
import { useTranslation } from "react-i18next";
import { CLINIC_TIMEZONE } from "@/constants";
import type { AuditLogEntry } from "@/types";

export function AuditLogPage() {
	const { t } = useTranslation();
	const { search, setSearch, setPage, setPageSize, setSort, reset } = useAuditLogUrlState(CLINIC_TIMEZONE);
	const query = useAuditLogQuery(search);
	const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

	const items = query.data?.items ?? [];
	const totalPages = query.data?.totalPages ?? 1;
	const isInitialLoading = query.isLoading && items.length === 0;
	const hasRows = items.length > 0;
	const showInlineError = query.isError && hasRows;
	const showEmptyState = !isInitialLoading && !query.isError && !hasRows;
	const showRefetching = query.isFetching && hasRows;

	const header = useMemo(() => ({
		title: t("auditLog.page.title"),
		subtitle: t("auditLog.page.subtitle"),
	}), [t]);

	return (
		<section className="flex flex-col gap-6">
			<header className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold">{header.title}</h1>
					<p className="text-sm text-muted-foreground">{header.subtitle}</p>
				</div>
				<Button type="button" variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}>{t("auditLog.actions.refresh")}</Button>
			</header>

			<AuditFiltersBar value={search} onChange={(patch) => setSearch({ ...patch })} onReset={reset} />

			{showInlineError ? (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="space-y-1">
							<p className="font-medium">{t("auditLog.error.title")}</p>
							<p className="text-destructive/90">{t("auditLog.error.description")}</p>
						</div>
						<div className="flex items-center gap-2">
							<Button type="button" variant="outline" onClick={() => query.refetch()}>{t("auditLog.actions.retry")}</Button>
							<Button type="button" variant="ghost" onClick={() => query.refetch()}>{t("auditLog.actions.refresh")}</Button>
						</div>
					</div>
				</div>
			) : null}

			{showRefetching ? <p className="text-xs text-muted-foreground">{t("auditLog.status.refreshing")}</p> : null}

			{isInitialLoading ? <AuditLogSkeleton /> : !hasRows && query.isError ? (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive" role="alert">
					<div className="space-y-4">
						<div className="space-y-1">
							<p className="font-medium">{t("auditLog.error.title")}</p>
							<p className="text-destructive/90">{t("auditLog.error.description")}</p>
						</div>
						<Button type="button" variant="outline" onClick={() => query.refetch()}>{t("auditLog.actions.retry")}</Button>
					</div>
				</div>
			) : (
				<div className="space-y-4 rounded-lg border bg-card p-4">
					{showEmptyState ? (
						<div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-6 text-sm">
							<div className="space-y-1">
								<p className="font-medium">{t("auditLog.empty.title")}</p>
								<p className="text-muted-foreground">{t("auditLog.empty.description")}</p>
							</div>
							<div className="flex flex-wrap gap-2">
								<Button type="button" variant="outline" onClick={() => reset()}>{t("auditLog.actions.reset")}</Button>
								<Button type="button" variant="ghost" onClick={() => query.refetch()}>{t("auditLog.actions.refresh")}</Button>
							</div>
						</div>
					) : null}
					{hasRows ? (
						<>
							<AuditLogTable items={items} sortBy={search.sortBy} sortDir={search.sortDir} onSort={(field) => setSort(field, search.sortBy === field && search.sortDir === "asc" ? "desc" : "asc")} onViewDetails={setSelectedEntry} />
							<AuditLogCards items={items} onViewDetails={setSelectedEntry} />
						</>
					) : null}
				</div>
			)}

			<AuditPagination value={search} totalPages={totalPages} onPageChange={setPage} onPageSizeChange={setPageSize} />
			<AuditDetailsSheet entry={selectedEntry} open={selectedEntry !== null} onOpenChange={(open) => !open && setSelectedEntry(null)} />
		</section>
	);
}
