import type { AppointmentStatus } from "./appointments";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pastCount?: number;
  upcomingCount?: number;
}

export interface StaffPatientSearchDTO {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  isActive: boolean;
  lastAppointmentAt: string | null;
  nextAppointmentAt: string | null;
}

export interface StaffPatientDetailDTO extends StaffPatientSearchDTO {
  languagePreference: "en" | "ar" | null;
  createdAt: string | null;
  notes?: string | null;
}

export interface PatientHistoryAppointmentDTO {
  id: string;
  patientId: string;
	startsAt: string;
	endsAt: string;
	status: AppointmentStatus;
	needsFollowUp: boolean;
  notes?: string | null;
  cancellationReason?: string | null;
	doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string | null;
  };
}

export interface PatientSearchFilters {
  q: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PatientHistoryFilters {
  patientId: string;
  patientName?: string;
  from?: string;
  to?: string;
  status?: AppointmentStatus[];
  page?: number;
  pageSize?: number;
}

export interface PatientPageUrlState {
  q: string;
  patientId?: string;
  status: AppointmentStatus[];
  from?: string;
  to?: string;
  page: number;
}
