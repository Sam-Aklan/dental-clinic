export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'PATIENT';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  doctorProfileId?: string | null;
  patientProfileId?: string | null;
}
