import { Test } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ClinicConfigService } from './clinic-config.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClinicConfigService', () => {
  let service: ClinicConfigService;
  let prisma: any;

  const config = {
    id: 'clinic-config-singleton',
    slotDurationMinutes: 30,
    timeZone: 'UTC',
    reminderHoursBefore: 24,
    offerWindowMinutes: 30,
    minArrivalMinutes: 45,
    createdAt: new Date('2026-05-14T10:00:00.000Z'),
    updatedAt: new Date('2026-05-14T10:00:00.000Z'),
  };

  const buildWorkingHour = (dayOfWeek: number, overrides: Record<string, unknown> = {}) => ({
    id: `wh-${dayOfWeek}`,
    dayOfWeek,
    isClosed: false,
    startTime: '09:00',
    endTime: '17:00',
    createdAt: new Date('2026-05-14T10:00:00.000Z'),
    updatedAt: new Date('2026-05-14T10:00:00.000Z'),
    ...overrides,
  });

  const buildHoliday = (overrides: Record<string, unknown> = {}) => ({
    id: 'holiday-1',
    date: new Date('2026-12-25T00:00:00.000Z'),
    name: 'Christmas',
    createdAt: new Date('2026-05-14T10:00:00.000Z'),
    updatedAt: new Date('2026-05-14T10:00:00.000Z'),
    ...overrides,
  });

  beforeEach(async () => {
    prisma = {
      clinicConfig: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      workingHour: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      holiday: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [ClinicConfigService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(ClinicConfigService);
    jest.clearAllMocks();
  });

  it('returns the singleton clinic config', async () => {
    prisma.clinicConfig.findUnique.mockResolvedValue(config);

    await expect(service.getConfig()).resolves.toMatchObject({
      id: 'clinic-config-singleton',
      timeZone: 'UTC',
    });
  });

  it('upserts the singleton when missing', async () => {
    prisma.clinicConfig.findUnique.mockResolvedValueOnce(null);
    prisma.clinicConfig.upsert.mockResolvedValueOnce(config);

    await expect(service.getConfig()).resolves.toMatchObject({ id: 'clinic-config-singleton' });
    expect(prisma.clinicConfig.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'clinic-config-singleton' } }));
  });

  it('updates config with partial fields only', async () => {
    prisma.clinicConfig.upsert.mockResolvedValue({ ...config, slotDurationMinutes: 20, updatedAt: new Date('2026-05-14T11:00:00.000Z') });

    await expect(service.updateConfig({ slotDurationMinutes: 20 })).resolves.toMatchObject({ slotDurationMinutes: 20, timeZone: 'UTC' });
  });

  it('returns current config unchanged for empty updates', async () => {
    prisma.clinicConfig.findUnique.mockResolvedValue(config);

    await expect(service.updateConfig({})).resolves.toMatchObject({ timeZone: 'UTC' });
    expect(prisma.clinicConfig.upsert).not.toHaveBeenCalled();
  });

  it('fills missing working hours with closed days', async () => {
    prisma.workingHour.findMany.mockResolvedValue([buildWorkingHour(1), buildWorkingHour(2)]);

    const hours = await service.getWorkingHours();
    expect(hours).toHaveLength(7);
    expect(hours[0]).toMatchObject({ dayOfWeek: 0, isClosed: true });
    expect(hours[1]).toMatchObject({ dayOfWeek: 1, isClosed: false });
  });

  it('replaces working hours atomically', async () => {
    const rows = Array.from({ length: 7 }, (_, dayOfWeek) => buildWorkingHour(dayOfWeek));
    prisma.workingHour.findMany.mockResolvedValue(rows);

    await expect(
      service.replaceWorkingHours(rows.map(({ id, createdAt, updatedAt, ...dto }) => dto)),
    ).resolves.toHaveLength(7);

    expect(prisma.workingHour.deleteMany).toHaveBeenCalled();
    expect(prisma.workingHour.createMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.arrayContaining([{ dayOfWeek: 0, isClosed: false, startTime: '09:00', endTime: '17:00' }]) }));
  });

  it('rejects invalid working-hour payloads before hitting the database', async () => {
    await expect(service.replaceWorkingHours([{ dayOfWeek: 0, isClosed: false, startTime: '09:00', endTime: '17:00' } as any])).rejects.toThrow(BadRequestException);
  });

  it('creates holidays in the clinic timezone and trims the name', async () => {
    prisma.clinicConfig.findUnique.mockResolvedValue(config);
    prisma.holiday.create.mockResolvedValue(buildHoliday({ name: 'Christmas' }));

    await expect(service.createHoliday({ date: '2026-12-25', name: ' Christmas ' })).resolves.toMatchObject({ name: 'Christmas', date: '2026-12-25' });
  });

  it('rejects past holidays', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-14T10:00:00.000Z'));
    prisma.clinicConfig.findUnique.mockResolvedValue(config);

    await expect(service.createHoliday({ date: '2026-05-13', name: 'Past' })).rejects.toThrow('Holiday date must be today or in the future');
    jest.useRealTimers();
  });

  it('maps duplicate holidays to conflict errors', async () => {
    prisma.clinicConfig.findUnique.mockResolvedValue(config);
    prisma.holiday.create.mockRejectedValue({ code: 'P2002' });

    await expect(service.createHoliday({ date: '2026-12-25', name: 'Christmas' })).rejects.toThrow(ConflictException);
  });

  it('deletes holidays when found', async () => {
    prisma.holiday.findUnique.mockResolvedValue(buildHoliday());

    await expect(service.deleteHoliday('holiday-1')).resolves.toBeUndefined();
    expect(prisma.holiday.delete).toHaveBeenCalledWith({ where: { id: 'holiday-1' } });
  });

  it('throws not found when a holiday id is missing', async () => {
    prisma.holiday.findUnique.mockResolvedValue(null);

    await expect(service.deleteHoliday('missing')).rejects.toThrow(NotFoundException);
  });
});
