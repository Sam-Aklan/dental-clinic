import { Locale } from '../../generated/prisma/enums';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  preferredLocale: string;
  isActive: boolean;
  doctorProfileId?: string | null;
}

export interface AuthTokensResponse {
  accessToken: string;
  user: AuthUser;
}

export function sanitizeUserSelect() {
  return {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    preferredLocale: true,
    isActive: true,
    doctorProfile: { select: { id: true } },
  } as const;
}

export function sanitizeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  preferredLocale: string;
  isActive: boolean;
  doctorProfile?: { id: string } | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    preferredLocale: user.preferredLocale,
    isActive: user.isActive,
    doctorProfileId: user.doctorProfile?.id ?? null,
  };
}
