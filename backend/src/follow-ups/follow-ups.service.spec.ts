import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { AppointmentStatus, FollowUpStatus, Locale, Role } from '../generated/prisma/enums';
import { FollowUpsService } from './follow-ups.service';

describe('FollowUpsService', () => {
  beforeAll(() => {
    jest.useFakeTimers({ now: new Date('2026-06-15T08:00:00.000Z') });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const createService = () => {
    const prisma = {
      appointment: { findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
      followUp: { findUnique: jest.fn(), findMany: jest.fn(), count: jest.fn(), create: jest.fn(), update: jest.fn() },
      user: { findUnique: jest.fn() },
      doctorProfile: { findUnique: jest.fn() },
      workingHour: { findMany: jest.fn() },
      holiday: { findMany: jest.fn() },
      doctorScheduleOverride: { findMany: jest.fn() },
      clinicConfig: { findFirst: jest.fn() },
      $transaction: jest.fn(async (handler: unknown) => (handler as (tx: any) => Promise<unknown>)({
        appointment: prisma.appointment,
        followUp: prisma.followUp,
      })),
    };

    const slotValidationService = {
      loadClinicConfig: jest.fn().mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 0, reminderHoursBefore: 24 }),
      ensureDoctor: jest.fn().mockResolvedValue({ id: 'doctor-id', user: { role: Role.DOCTOR } }),
      assertAvailableSlot: jest.fn().mockResolvedValue({ endsAt: new Date('2026-06-20T08:30:00.000Z') }),
    };

    const auditService = { log: jest.fn() };
    const notificationsService = { queueAppointmentConfirmation: jest.fn(), queueReminder: jest.fn() };

    return {
      service: new FollowUpsService(prisma as never, slotValidationService as never, auditService as never, notificationsService as never),
      prisma,
      slotValidationService,
      auditService,
      notificationsService,
    };
  };

  it('creates a follow-up and enqueues notifications', async () => {
    const { service, prisma, slotValidationService, notificationsService, auditService } = createService();

    prisma.user.findUnique.mockResolvedValue({ id: 'patient-id', firstName: 'Sara', lastName: 'Patient', patientProfile: { id: 'profile-id' } });
    prisma.appointment.findUnique.mockResolvedValue(null);
    prisma.appointment.findFirst.mockResolvedValue(null);
    prisma.appointment.create.mockResolvedValue({ id: 'appointment-id' });
    prisma.followUp.create.mockResolvedValue({ id: 'follow-up-id' });
    prisma.followUp.findUnique.mockResolvedValue({
      id: 'follow-up-id',
      appointmentId: 'appointment-id',
      sourceAppointmentId: null,
      patientUserId: 'patient-id',
      doctorProfileId: 'doctor-id',
      scheduledById: 'staff-id',
      status: FollowUpStatus.SCHEDULED,
      reason: 'Checkup',
      notes: null,
      cancellationReason: null,
      createdAt: new Date('2026-06-08T10:00:00.000Z'),
      updatedAt: new Date('2026-06-08T10:00:00.000Z'),
      appointment: { id: 'appointment-id', startTime: new Date('2026-06-20T08:00:00.000Z'), endTime: new Date('2026-06-20T08:30:00.000Z'), status: AppointmentStatus.CONFIRMED },
      patient: { id: 'patient-id', firstName: 'Sara', lastName: 'Patient', preferredLocale: Locale.EN },
      doctorProfile: { id: 'doctor-id', user: { firstName: 'Doc', lastName: 'Tor' } },
      scheduledBy: { id: 'staff-id', firstName: 'Staff', lastName: 'User' },
      sourceAppointment: null,
    });

    const result = await service.create(
      {
        patientId: 'patient-id',
        doctorId: 'doctor-id',
        startsAt: '2026-06-20T08:00:00.000Z',
        reason: 'Checkup',
      },
      { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST },
      '8cc8cb9d-7f68-4fc4-9155-4c7348a5363f',
    );

    expect(result.id).toBe('follow-up-id');
    expect(slotValidationService.assertAvailableSlot).toHaveBeenCalled();
    expect(notificationsService.queueAppointmentConfirmation).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalled();
  });

  it('clears the source appointment follow-up flag when scheduling a follow-up', async () => {
    const { service, prisma } = createService();

    prisma.user.findUnique.mockResolvedValue({ id: 'patient-id', firstName: 'Sara', lastName: 'Patient', patientProfile: { id: 'profile-id' } });
    prisma.appointment.findUnique
      .mockResolvedValueOnce({ id: 'source-appointment-id', patientUserId: 'patient-id', doctorProfileId: 'doctor-id' })
      .mockResolvedValueOnce(null);
    prisma.appointment.findFirst.mockResolvedValue(null);
    prisma.appointment.create.mockResolvedValue({ id: 'appointment-id' });
    prisma.appointment.update.mockResolvedValue({ id: 'source-appointment-id' });
    prisma.followUp.create.mockResolvedValue({ id: 'follow-up-id' });
    prisma.followUp.findUnique.mockResolvedValue({
      id: 'follow-up-id',
      appointmentId: 'appointment-id',
      sourceAppointmentId: 'source-appointment-id',
      patientUserId: 'patient-id',
      doctorProfileId: 'doctor-id',
      scheduledById: 'staff-id',
      status: FollowUpStatus.SCHEDULED,
      reason: 'Checkup',
      notes: null,
      cancellationReason: null,
      createdAt: new Date('2026-06-08T10:00:00.000Z'),
      updatedAt: new Date('2026-06-08T10:00:00.000Z'),
      appointment: { id: 'appointment-id', startTime: new Date('2026-06-20T08:00:00.000Z'), endTime: new Date('2026-06-20T08:30:00.000Z'), status: AppointmentStatus.CONFIRMED, needsFollowUp: false },
      patient: { id: 'patient-id', firstName: 'Sara', lastName: 'Patient', preferredLocale: Locale.EN },
      doctorProfile: { id: 'doctor-id', user: { firstName: 'Doc', lastName: 'Tor' } },
      scheduledBy: { id: 'staff-id', firstName: 'Staff', lastName: 'User' },
      sourceAppointment: { id: 'source-appointment-id', needsFollowUp: false },
    });

    await service.create(
      {
        patientId: 'patient-id',
        doctorId: 'doctor-id',
        sourceAppointmentId: 'source-appointment-id',
        startsAt: '2026-06-20T08:00:00.000Z',
        reason: 'Checkup',
      },
      { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST },
      '8cc8cb9d-7f68-4fc4-9155-4c7348a5363f',
    );

    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: 'source-appointment-id' },
      data: { needsFollowUp: false },
    });
  });

  it('returns the original follow-up on idempotency retry', async () => {
    const { service, prisma } = createService();
    prisma.user.findUnique.mockResolvedValue({ id: 'patient-id', firstName: 'Sara', lastName: 'Patient', patientProfile: { id: 'profile-id' } });
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'appointment-id',
      followUp: {
        id: 'follow-up-id',
        appointmentId: 'appointment-id',
        sourceAppointmentId: null,
        patientUserId: 'patient-id',
        doctorProfileId: 'doctor-id',
        scheduledById: 'staff-id',
        status: FollowUpStatus.SCHEDULED,
        reason: 'Checkup',
        notes: null,
        cancellationReason: null,
        createdAt: new Date('2026-06-08T10:00:00.000Z'),
        updatedAt: new Date('2026-06-08T10:00:00.000Z'),
        appointment: { id: 'appointment-id', startTime: new Date('2026-06-20T08:00:00.000Z'), endTime: new Date('2026-06-20T08:30:00.000Z'), status: AppointmentStatus.CONFIRMED },
        patient: { id: 'patient-id', firstName: 'Sara', lastName: 'Patient', preferredLocale: Locale.EN },
        doctorProfile: { id: 'doctor-id', user: { firstName: 'Doc', lastName: 'Tor' } },
        scheduledBy: { id: 'staff-id', firstName: 'Staff', lastName: 'User' },
        sourceAppointment: null,
      },
    });

    await expect(
      service.create(
        {
          patientId: 'patient-id',
          doctorId: 'doctor-id',
          startsAt: '2026-06-20T08:00:00.000Z',
          reason: 'Checkup',
        },
        { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST },
        '8cc8cb9d-7f68-4fc4-9155-4c7348a5363f',
      ),
    ).resolves.toMatchObject({ id: 'follow-up-id' });
  });

  it('rejects updates for terminal follow-ups', async () => {
    const { service, prisma } = createService();
    prisma.followUp.findUnique.mockResolvedValue({
      id: 'follow-up-id',
      appointmentId: 'appointment-id',
      sourceAppointmentId: null,
      patientUserId: 'patient-id',
      doctorProfileId: 'doctor-id',
      scheduledById: 'staff-id',
      status: FollowUpStatus.CANCELED,
      reason: 'Checkup',
      notes: null,
      cancellationReason: 'Canceled',
      createdAt: new Date('2026-06-08T10:00:00.000Z'),
      updatedAt: new Date('2026-06-08T10:00:00.000Z'),
      appointment: { id: 'appointment-id', startTime: new Date('2026-06-20T08:00:00.000Z'), endTime: new Date('2026-06-20T08:30:00.000Z'), status: AppointmentStatus.CONFIRMED },
      patient: { id: 'patient-id', firstName: 'Sara', lastName: 'Patient', preferredLocale: Locale.EN },
      doctorProfile: { id: 'doctor-id', user: { firstName: 'Doc', lastName: 'Tor' } },
      scheduledBy: { id: 'staff-id', firstName: 'Staff', lastName: 'User' },
      sourceAppointment: null,
    });

    await expect(
      service.update(
        'follow-up-id',
        { reason: 'Updated reason' },
        { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects empty updates', async () => {
    const { service, prisma } = createService();
    prisma.followUp.findUnique.mockResolvedValue({
      id: 'follow-up-id',
      appointmentId: 'appointment-id',
      sourceAppointmentId: null,
      patientUserId: 'patient-id',
      doctorProfileId: 'doctor-id',
      scheduledById: 'staff-id',
      status: FollowUpStatus.SCHEDULED,
      reason: 'Checkup',
      notes: null,
      cancellationReason: null,
      createdAt: new Date('2026-06-08T10:00:00.000Z'),
      updatedAt: new Date('2026-06-08T10:00:00.000Z'),
      appointment: { id: 'appointment-id', startTime: new Date('2026-06-20T08:00:00.000Z'), endTime: new Date('2026-06-20T08:30:00.000Z'), status: AppointmentStatus.CONFIRMED },
      patient: { id: 'patient-id', firstName: 'Sara', lastName: 'Patient', preferredLocale: Locale.EN },
      doctorProfile: { id: 'doctor-id', user: { firstName: 'Doc', lastName: 'Tor' } },
      scheduledBy: { id: 'staff-id', firstName: 'Staff', lastName: 'User' },
      sourceAppointment: null,
    });

    await expect(
      service.update(
        'follow-up-id',
        {},
        { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
