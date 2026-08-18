import type { Locale, Role } from "@/types/auth";

export interface PatientProfile {
  dateOfBirth: string | null;
}

export interface UserProfileDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  preferredLocale: Locale;
  isActive: boolean;
  patientProfile?: PatientProfile | null;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  preferredLocale?: Locale;
  phone?: string | null;
  dateOfBirth?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
