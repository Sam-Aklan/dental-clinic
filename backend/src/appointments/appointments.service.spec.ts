import { ConflictException } from '@nestjs/common';
import { AppointmentStatus, Role } from '../generated/prisma/enums';
import { AppointmentsService } from './appointments.service';

describe('AppointmentsService', () => {
  const createService = () => {
    const prisma = {
      workingHour: { findMany: jest.fn() },
      holiday: { findMany: jest.fn() },
      doctorScheduleOverride: { findMany: jest.fn() },
      appointment: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), delete: jest.fn(), count: jest.fn() },
      doctorProfile: { findUnique: jest.fn() },
      clinicConfig: { findFirst: jest.fn() },
      auditLog: { create: jest.fn() },
      $transaction: jest.fn(async (handler: unknown) => (handler as (tx: any) => Promise<unknown>)({
        appointment: {
          update: jest.fn((...args) => prisma.appointment.update(...args)),
          create: jest.fn((...args) => prisma.appointment.create(...args)),
          findFirst: jest.fn((...args) => prisma.appointment.findFirst(...args)),
          delete: jest.fn((...args) => prisma.appointment.delete(...args)),
        },
        auditLog: { create: jest.fn((...args) => prisma.auditLog.create(...args)) },
      })),
    };

    const slotGenerator = { generate: jest.fn().mockReturnValue([{ doctorId: 'doctor-id', startsAt: '2026-05-01T08:00:00.000Z', endsAt: '2026-05-01T08:30:00.000Z', status: 'available' }]) };
    const slotValidationService = {
      ensureDoctor: jest.fn(async (doctorProfileId: string) => {
        const doctor = await prisma.doctorProfile.findUnique({ where: { id: doctorProfileId }, include: { user: true } });
        if (!doctor) {
          throw new Error('Doctor not found');
        }
        return doctor;
      }),
      loadClinicConfig: jest.fn(async () => {
        const config = await prisma.clinicConfig.findFirst();
        return { ...config, reminderHoursBefore: config?.reminderHoursBefore ?? 0 };
      }),
      assertAvailableSlot: jest.fn(async (doctorProfileId: string, startsAt: Date, config: { slotDurationMinutes: number; timeZone: string; minArrivalMinutes: number }) => {
        const generated = slotGenerator.generate({
          doctorProfileId,
          from: startsAt,
          to: startsAt,
          clinicConfig: config,
          workingHours: await prisma.workingHour.findMany(),
          holidays: await prisma.holiday.findMany({ where: { date: startsAt } }),
          overrides: await prisma.doctorScheduleOverride.findMany({ where: { doctorProfileId, date: startsAt } }),
          bookedStartTimes: (await prisma.appointment.findMany({ where: { doctorProfileId, startTime: startsAt, status: { not: AppointmentStatus.CANCELED } }, select: { startTime: true } })).map((row) => row.startTime),
        });
        const slot = generated.find((candidate) => candidate.startsAt === startsAt.toISOString());
        if (!slot) {
          throw new ConflictException('slot_already_booked');
        }
        return { endsAt: new Date(slot.endsAt) };
      }),
    };
    const waitlistOfferQueue = { add: jest.fn() };
    const queueService = { emitUpdated: jest.fn(), emitRemoved: jest.fn() };
    const notificationsService = {
      queueAppointmentConfirmation: jest.fn(),
      queueReminder: jest.fn(),
      queueWaitlistOffer: jest.fn(),
      queuePasswordReset: jest.fn(),
    };
    const auditService = { log: jest.fn() };

    return {
      service: new AppointmentsService(prisma as never, slotGenerator as never, slotValidationService as never, waitlistOfferQueue as never, queueService as never, notificationsService as never, auditService as never),
      prisma,
      slotGenerator,
      slotValidationService,
      waitlistOfferQueue,
      queueService,
      notificationsService,
      auditService,
    };
  };

  it('delegates slot generation', async () => {
    const { service, prisma, slotGenerator } = createService();
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-id', user: { role: Role.DOCTOR } });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 0 });
    prisma.workingHour.findMany.mockResolvedValue([]);
    prisma.holiday.findMany.mockResolvedValue([]);
    prisma.doctorScheduleOverride.findMany.mockResolvedValue([]);
    prisma.appointment.findMany.mockResolvedValue([]);

      await service.getSlots({ doctorId: 'abcdefghijklmnopqrstuvwxy', from: '2026-05-01', to: '2026-05-01' });

    expect(slotGenerator.generate).toHaveBeenCalled();
  });

  it('uses clinic timezone day bounds for single-day slot requests', async () => {
    const { service, prisma, slotGenerator } = createService();
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-id', user: { role: Role.DOCTOR } });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'Asia/Riyadh', minArrivalMinutes: 0 });
    prisma.workingHour.findMany.mockResolvedValue([]);
    prisma.holiday.findMany.mockResolvedValue([]);
    prisma.doctorScheduleOverride.findMany.mockResolvedValue([]);
    prisma.appointment.findMany.mockResolvedValue([]);

    await service.getSlots({ doctorId: 'abcdefghijklmnopqrstuvwxy', from: '2026-05-25', to: '2026-05-25' });

    expect(slotGenerator.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        from: new Date('2026-05-24T21:00:00.000Z'),
        to: new Date('2026-05-25T20:59:59.999Z'),
      }),
    );
  });

  it('passes includeReserved through to slot generation', async () => {
    const { service, prisma, slotGenerator } = createService();
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-id', user: { role: Role.DOCTOR } });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 0 });
    prisma.workingHour.findMany.mockResolvedValue([]);
    prisma.holiday.findMany.mockResolvedValue([]);
    prisma.doctorScheduleOverride.findMany.mockResolvedValue([]);
    prisma.appointment.findMany.mockResolvedValue([]);

    await service.getSlots({ doctorId: 'abcdefghijklmnopqrstuvwxy', from: '2026-05-01', to: '2026-05-01', includeReserved: true });

    expect(slotGenerator.generate).toHaveBeenCalledWith(expect.objectContaining({ includeReserved: true }));
  });

  it('bypasses minArrivalMinutes for receptionist role', async () => {
    const { service, prisma, slotGenerator } = createService();
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-id', user: { role: Role.DOCTOR } });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 15 });
    prisma.workingHour.findMany.mockResolvedValue([]);
    prisma.holiday.findMany.mockResolvedValue([]);
    prisma.doctorScheduleOverride.findMany.mockResolvedValue([]);
    prisma.appointment.findMany.mockResolvedValue([]);

    await service.getSlots(
      { doctorId: 'doctor-id', from: '2026-05-01', to: '2026-05-01' },
      { userId: 'receptionist-id', role: Role.RECEPTIONIST } as any,
    );

    expect(slotGenerator.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicConfig: expect.objectContaining({ minArrivalMinutes: 0 }),
      }),
    );
  });

  it('bypasses minArrivalMinutes for admin role', async () => {
    const { service, prisma, slotGenerator } = createService();
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-id', user: { role: Role.DOCTOR } });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 15 });
    prisma.workingHour.findMany.mockResolvedValue([]);
    prisma.holiday.findMany.mockResolvedValue([]);
    prisma.doctorScheduleOverride.findMany.mockResolvedValue([]);
    prisma.appointment.findMany.mockResolvedValue([]);

    await service.getSlots(
      { doctorId: 'doctor-id', from: '2026-05-01', to: '2026-05-01' },
      { userId: 'admin-id', role: Role.ADMIN } as any,
    );

    expect(slotGenerator.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicConfig: expect.objectContaining({ minArrivalMinutes: 0 }),
      }),
    );
  });

  it('enforces minArrivalMinutes for patient/anonymous roles', async () => {
    const { service, prisma, slotGenerator } = createService();
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-id', user: { role: Role.DOCTOR } });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 15 });
    prisma.workingHour.findMany.mockResolvedValue([]);
    prisma.holiday.findMany.mockResolvedValue([]);
    prisma.doctorScheduleOverride.findMany.mockResolvedValue([]);
    prisma.appointment.findMany.mockResolvedValue([]);

    await service.getSlots(
      { doctorId: 'doctor-id', from: '2026-05-01', to: '2026-05-01' },
      { userId: 'patient-id', role: Role.PATIENT } as any,
    );

    expect(slotGenerator.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicConfig: expect.objectContaining({ minArrivalMinutes: 15 }),
      }),
    );
  });

  it('broadcasts and enqueues on cancellation', async () => {
    const { service, prisma, waitlistOfferQueue, queueService, notificationsService, auditService } = createService();
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'appointment-id',
      doctorProfileId: 'doctor-id',
      patientUserId: 'patient-id',
      startTime: new Date('2026-05-01T08:00:00.000Z'),
      endTime: new Date('2026-05-01T08:30:00.000Z'),
      status: AppointmentStatus.PENDING,
      idempotencyKey: null,
      cancellationReason: null,
      notes: null,
      createdAt: new Date('2026-05-01T07:00:00.000Z'),
      updatedAt: new Date('2026-05-01T07:00:00.000Z'),
      doctorProfile: { id: 'doctor-id', specialization: null, user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'patient-id', firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com', preferredLocale: 'EN' },
    });
    prisma.appointment.update.mockResolvedValue({
      id: 'appointment-id',
      doctorProfileId: 'doctor-id',
      patientUserId: 'patient-id',
      startTime: new Date('2026-05-01T08:00:00.000Z'),
      endTime: new Date('2026-05-01T08:30:00.000Z'),
      status: AppointmentStatus.CANCELED,
      idempotencyKey: null,
      cancellationReason: null,
      notes: null,
      createdAt: new Date('2026-05-01T07:00:00.000Z'),
      updatedAt: new Date('2026-05-01T07:00:00.000Z'),
      doctorProfile: { id: 'doctor-id', specialization: null, user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'patient-id', firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com', preferredLocale: 'EN' },
    });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 0, reminderHoursBefore: 24 });

    await service.updateStatus(
      'appointment-id',
      { status: AppointmentStatus.CANCELED },
      { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST },
    );

    expect(waitlistOfferQueue.add).toHaveBeenCalled();
    expect(queueService.emitUpdated).toHaveBeenCalled();
    expect(notificationsService.queueReminder).toHaveBeenCalled();
  });

  it('allows a doctor to confirm their own appointment', async () => {
    const { service, prisma, notificationsService, queueService } = createService();
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'appointment-id',
      doctorProfileId: 'doctor-id',
      patientUserId: 'patient-id',
      startTime: new Date('2026-05-01T08:00:00.000Z'),
      endTime: new Date('2026-05-01T08:30:00.000Z'),
      status: AppointmentStatus.PENDING,
      idempotencyKey: null,
      cancellationReason: null,
      notes: null,
      createdAt: new Date('2026-05-01T07:00:00.000Z'),
      updatedAt: new Date('2026-05-01T07:00:00.000Z'),
      doctorProfile: { id: 'doctor-id', specialization: null, user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'patient-id', firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com', preferredLocale: 'EN' },
    });
    prisma.appointment.update.mockResolvedValue({
      id: 'appointment-id',
      doctorProfileId: 'doctor-id',
      patientUserId: 'patient-id',
      startTime: new Date('2026-05-01T08:00:00.000Z'),
      endTime: new Date('2026-05-01T08:30:00.000Z'),
      status: AppointmentStatus.CONFIRMED,
      idempotencyKey: null,
      cancellationReason: null,
      notes: null,
      createdAt: new Date('2026-05-01T07:00:00.000Z'),
      updatedAt: new Date('2026-05-01T07:00:00.000Z'),
      doctorProfile: { id: 'doctor-id', specialization: null, user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'patient-id', firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com', preferredLocale: 'EN' },
    });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 0, reminderHoursBefore: 24 });

    await expect(
      service.updateStatus(
        'appointment-id',
        { status: AppointmentStatus.CONFIRMED },
        { userId: 'doctor-user-id', doctorProfileId: 'doctor-id', email: 'doctor@example.com', role: Role.DOCTOR },
      ),
    ).resolves.toMatchObject({ id: 'appointment-id', status: AppointmentStatus.CONFIRMED });

    expect(notificationsService.queueReminder).toHaveBeenCalled();
    expect(queueService.emitUpdated).toHaveBeenCalledWith('appointment-id', 'doctor-id');
  });

  it('persists follow-up eligibility when completing an appointment', async () => {
    const { service, prisma, queueService } = createService();
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'appointment-id',
      doctorProfileId: 'doctor-id',
      patientUserId: 'patient-id',
      startTime: new Date('2026-05-01T08:00:00.000Z'),
      endTime: new Date('2026-05-01T08:30:00.000Z'),
      status: AppointmentStatus.IN_PROGRESS,
      needsFollowUp: false,
      idempotencyKey: null,
      cancellationReason: null,
      notes: null,
      createdAt: new Date('2026-05-01T07:00:00.000Z'),
      updatedAt: new Date('2026-05-01T07:00:00.000Z'),
      doctorProfile: { id: 'doctor-id', specialization: null, user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'patient-id', firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com', preferredLocale: 'EN' },
      followUp: null,
    });
    prisma.appointment.update.mockResolvedValue({
      id: 'appointment-id',
      doctorProfileId: 'doctor-id',
      patientUserId: 'patient-id',
      startTime: new Date('2026-05-01T08:00:00.000Z'),
      endTime: new Date('2026-05-01T08:30:00.000Z'),
      status: AppointmentStatus.COMPLETED,
      needsFollowUp: true,
      idempotencyKey: null,
      cancellationReason: null,
      notes: null,
      createdAt: new Date('2026-05-01T07:00:00.000Z'),
      updatedAt: new Date('2026-05-01T08:30:00.000Z'),
      doctorProfile: { id: 'doctor-id', specialization: null, user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'patient-id', firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com', preferredLocale: 'EN' },
      followUp: null,
    });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 0, reminderHoursBefore: 24 });

    await expect(
      service.updateStatus(
        'appointment-id',
        { status: AppointmentStatus.COMPLETED, needsFollowUp: true },
        { userId: 'doctor-user-id', doctorProfileId: 'doctor-id', email: 'doctor@example.com', role: Role.DOCTOR },
      ),
    ).resolves.toMatchObject({ id: 'appointment-id', status: AppointmentStatus.COMPLETED, needsFollowUp: true });

    expect(queueService.emitUpdated).toHaveBeenCalledWith('appointment-id', 'doctor-id');
  });

  it('updates only the follow-up flag when clearing a completed appointment', async () => {
    const { service, prisma, queueService, notificationsService } = createService();
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'appointment-id',
      doctorProfileId: 'doctor-id',
      patientUserId: 'patient-id',
      startTime: new Date('2026-05-01T08:00:00.000Z'),
      endTime: new Date('2026-05-01T08:30:00.000Z'),
      status: AppointmentStatus.COMPLETED,
      needsFollowUp: true,
      idempotencyKey: null,
      cancellationReason: null,
      notes: null,
      createdAt: new Date('2026-05-01T07:00:00.000Z'),
      updatedAt: new Date('2026-05-01T08:00:00.000Z'),
      doctorProfile: { id: 'doctor-id', specialization: null, user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'patient-id', firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com', preferredLocale: 'EN' },
      followUp: null,
    });
    prisma.appointment.update.mockResolvedValue({
      id: 'appointment-id',
      doctorProfileId: 'doctor-id',
      patientUserId: 'patient-id',
      startTime: new Date('2026-05-01T08:00:00.000Z'),
      endTime: new Date('2026-05-01T08:30:00.000Z'),
      status: AppointmentStatus.COMPLETED,
      needsFollowUp: false,
      idempotencyKey: null,
      cancellationReason: null,
      notes: null,
      createdAt: new Date('2026-05-01T07:00:00.000Z'),
      updatedAt: new Date('2026-05-01T08:31:00.000Z'),
      doctorProfile: { id: 'doctor-id', specialization: null, user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'patient-id', firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com', preferredLocale: 'EN' },
      followUp: null,
    });

    await expect(
      service.updateStatus(
        'appointment-id',
        { status: AppointmentStatus.COMPLETED, needsFollowUp: false },
        { userId: 'doctor-user-id', doctorProfileId: 'doctor-id', email: 'doctor@example.com', role: Role.DOCTOR },
      ),
    ).resolves.toMatchObject({ id: 'appointment-id', status: AppointmentStatus.COMPLETED, needsFollowUp: false });

    expect(queueService.emitUpdated).toHaveBeenCalledWith('appointment-id', 'doctor-id');
    expect(notificationsService.queueReminder).not.toHaveBeenCalled();
  });

  it('does not fail booking when notification enqueueing fails', async () => {
    const { service, prisma, notificationsService, queueService, slotGenerator, auditService } = createService();
    const createdAppointment = {
      id: 'appointment-id',
      doctorProfileId: 'doctor-id',
      patientUserId: 'patient-id',
      startTime: new Date('2030-05-01T08:00:00.000Z'),
      endTime: new Date('2030-05-01T08:30:00.000Z'),
      status: AppointmentStatus.PENDING,
      needsFollowUp: false,
      idempotencyKey: 'idem-1',
      cancellationReason: null,
      notes: null,
      createdAt: new Date('2026-05-01T07:00:00.000Z'),
      updatedAt: new Date('2026-05-01T07:00:00.000Z'),
      doctorProfile: { id: 'doctor-id', specialization: null, user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'patient-id', firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com', preferredLocale: 'EN' },
      followUp: null,
    };

    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-id', user: { role: Role.DOCTOR } });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 0, reminderHoursBefore: 24 });
    prisma.appointment.findUnique.mockResolvedValue(null);
    prisma.appointment.findMany.mockResolvedValue([]);
    prisma.appointment.findFirst.mockResolvedValue(null);
    prisma.appointment.create.mockResolvedValue(createdAppointment);
    slotGenerator.generate.mockReturnValue([{ doctorId: 'doctor-id', startsAt: '2030-05-01T08:00:00.000Z', endsAt: '2030-05-01T08:30:00.000Z' }]);
    notificationsService.queueAppointmentConfirmation.mockRejectedValue(new Error('queue unavailable'));
    notificationsService.queueReminder.mockRejectedValue(new Error('queue unavailable'));

    await expect(
      service.createAppointment(
        { doctorId: 'abcdefghijklmnopqrstuvwxy', startsAt: '2030-05-01T08:00:00.000Z' },
        { userId: 'patient-id', email: 'patient@example.com', role: Role.PATIENT },
        'idem-1',
      ),
	    ).resolves.toMatchObject({ id: 'appointment-id', needsFollowUp: false });

    expect(queueService.emitUpdated).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          doctorId: 'doctor-id',
          doctorName: 'Doc Tor',
          patientId: 'patient-id',
          patientName: 'Pat Ient',
        }),
      }),
    );
  });

  it('rejects booking when the requested slot is no longer available', async () => {
    const { service, prisma, slotGenerator } = createService();

    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-id', user: { role: Role.DOCTOR } });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 0, reminderHoursBefore: 24 });
    prisma.appointment.findUnique.mockResolvedValue(null);
    prisma.workingHour.findMany.mockResolvedValue([]);
    prisma.holiday.findMany.mockResolvedValue([]);
    prisma.doctorScheduleOverride.findMany.mockResolvedValue([]);
    prisma.appointment.findMany.mockResolvedValue([]);
    slotGenerator.generate.mockReturnValue([]);

    await expect(
      service.createAppointment(
        { doctorId: 'abcdefghijklmnopqrstuvwxy', startsAt: '2030-05-01T08:00:00.000Z' },
        { userId: 'patient-id', email: 'patient@example.com', role: Role.PATIENT },
        'idem-unavailable',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('searches appointments by patient phone for staff users', async () => {
    const { service, prisma } = createService();
    prisma.appointment.count.mockResolvedValue(0);
    prisma.appointment.findMany.mockResolvedValue([]);

    await service.getAppointments(
      { patientName: '0555123456' },
      { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST },
    );

    expect(prisma.appointment.count).toHaveBeenCalledWith({
      where: {
        patient: {
          OR: [
            { firstName: { contains: '0555123456', mode: 'insensitive' } },
            { lastName: { contains: '0555123456', mode: 'insensitive' } },
            { phone: { contains: '0555123456', mode: 'insensitive' } },
          ],
        },
      },
    });
  });

  it('filters appointments by patientId for staff users', async () => {
    const { service, prisma } = createService();
    prisma.appointment.count.mockResolvedValue(0);
    prisma.appointment.findMany.mockResolvedValue([]);

    await service.getAppointments(
      { patientId: 'patient-cuid-id-12345' },
      { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST },
    );

    expect(prisma.appointment.count).toHaveBeenCalledWith({
      where: {
        patientUserId: 'patient-cuid-id-12345',
      },
    });
  });

  it('returns past and upcoming counts for a given patient if user is receptionist', async () => {
    const { service, prisma } = createService();
    // 1st call: past count -> resolves to 2
    // 2nd call: upcoming count -> resolves to 3
    // 3rd call: total count -> resolves to 5
    prisma.appointment.count
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(5);
    prisma.appointment.findMany.mockResolvedValue([]);

    const result = await service.getAppointments(
      { patientId: 'patient-cuid-id-12345' },
      { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST },
    );

    expect(result).toEqual({
      items: [],
      total: 5,
      page: 1,
      pageSize: 20,
      pastCount: 2,
      upcomingCount: 3,
    });

    expect(prisma.appointment.count).toHaveBeenNthCalledWith(1, {
      where: {
        patientUserId: 'patient-cuid-id-12345',
        status: { in: [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW] },
        startTime: { lt: expect.any(Date) },
      },
    });

    expect(prisma.appointment.count).toHaveBeenNthCalledWith(2, {
      where: {
        patientUserId: 'patient-cuid-id-12345',
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS] },
        startTime: { gte: expect.any(Date) },
      },
    });

    expect(prisma.appointment.count).toHaveBeenNthCalledWith(3, {
      where: {
        patientUserId: 'patient-cuid-id-12345',
      },
    });
  });

  it('allows a doctor to update notes for their own appointment', async () => {
    const { service, prisma, queueService } = createService();
    const updatedAppointment = {
      id: 'appointment-id',
      doctorProfileId: 'doctor-id',
      patientUserId: 'patient-id',
      startTime: new Date('2026-05-01T08:00:00.000Z'),
      endTime: new Date('2026-05-01T08:30:00.000Z'),
      status: AppointmentStatus.CONFIRMED,
      idempotencyKey: null,
      cancellationReason: null,
      notes: 'Follow-up required',
      createdAt: new Date('2026-05-01T07:00:00.000Z'),
      updatedAt: new Date('2026-05-01T07:05:00.000Z'),
      doctorProfile: { id: 'doctor-id', specialization: null, user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'patient-id', firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com', preferredLocale: 'EN' },
    };

    prisma.appointment.findUnique.mockResolvedValue({
      ...updatedAppointment,
      notes: null,
    });
    prisma.appointment.update.mockResolvedValue(updatedAppointment);

    await expect(
      service.updateNotes(
        'appointment-id',
        { notes: '  Follow-up required  ' },
        { userId: 'doctor-user-id', doctorProfileId: 'doctor-id', email: 'doctor@example.com', role: Role.DOCTOR },
      ),
    ).resolves.toMatchObject({ id: 'appointment-id', notes: 'Follow-up required' });

    expect(prisma.appointment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'appointment-id' },
        data: { notes: 'Follow-up required' },
      }),
    );
    expect(queueService.emitUpdated).toHaveBeenCalledWith('appointment-id', 'doctor-id');
  });

  it('includes doctor and patient names in appointment deletion audit logs', async () => {
    const { service, prisma, waitlistOfferQueue, queueService, notificationsService, auditService } = createService();

    prisma.appointment.findUnique.mockResolvedValue({
      id: 'appointment-id',
      doctorProfileId: 'doctor-id',
      patientUserId: 'patient-id',
      startTime: new Date('2026-05-01T08:00:00.000Z'),
      endTime: new Date('2026-05-01T08:30:00.000Z'),
      status: AppointmentStatus.PENDING,
      idempotencyKey: null,
      cancellationReason: null,
      notes: null,
      createdAt: new Date('2026-05-01T07:00:00.000Z'),
      updatedAt: new Date('2026-05-01T07:00:00.000Z'),
      doctorProfile: { id: 'doctor-id', specialization: null, user: { firstName: 'Doc', lastName: 'Tor' } },
      patient: { id: 'patient-id', firstName: 'Pat', lastName: 'Ient', email: 'patient@example.com', preferredLocale: 'EN' },
    });
    prisma.clinicConfig.findFirst.mockResolvedValue({ slotDurationMinutes: 30, timeZone: 'UTC', minArrivalMinutes: 0, reminderHoursBefore: 24 });

    await service.deleteAppointment('appointment-id', { userId: 'staff-id', email: 'staff@example.com', role: Role.RECEPTIONIST });

    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          doctorId: 'doctor-id',
          doctorName: 'Doc Tor',
          patientId: 'patient-id',
          patientName: 'Pat Ient',
          removed: true,
        }),
      }),
    );
    expect(waitlistOfferQueue.add).toHaveBeenCalled();
    expect(notificationsService.queueReminder).toHaveBeenCalled();
    expect(queueService.emitRemoved).toHaveBeenCalledWith('appointment-id', 'doctor-id');
  });
});
