import type {
  StaffPatientSearchDTO,
  StaffPatientDetailDTO,
  PatientHistoryAppointmentDTO,
  PaginatedResponse,
} from "@/types";

export function buildStaffPatientSearchDTO(
  overrides: Partial<StaffPatientSearchDTO> = {}
): StaffPatientSearchDTO {
  return {
    id: "patient-1",
    firstName: "Sara",
    lastName: "Ali",
    email: "sara@example.com",
    phone: "+9647001234567",
    dateOfBirth: "1990-03-15",
    isActive: true,
    lastAppointmentAt: "2026-04-20T09:00:00Z",
    nextAppointmentAt: "2026-05-15T11:00:00Z",
    ...overrides,
  };
}

export function buildStaffPatientDetailDTO(
  overrides: Partial<StaffPatientDetailDTO> = {}
): StaffPatientDetailDTO {
  return {
    ...buildStaffPatientSearchDTO(overrides as Partial<StaffPatientSearchDTO>),
    languagePreference: "ar",
    createdAt: "2025-01-10T08:30:00Z",
    notes: null,
    ...overrides,
  };
}

export function buildPatientHistoryAppointmentDTO(
  overrides: Partial<PatientHistoryAppointmentDTO> = {}
): PatientHistoryAppointmentDTO {
  return {
    id: "history-1",
    patientId: "patient-1",
    startsAt: "2026-04-20T09:00:00Z",
    endsAt: "2026-04-20T09:30:00Z",
    status: "COMPLETED",
    needsFollowUp: false,
    doctor: {
      id: "doctor-1",
      firstName: "Khalid",
      lastName: "Mansour",
      specialization: "General Dentistry",
    },
    ...overrides,
  };
}

export function buildPaginatedResponse<T>(
  data: T[],
  overrides: Partial<Omit<PaginatedResponse<T>, "data">> = {}
): PaginatedResponse<T> {
  return {
    data,
    total: data.length,
    page: 1,
    pageSize: 10,
    ...overrides,
  };
}

export function buildEmptyPaginatedResponse<T>(
  overrides: Partial<Omit<PaginatedResponse<T>, "data">> = {}
): PaginatedResponse<T> {
  return {
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
    ...overrides,
  };
}

export const patientSearchFixtures = {
  singleResult: buildStaffPatientSearchDTO(),
  inactivePatient: buildStaffPatientSearchDTO({
    id: "patient-2",
    firstName: "Ahmed",
    lastName: "Mohammed",
    isActive: false,
    email: null,
    phone: null,
    dateOfBirth: null,
    lastAppointmentAt: null,
    nextAppointmentAt: null,
  }),
  withNullFields: buildStaffPatientSearchDTO({
    id: "patient-3",
    email: null,
    phone: null,
    dateOfBirth: null,
    lastAppointmentAt: null,
    nextAppointmentAt: null,
  }),
  list: [
    buildStaffPatientSearchDTO(),
    buildStaffPatientSearchDTO({
      id: "patient-2",
      firstName: "Ahmed",
      lastName: "Mohammed",
      email: "ahmed@example.com",
      phone: "+9647009876543",
    }),
    buildStaffPatientSearchDTO({
      id: "patient-3",
      firstName: "Layla",
      lastName: "Hussein",
      isActive: false,
    }),
  ],
};

export const patientDetailFixtures = {
  default: buildStaffPatientDetailDTO(),
  missingFields: buildStaffPatientDetailDTO({
    email: null,
    phone: null,
    dateOfBirth: null,
    languagePreference: null,
    lastAppointmentAt: null,
    nextAppointmentAt: null,
  }),
};

export const historyFixtures = {
  single: buildPatientHistoryAppointmentDTO(),
  multiple: [
    buildPatientHistoryAppointmentDTO(),
    buildPatientHistoryAppointmentDTO({
      id: "history-2",
      startsAt: "2026-03-15T14:00:00Z",
      endsAt: "2026-03-15T14:30:00Z",
      status: "CANCELED",
      doctor: {
        id: "doctor-2",
        firstName: "Noor",
        lastName: "Hadi",
        specialization: "Orthodontics",
      },
    }),
    buildPatientHistoryAppointmentDTO({
      id: "history-3",
      startsAt: "2026-02-10T08:00:00Z",
      endsAt: "2026-02-10T09:00:00Z",
      status: "COMPLETED",
    }),
  ],
};

export const forbiddenError = new Error("Request failed with status code 403");
