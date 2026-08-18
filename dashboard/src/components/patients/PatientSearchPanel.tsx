import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PatientResultCard } from "./PatientResultCard";
import type { StaffPatientSearchDTO, PaginatedResponse } from "@/types";
import { Search, RotateCcw } from "lucide-react";

interface PatientSearchPanelProps {
  q: string;
  debouncedQ: string;
  searchResult: PaginatedResponse<StaffPatientSearchDTO> | undefined;
  isLoading: boolean;
  isError: boolean;
  isForbidden: boolean;
  selectedPatientId: string | undefined;
  hasMinChars: boolean;
  onQChange: (q: string) => void;
  onSelectPatient: (patientId: string) => void;
  onReset: () => void;
}

export function PatientSearchPanel({
  q,
  searchResult,
  isLoading,
  isError,
  isForbidden,
  selectedPatientId,
  hasMinChars,
  onQChange,
  onSelectPatient,
  onReset,
}: PatientSearchPanelProps) {
  const { t } = useTranslation();
  const resultData = Array.isArray(searchResult?.data) ? searchResult.data : [];

  const showGuidance = q.trim().length === 0;
  const showMinCharsHint = !showGuidance && !hasMinChars;
  const showResults = hasMinChars && !isLoading && !isError && !isForbidden && searchResult;
  const showNoResults = hasMinChars && !isLoading && !isError && !isForbidden && searchResult && resultData.length === 0;
  const showSearchActive = q.trim().length > 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t("staffPatients.searchPlaceholder")}
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            aria-label={t("staffPatients.searchAriaLabel")}
            className="ps-9"
          />
        </div>
        {showSearchActive && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onReset}
            aria-label={t("staffPatients.reset")}
          >
            <RotateCcw className="size-4" />
          </Button>
        )}
      </div>

      {!showSearchActive && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-muted/30 rounded-lg">
          <Search className="size-8 text-muted-foreground mb-3" />
          <h2 className="text-lg font-medium">{t("staffPatients.guidance.title")}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("staffPatients.guidance.description")}
          </p>
        </div>
      )}

      {showMinCharsHint && (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t("staffPatients.guidance.description")}
        </p>
      )}

      {isLoading && (
        <div className="space-y-3" aria-label={t("staffPatients.loading.results")}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="text-center py-8 px-4">
          <p className="text-sm text-destructive">{t("staffPatients.genericError")}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onReset}>
            <RotateCcw className="size-3 me-1" />
            {t("staffPatients.reset")}
          </Button>
        </div>
      )}

      {isForbidden && (
        <div className="text-center py-8 px-4">
          <p className="text-sm text-muted-foreground">{t("staffPatients.forbidden")}</p>
        </div>
      )}

      {showNoResults && (
        <div className="text-center py-8 px-4">
          <p className="text-sm text-muted-foreground">{t("staffPatients.searchResults.noResults")}</p>
        </div>
      )}

      {showResults && searchResult && (
        <>
          <p
            className="text-sm text-muted-foreground"
            aria-live="polite"
            aria-label={t("staffPatients.resultCountAriaLabel", { count: searchResult.total })}
          >
            {t("staffPatients.resultCount", { count: searchResult.total })}
          </p>
          <div className="space-y-2" role="listbox" aria-label={t("staffPatients.searchResults.label")}>
            {resultData.map((patient) => (
              <PatientResultCard
                key={patient.id}
                patient={patient}
                isSelected={selectedPatientId === patient.id}
                onSelect={() => onSelectPatient(patient.id)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
