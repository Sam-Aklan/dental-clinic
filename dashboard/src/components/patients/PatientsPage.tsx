import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { useDebounce } from "@/hooks/shared";
import { usePatientSearchQuery, usePatientDetailQuery, usePatientHistoryQuery } from "@/hooks/patients";
import { groupAppointmentsByTab } from "@/lib/appointments/helpers";
import { PatientSearchPanel } from "./PatientSearchPanel";
import { PatientDetailsPanel } from "./PatientDetailsPanel";
import { PatientAppointmentHistoryTable } from "./PatientAppointmentHistoryTable";
import { dateRangeSchema } from "@/lib/patients";
import type { PatientPageUrlState, StaffPatientDetailDTO, PatientAppointment } from "@/types";

interface PatientsPageProps {
  search: PatientPageUrlState;
  onUpdateSearch: (patch: Partial<PatientPageUrlState>) => void;
  onResetSearch: () => void;
}

export function PatientsPage({ search, onUpdateSearch, onResetSearch }: PatientsPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const debouncedQ = useDebounce(search.q, 300);
  const hasMinChars = debouncedQ.trim().length >= 2;

  const searchQuery = usePatientSearchQuery({
    q: debouncedQ,
    isActive: undefined,
    page: search.page,
    pageSize: 15,
  });

  const selectedSearchPatient = searchQuery.data?.data.find((patient) => patient.id === search.patientId);
  const shouldFetchDetail = true;

  const detailQuery = usePatientDetailQuery(shouldFetchDetail ? (search.patientId ?? "") : "");
  console.log("detail query data:",detailQuery.data)

  const isDateRangeInvalid = !dateRangeSchema.safeParse({ fromDate: search.from, toDate: search.to }).success;

  const historyQuery = usePatientHistoryQuery({
    patientId: search.patientId ?? "",
    from: isDateRangeInvalid ? undefined : search.from,
    to: isDateRangeInvalid ? undefined : search.to,
    status: search.status.length > 0 ? search.status : undefined,
    page: search.page,
    pageSize: 5,
  });

  // const allAppointmentsQuery = usePatientHistoryQuery({
  //   patientId: search.patientId ?? "",
  //   page: 1,
  //   pageSize: 100,
  // });

  const allAppointments = historyQuery.data?.data ?? [];
  const referenceNow = new Date();
  const groupedAppointments = groupAppointmentsByTab(allAppointments as unknown as PatientAppointment[], referenceNow);
  const pastCount = historyQuery.data?.pastCount ?? groupedAppointments.past.length;
  const upcomingCount = historyQuery.data?.upcomingCount ?? groupedAppointments.upcoming.length;
  const isLoadingCounts = historyQuery.isLoading;

  const handleQChange = (q: string) => {
    onUpdateSearch({ q, page: 1 });
  };

  const handleSelectPatient = (patientId: string) => {
    onUpdateSearch({ patientId, page: 1 });
  };

  const handleUpdateHistoryFilters = (patch: Partial<PatientPageUrlState>) => {
    onUpdateSearch({ ...patch, page: 1 });
  };

  const handleHistoryPageChange = (page: number) => {
    onUpdateSearch({ page });
  };

  const isForbidden = searchQuery.isError && (searchQuery.error as Error)?.message?.includes("403");

  const hasSelection = Boolean(search.patientId);
  const detailError = detailQuery.isError && !detailQuery.isLoading;
  const detailNotFound = detailError && (detailQuery.error as Error)?.message?.includes("404");
  const selectedPatientDetail: StaffPatientDetailDTO | null = selectedSearchPatient
    ? {
        ...selectedSearchPatient,
        languagePreference: null,
        createdAt: null,
        notes: null,
      }
    : null;

  if (detailNotFound && search.patientId) {
    onUpdateSearch({ patientId: undefined });
  }

  const handleBookPatient = (patientId: string) => {
    navigate({ to: "/staff/walk-in", search: { patientId } });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 md:p-6">
      <div className="w-full md:w-80 lg:w-96 shrink-0">
        <PatientSearchPanel
          q={search.q}
          debouncedQ={debouncedQ}
          searchResult={searchQuery.data}
          isLoading={searchQuery.isLoading && hasMinChars}
          isError={searchQuery.isError && !isForbidden}
          isForbidden={isForbidden}
          selectedPatientId={search.patientId}
          hasMinChars={hasMinChars}
          onQChange={handleQChange}
          onSelectPatient={handleSelectPatient}
          onReset={onResetSearch}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col gap-6">
        <h1 className="text-2xl font-semibold">{t("staffPatients.title")}</h1>
        <PatientDetailsPanel
          patient={shouldFetchDetail ? (detailQuery.data ?? selectedPatientDetail) : selectedPatientDetail}
          isLoading={shouldFetchDetail ? detailQuery.isLoading : false}
          isError={shouldFetchDetail ? detailError && !selectedPatientDetail : false}
          isNotFound={detailNotFound}
          hasSelection={hasSelection}
          selectedPatientId={search.patientId}
          onBookPatient={handleBookPatient}
          pastCount={pastCount}
          upcomingCount={upcomingCount}
          isLoadingCounts={isLoadingCounts}
        />
        {hasSelection && (
          <PatientAppointmentHistoryTable
            history={historyQuery.data}
            isLoading={historyQuery.isLoading}
            isError={historyQuery.isError}
            statusFilter={search.status}
            fromDate={search.from}
            toDate={search.to}
            page={search.page}
            onStatusChange={(status) => handleUpdateHistoryFilters({ status })}
            onFromDateChange={(from) => handleUpdateHistoryFilters({ from })}
            onToDateChange={(to) => handleUpdateHistoryFilters({ to })}
            onPageChange={handleHistoryPageChange}
            onClearFilters={() => onUpdateSearch({ status: [], from: undefined, to: undefined, page: 1 })}
          />
        )}
      </div>
    </div>
  );
}
