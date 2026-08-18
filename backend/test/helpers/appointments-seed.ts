export function buildAppointmentSeed(overrides: Partial<{ cancellationReason: string | null }> = {}) {
  return {
    id: 'appointment-seed-id',
    doctorProfileId: 'doctor-seed-id',
    patientUserId: 'patient-seed-id',
    startTime: new Date('2026-05-01T08:00:00.000Z'),
    endTime: new Date('2026-05-01T08:30:00.000Z'),
    status: 'PENDING' as const,
    idempotencyKey: '123e4567-e89b-42d3-a456-426614174000',
    cancellationReason: overrides.cancellationReason ?? null,
    notes: null,
    createdAt: new Date('2026-05-01T07:00:00.000Z'),
    updatedAt: new Date('2026-05-01T07:00:00.000Z'),
  };
}
