import { api } from "@/lib/axios-instance";
import qs from "qs";
import { USERS, userPath, APPOINTMENTS } from "@/lib/api-paths";
import type {
  PatientSearchFilters,
  PatientHistoryFilters,
  StaffPatientSearchDTO,
  StaffPatientDetailDTO,
  PatientHistoryAppointmentDTO,
  PaginatedResponse,
} from "@/types";

type BackendPatientDetailResponse = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  preferredLocale: "EN" | "AR";
  isActive: boolean;
  createdAt: string;
  patientProfile?: {
    dateOfBirth: string | null;
  } | null;
};

type BackendAppointmentHistoryItem = {
  id: string;
  patientId: string;
  startsAt: string;
  endsAt: string;
  status: PatientHistoryAppointmentDTO["status"];
  needsFollowUp: boolean;
  notes?: string | null;
  cancellationReason?: string | null;
  doctor: PatientHistoryAppointmentDTO["doctor"];
};

type PaginatedApiPayload<T> = {
  data?: T[];
  items?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
};

type PaginatedApiResponse<T> = {
  data?: PaginatedApiPayload<T>;
};

function normalizePaginatedResponse<T>(payload: PaginatedApiPayload<T> | undefined): PaginatedResponse<T> {
  const rows = payload?.data ?? payload?.items ?? [];

  return {
    data: rows,
    total: payload?.total ?? rows.length,
    page: payload?.page ?? 1,
    pageSize: payload?.pageSize ?? (rows.length || 1),
    pastCount: (payload as any)?.pastCount,
    upcomingCount: (payload as any)?.upcomingCount,
  };
}

function mapBackendPatientDetail(payload: BackendPatientDetailResponse): StaffPatientDetailDTO {
  return {
    id: payload.id,
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email,
    phone: payload.phone,
    dateOfBirth: payload.patientProfile?.dateOfBirth ?? null,
    isActive: payload.isActive,
    lastAppointmentAt: null,
    nextAppointmentAt: null,
    languagePreference:
      payload.preferredLocale === "EN"
        ? "en"
        : payload.preferredLocale === "AR"
          ? "ar"
          : null,
    createdAt: payload.createdAt,
    notes: null,
  };
}

function mapBackendAppointmentHistoryItem(
  item: BackendAppointmentHistoryItem
): PatientHistoryAppointmentDTO {
  return {
    id: item.id,
    patientId: item.patientId,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    status: item.status,
    needsFollowUp: item.needsFollowUp,
    notes: item.notes ?? null,
    cancellationReason: item.cancellationReason ?? null,
    doctor: item.doctor,
  };
}

export async function searchPatients(
  filters: PatientSearchFilters
): Promise<PaginatedResponse<StaffPatientSearchDTO>> {
  const response = await api.get<PaginatedApiResponse<StaffPatientSearchDTO>>(USERS, {
    params: { role: "PATIENT", ...filters },
  });

  return normalizePaginatedResponse(response.data.data);
}

export async function getStaffPatient(
  patientId: string
): Promise<StaffPatientDetailDTO> {
  const response = await api.get<{ data: BackendPatientDetailResponse }>(userPath(patientId));
  return mapBackendPatientDetail(response.data.data);
}

export async function getPatientAppointmentHistory(
  filters: PatientHistoryFilters
): Promise<PaginatedResponse<PatientHistoryAppointmentDTO>> {
  const { patientId, patientName, ...query } = filters;
  const response = await api.get<PaginatedApiResponse<BackendAppointmentHistoryItem>>(
    APPOINTMENTS,
    {
      params: {
        ...query,
        patientId,
        patientName,
      },
      paramsSerializer: (requestParams) => qs.stringify(requestParams, { arrayFormat: "repeat" }),
    }
  );

  const normalized = normalizePaginatedResponse(response.data.data);
  const mapped = normalized.data.map(mapBackendAppointmentHistoryItem);

  return {
    ...normalized,
    data: mapped,
  };
}
