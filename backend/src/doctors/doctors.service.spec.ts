import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { DoctorsService } from './doctors.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { Locale, Role } from '../generated/prisma/enums';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  argon2id: 2,
}));

describe('DoctorsService', () => {
  let service: DoctorsService;
  let prisma: any;
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };

  const admin = { userId: 'admin-1', email: 'admin@example.com', role: Role.ADMIN };
  const doctorUser = { userId: 'doctor-user-1', email: 'doctor@example.com', role: Role.DOCTOR, doctorProfileId: 'doctor-1' };

  const makeDoctor = (overrides: Record<string, unknown> = {}) => ({
    id: 'doctor-1',
    specialization: 'Orthodontics',
    bio: 'Bio',
    createdAt: new Date('2026-05-14T10:00:00.000Z'),
    updatedAt: new Date('2026-05-14T10:00:00.000Z'),
    user: {
      id: 'doctor-user-1',
      email: 'doctor@example.com',
      firstName: 'Sara',
      lastName: 'Ahmed',
      phone: '+15551002000',
      preferredLocale: Locale.EN,
      isActive: true,
      role: Role.DOCTOR,
      createdAt: new Date('2026-05-14T10:00:00.000Z'),
      updatedAt: new Date('2026-05-14T10:00:00.000Z'),
    },
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      doctorProfile: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      doctorScheduleOverride: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(prisma)),
    };

    const module = await Test.createTestingModule({
      providers: [DoctorsService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = module.get(DoctorsService);
    jest.clearAllMocks();
  });

  it('lists only active doctors for public callers', async () => {
    prisma.doctorProfile.findMany.mockResolvedValue([makeDoctor()]);

    const result = await service.findAll(false);

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('email');
  });

  it('returns full doctor shape for admin callers', async () => {
    prisma.doctorProfile.findMany.mockResolvedValue([makeDoctor()]);

    const result = await service.findAll(true);

    expect(result[0]).toHaveProperty('email', 'doctor@example.com');
    expect(result[0]).toHaveProperty('userId', 'doctor-user-1');
  });

  it('creates doctor atomically and writes audit log', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'doctor-user-1' });
    prisma.doctorProfile.create.mockResolvedValue(makeDoctor());

    const result = await service.create(
      {
        email: 'doctor@example.com',
        firstName: 'Sara',
        lastName: 'Ahmed',
        password: 'SecurePass1',
        specialization: 'Orthodontics',
        bio: 'Bio',
        preferredLocale: Locale.EN,
      },
      admin,
    );

    expect(argon2.hash).toHaveBeenCalledWith('SecurePass1', { type: argon2.argon2id });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'DOCTOR_CREATED', targetType: 'DOCTOR' }));
    expect(result.email).toBe('doctor@example.com');
  });

  it('rejects duplicate doctor email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(service.create({ email: 'doctor@example.com', firstName: 'Sara', lastName: 'Ahmed', password: 'SecurePass1' }, admin)).rejects.toThrow('email already in use');
  });

  it('updates doctor self profile and ignores isActive', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue(makeDoctor());
    prisma.doctorProfile.findUniqueOrThrow.mockResolvedValue(makeDoctor({ user: { ...makeDoctor().user, firstName: 'Updated' } }));

    const result = await service.update('doctor-1', { firstName: 'Updated', isActive: false }, doctorUser);

    expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ firstName: 'Updated' }) }));
    expect(result.firstName).toBe('Updated');
  });

  it('forbids doctors from updating another profile', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue(makeDoctor());

    await expect(service.update('other-doctor', { firstName: 'X' }, doctorUser)).rejects.toThrow('Forbidden');
  });

  it('adds and lists schedule overrides for admins', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1' });
    prisma.doctorScheduleOverride.findFirst.mockResolvedValue(null);
    prisma.doctorScheduleOverride.create.mockResolvedValue({
      id: 'ov-1',
      doctorProfileId: 'doctor-1',
      date: new Date('2026-07-01T00:00:00.000Z'),
      isUnavailable: true,
      startTime: null,
      endTime: null,
      reason: 'Conference leave',
      createdAt: new Date('2026-05-14T10:00:00.000Z'),
      updatedAt: new Date('2026-05-14T10:00:00.000Z'),
    });

    const created = await service.createScheduleOverride('doctor-1', { date: '2026-07-01', isUnavailable: true, reason: 'Conference leave' }, admin);

    expect(created.isUnavailable).toBe(true);
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'SCHEDULE_OVERRIDE_CREATED', targetType: 'SCHEDULE_OVERRIDE' }));

    prisma.doctorScheduleOverride.findMany.mockResolvedValue([{ ...created, date: new Date('2026-07-01T00:00:00.000Z'), createdAt: new Date('2026-05-14T10:00:00.000Z') }]);
    const list = await service.listScheduleOverrides('doctor-1', admin);
    expect(list).toHaveLength(1);
  });

  it('rejects duplicate override dates', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1' });
    prisma.doctorScheduleOverride.findFirst.mockResolvedValue({ id: 'ov-1' });

    await expect(service.createScheduleOverride('doctor-1', { date: '2026-07-01', isUnavailable: true }, admin)).rejects.toThrow('An override already exists for this date');
  });

  it('updates and deletes overrides', async () => {
    prisma.doctorScheduleOverride.findFirst
      .mockResolvedValueOnce({
      id: 'ov-1',
      doctorProfileId: 'doctor-1',
      date: new Date('2026-07-01T00:00:00.000Z'),
      isUnavailable: true,
      startTime: null,
      endTime: null,
      reason: null,
      createdAt: new Date('2026-05-14T10:00:00.000Z'),
      updatedAt: new Date('2026-05-14T10:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'ov-1',
        doctorProfileId: 'doctor-1',
        date: new Date('2026-07-01T00:00:00.000Z'),
        isUnavailable: true,
        startTime: null,
        endTime: null,
        reason: null,
        createdAt: new Date('2026-05-14T10:00:00.000Z'),
        updatedAt: new Date('2026-05-14T10:00:00.000Z'),
      });
    prisma.doctorScheduleOverride.update.mockResolvedValue({
      id: 'ov-1',
      doctorProfileId: 'doctor-1',
      date: new Date('2026-07-01T00:00:00.000Z'),
      isUnavailable: false,
      startTime: '09:00',
      endTime: '13:00',
      reason: 'Morning only',
      createdAt: new Date('2026-05-14T10:00:00.000Z'),
      updatedAt: new Date('2026-05-14T10:00:00.000Z'),
    });

    const updated = await service.updateScheduleOverride('doctor-1', 'ov-1', { isUnavailable: false, startTime: '09:00', endTime: '13:00' }, admin);
    expect(updated.endTime).toBe('13:00');

    await service.deleteScheduleOverride('doctor-1', 'ov-1', admin);
    expect(prisma.doctorScheduleOverride.delete).toHaveBeenCalledWith({ where: { id: 'ov-1' } });
  });
});
