import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PatientHistoryAppointmentDTO, PaginatedResponse, AppointmentStatus } from "@/types";
import { RotateCcw, ChevronLeft, ChevronRight, ChevronDown, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { dateRangeSchema } from "@/lib/patients";

interface PatientAppointmentHistoryTableProps {
  history: PaginatedResponse<PatientHistoryAppointmentDTO> | undefined;
  isLoading: boolean;
  isError: boolean;
  statusFilter: AppointmentStatus[];
  fromDate: string | undefined;
  toDate: string | undefined;
  page: number;
  onStatusChange: (status: AppointmentStatus[]) => void;
  onFromDateChange: (from: string | undefined) => void;
  onToDateChange: (to: string | undefined) => void;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
}

const STATUS_OPTIONS: AppointmentStatus[] = [
  "PENDING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELED",
  "NO_SHOW",
];

function getStatusVariant(status: AppointmentStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "CONFIRMED":
      return "secondary";
    case "PENDING":
      return "outline";
    case "IN_PROGRESS":
      return "outline";
    case "CANCELED":
      return "destructive";
    case "NO_SHOW":
      return "destructive";
    default:
      return "outline";
  }
}

function formatDuration(startsAt: string, endsAt: string): number {
  return Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60000);
}

function parseFilterDate(value: string | undefined) {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatFilterDate(value: string | undefined, locale?: string) {
  const date = parseFilterDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function toFilterDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function PatientAppointmentHistoryTable({
  history,
  isLoading,
  isError,
  statusFilter,
  fromDate,
  toDate,
  page,
  onStatusChange,
  onFromDateChange,
  onToDateChange,
  onPageChange,
  onClearFilters,
}: PatientAppointmentHistoryTableProps) {
  const { t, i18n } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  const totalPages = history ? Math.ceil(history.total / history.pageSize) : 0;
  const hasFilters = statusFilter.length > 0 || Boolean(fromDate) || Boolean(toDate);

  const { watch, setValue, reset } = useForm({
    defaultValues: {
      fromDate: fromDate || "",
      toDate: toDate || "",
    },
  });

  React.useEffect(() => {
    reset({
      fromDate: fromDate || "",
      toDate: toDate || "",
    });
  }, [fromDate, toDate, reset]);

  const watchedFromDate = watch("fromDate");
  const watchedToDate = watch("toDate");

  const validationResult = dateRangeSchema.safeParse({
    fromDate: watchedFromDate || undefined,
    toDate: watchedToDate || undefined,
  });
  const validationError = !validationResult.success
    ? t("staffPatients.history.invalidDateRange")
    : null;

  const handleFromDateChange = (val: string | undefined) => {
    setValue("fromDate", val || "");
    
    const proposedFrom = val || undefined;
    const currentTo = watchedToDate || undefined;
    
    const result = dateRangeSchema.safeParse({
      fromDate: proposedFrom,
      toDate: currentTo,
    });
    
    if (result.success) {
      onFromDateChange(proposedFrom);
      if (currentTo !== toDate) {
        onToDateChange(currentTo);
      }
    }
  };

  const handleToDateChange = (val: string | undefined) => {
    setValue("toDate", val || "");
    
    const currentFrom = watchedFromDate || undefined;
    const proposedTo = val || undefined;
    
    const result = dateRangeSchema.safeParse({
      fromDate: currentFrom,
      toDate: proposedTo,
    });
    
    if (result.success) {
      onToDateChange(proposedTo);
      if (currentFrom !== fromDate) {
        onFromDateChange(currentFrom);
      }
    }
  };

  const toggleStatus = (status: AppointmentStatus) => {
    if (statusFilter.includes(status)) {
      onStatusChange(statusFilter.filter((s) => s !== status));
    } else {
      onStatusChange([...statusFilter, status]);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{t("staffPatients.history.title")}</h2>
        {hasFilters && (
          <Button type="button" variant="ghost" size="sm" onClick={onClearFilters}>
            <RotateCcw className="size-3 me-1" />
            {t("staffPatients.history.filters.clearFilters")}
          </Button>
        )}
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="flex flex-wrap gap-2 mb-4"
        aria-label={t("staffPatients.history.filters.label")}
      >
        <span className="text-xs text-muted-foreground self-center">
          {t("staffPatients.history.filters.status")}:
        </span>
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => toggleStatus(status)}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              statusFilter.includes(status)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {t(`staffPatients.status.${status}`)}
          </button>
        ))}

        <span className="text-xs text-muted-foreground self-center ms-2">
          {t("staffPatients.history.filters.fromDate")}:
        </span>
        <Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-7 text-xs font-normal justify-between min-w-[110px] px-2 bg-background border border-border hover:bg-muted/50",
                !watchedFromDate && "text-muted-foreground"
              )}
            >
              <span className="truncate">
                {formatFilterDate(watchedFromDate || undefined, i18n.language) ||
                  t("staffPatients.history.filters.fromDate")}
              </span>
              <CalendarIcon className="ms-1 size-3 text-muted-foreground shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parseFilterDate(watchedFromDate || undefined)}
              onSelect={(date) => {
                handleFromDateChange(date ? toFilterDateValue(date) : undefined);
                setIsFromOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        <span className="text-xs text-muted-foreground self-center">
          {t("staffPatients.history.filters.toDate")}:
        </span>
        <Popover open={isToOpen} onOpenChange={setIsToOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-7 text-xs font-normal justify-between min-w-[110px] px-2 bg-background border border-border hover:bg-muted/50",
                !watchedToDate && "text-muted-foreground"
              )}
            >
              <span className="truncate">
                {formatFilterDate(watchedToDate || undefined, i18n.language) ||
                  t("staffPatients.history.filters.toDate")}
              </span>
              <CalendarIcon className="ms-1 size-3 text-muted-foreground shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={parseFilterDate(watchedToDate || undefined)}
              onSelect={(date) => {
                handleToDateChange(date ? toFilterDateValue(date) : undefined);
                setIsToOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </form>

      {validationError && (
        <p className="text-xs text-destructive mb-4 font-medium text-start" role="alert">
          {validationError}
        </p>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="text-center py-6">
          <p className="text-sm text-destructive">{t("staffPatients.history.error")}</p>
          <Button variant="outline" size="sm" className="mt-2">
            {t("staffPatients.history.retry")}
          </Button>
        </div>
      )}

      {!isLoading && !isError && history && history.data.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? t("staffPatients.history.filteredZero")
              : t("staffPatients.history.empty")}
          </p>
        </div>
      )}

      {!isLoading && !isError && history && history.data.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" aria-label={t("staffPatients.history.clickToExpand")}></TableHead>
                  <TableHead>{t("staffPatients.history.columns.date")}</TableHead>
                  <TableHead>{t("staffPatients.history.columns.time")}</TableHead>
                  <TableHead>{t("staffPatients.history.columns.duration")}</TableHead>
                  <TableHead>{t("staffPatients.history.columns.doctor")}</TableHead>
                  <TableHead>{t("staffPatients.history.columns.info")}</TableHead>
                  <TableHead className="text-end">{t("staffPatients.history.columns.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.data.map((appt) => {
                  const doctorName = appt.doctor
                    ? `Dr. ${appt.doctor.firstName} ${appt.doctor.lastName}`
                    : t("staffPatients.history.columns.noDoctor");
                  const isExpanded = expandedId === appt.id;

                  return (
                    <React.Fragment key={appt.id}>
                      <TableRow
                        onClick={() => setExpandedId(isExpanded ? null : appt.id)}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        aria-expanded={isExpanded}
                      >
                        <TableCell className="text-xs w-10">
                          {isExpanded ? (
                            <ChevronDown className="size-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(appt.startsAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(appt.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                        <TableCell className="text-xs">
                          {t("staffPatients.history.columns.durationMinutes", { minutes: formatDuration(appt.startsAt, appt.endsAt) })}
                        </TableCell>
                        <TableCell className="text-xs">{doctorName}</TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate text-muted-foreground">
                          {appt.notes ? (
                            appt.notes.length > 30 ? appt.notes.substring(0, 30) + "..." : appt.notes
                          ) : appt.cancellationReason ? (
                            `${t("staffPatients.history.cancellationReason")}: ${appt.cancellationReason.length > 20 ? appt.cancellationReason.substring(0, 20) + "..." : appt.cancellationReason}`
                          ) : appt.needsFollowUp ? (
                            <span className="text-primary font-medium">{t("staffPatients.history.needsFollowUp")}</span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-end">
                          <Badge variant={getStatusVariant(appt.status)}>
                            {t(`staffPatients.status.${appt.status}`)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={7} className="p-4">
                            <div className="grid gap-3 text-xs text-start">
                              <div className="flex flex-wrap items-center gap-2">
                                {appt.needsFollowUp && (
                                  <Badge variant="outline" className="text-primary border-primary bg-primary/5">
                                    {t("staffPatients.history.needsFollowUp")}
                                  </Badge>
                                )}
                                {appt.doctor?.specialization && (
                                  <span className="text-xs text-muted-foreground">
                                    {appt.doctor.specialization}
                                  </span>
                                )}
                              </div>
                              {appt.notes && (
                                <div>
                                  <h4 className="font-semibold text-muted-foreground">{t("staffPatients.history.notes")}</h4>
                                  <p className="mt-1 bg-background p-2 rounded border">{appt.notes}</p>
                                </div>
                              )}
                              {appt.cancellationReason && (
                                <div>
                                  <h4 className="font-semibold text-destructive">{t("staffPatients.history.cancellationReason")}</h4>
                                  <p className="mt-1 bg-destructive/5 text-destructive p-2 rounded border border-destructive/20">{appt.cancellationReason}</p>
                                </div>
                              )}
                              {!appt.notes && !appt.cancellationReason && !appt.needsFollowUp && (
                                <p className="text-muted-foreground">{t("staffPatients.history.noDetails")}</p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                {t("staffPatients.pagination.page", { page, totalPages })}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  aria-label={t("staffPatients.pagination.previous")}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  aria-label={t("staffPatients.pagination.next")}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
