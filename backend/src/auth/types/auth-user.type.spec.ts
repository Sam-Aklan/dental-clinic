import { sanitizeUser, sanitizeUserSelect } from './auth-user.type';

describe('auth-user.type', () => {
  it('selects the doctor profile id in the session query', () => {
    expect(sanitizeUserSelect()).toEqual({
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      preferredLocale: true,
      isActive: true,
      doctorProfile: { select: { id: true } },
    });
  });

  it('maps the doctor profile id when present and null otherwise', () => {
    expect(
      sanitizeUser({
        id: 'user-1',
        email: 'doctor@example.com',
        firstName: 'Doctor',
        lastName: 'One',
        role: 'DOCTOR',
        preferredLocale: 'EN',
        isActive: true,
        doctorProfile: { id: 'doctor-1' },
      }),
    ).toEqual({
      id: 'user-1',
      email: 'doctor@example.com',
      firstName: 'Doctor',
      lastName: 'One',
      role: 'DOCTOR',
      preferredLocale: 'EN',
      isActive: true,
      doctorProfileId: 'doctor-1',
    });

    expect(
      sanitizeUser({
        id: 'user-2',
        email: 'patient@example.com',
        firstName: 'Patient',
        lastName: 'Two',
        role: 'PATIENT',
        preferredLocale: 'AR',
        isActive: true,
      }),
    ).toEqual({
      id: 'user-2',
      email: 'patient@example.com',
      firstName: 'Patient',
      lastName: 'Two',
      role: 'PATIENT',
      preferredLocale: 'AR',
      isActive: true,
      doctorProfileId: null,
    });
  });
});
