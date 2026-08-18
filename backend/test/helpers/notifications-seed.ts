export function createNotificationPatientSeed(overrides: Record<string, unknown> = {}) {
  return {
    id: 'patient-user-1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'patient@example.com',
    preferredLocale: 'EN',
    ...overrides,
  };
}

export function createNotificationDoctorSeed(overrides: Record<string, unknown> = {}) {
  const userOverrides = (overrides.user as Record<string, unknown> | undefined) ?? {};

  return {
    id: 'doctor-profile-1',
    user: {
      id: 'doctor-user-1',
      firstName: 'Doc',
      lastName: 'Tor',
      email: 'doctor@example.com',
      preferredLocale: 'EN',
      ...userOverrides,
    },
    ...overrides,
  };
}

export function createNotificationAppointmentSeed(overrides: Record<string, unknown> = {}) {
  return {
    id: 'appointment-1',
    doctorProfileId: 'doctor-profile-1',
    patientUserId: 'patient-user-1',
    startTime: new Date('2026-05-19T10:00:00.000Z'),
    status: 'CONFIRMED',
    doctorProfile: createNotificationDoctorSeed(),
    patient: createNotificationPatientSeed(),
    ...overrides,
  };
}

export function createNotificationWaitlistOfferSeed(overrides: Record<string, unknown> = {}) {
  return {
    id: 'offer-1',
    patientProfileId: 'patient-profile-1',
    doctorProfileId: 'doctor-profile-1',
    offeredStartsAt: new Date('2026-05-19T10:00:00.000Z'),
    offeredEndsAt: new Date('2026-05-19T10:30:00.000Z'),
    expiresAt: new Date('2026-05-19T10:20:00.000Z'),
    status: 'PENDING',
    patientProfile: { user: createNotificationPatientSeed() },
    doctorProfile: createNotificationDoctorSeed(),
    ...overrides,
  };
}
