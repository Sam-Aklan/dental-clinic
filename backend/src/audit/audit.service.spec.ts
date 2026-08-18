import { Logger } from '@nestjs/common';
import { Role } from '../generated/prisma/enums';
import { REDACTION_MARKER, sanitizePayload } from './audit.constants';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  const createService = () => {
    const prisma = {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };
    const clinicConfigService = {
      getConfig: jest.fn().mockResolvedValue({ timeZone: 'UTC' }),
    };

    return {
      service: new AuditService(prisma as never, clinicConfigService as never),
      prisma,
      clinicConfigService,
    };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates a staff audit row using Prisma field names', async () => {
    const { service, prisma } = createService();
    prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });

    await service.log({
      actorId: 'staff-user-id',
      actorRole: Role.RECEPTIONIST,
      action: 'APPOINTMENT_STATUS_UPDATED',
      targetType: 'APPOINTMENT',
      targetId: 'appointment-target-id',
      payload: { status: 'CONFIRMED' },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'staff-user-id',
        action: 'APPOINTMENT_STATUS_UPDATED',
        entityType: 'APPOINTMENT',
        entityId: 'appointment-target-id',
        metadata: { status: 'CONFIRMED' },
      },
    });
  });

  it('skips patient audit rows', async () => {
    const { service, prisma } = createService();

    await service.log({
      actorId: 'patient-user-id',
      actorRole: Role.PATIENT,
      action: 'APPOINTMENT_CREATED',
      targetType: 'APPOINTMENT',
    });

    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it('redacts sensitive payload keys recursively', async () => {
    const { service, prisma } = createService();
    prisma.auditLog.create.mockResolvedValue({ id: 'audit-2' });

    await service.log({
      actorId: 'admin-user-id',
      actorRole: Role.ADMIN,
      action: 'CLINIC_CONFIG_UPDATED',
      targetType: 'CLINIC_CONFIG',
      targetId: 'clinic-config-singleton',
      payload: {
        secret: 'abc',
        nested: {
          password: 'hidden',
          ok: true,
        },
        entries: [{ token: 'deep-secret' }, { value: 'safe' }],
      },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'admin-user-id',
        action: 'CLINIC_CONFIG_UPDATED',
        entityType: 'CLINIC_CONFIG',
        entityId: 'clinic-config-singleton',
        metadata: {
          secret: REDACTION_MARKER,
          nested: {
            password: REDACTION_MARKER,
            ok: true,
          },
          entries: [{ token: REDACTION_MARKER }, { value: 'safe' }],
        },
      },
    });
  });

  it('serializes dates in payload metadata', async () => {
    const { service, prisma } = createService();
    prisma.auditLog.create.mockResolvedValue({ id: 'audit-3' });

    await service.log({
      actorId: 'admin-user-id',
      actorRole: Role.ADMIN,
      action: 'CLINIC_CONFIG_UPDATED',
      targetType: 'CLINIC_CONFIG',
      payload: { updatedAt: new Date('2026-01-01T00:00:00.000Z') },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        actorId: 'admin-user-id',
        action: 'CLINIC_CONFIG_UPDATED',
        entityType: 'CLINIC_CONFIG',
        entityId: null,
        metadata: { updatedAt: '2026-01-01T00:00:00.000Z' },
      },
    });
  });

  it('logs Prisma failures without throwing', async () => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { service, prisma } = createService();
    prisma.auditLog.create.mockRejectedValue(new Error('db failure'));

    await expect(
      service.log({
        actorId: 'admin-user-id',
        actorRole: Role.ADMIN,
        action: 'CLINIC_CONFIG_UPDATED',
        targetType: 'CLINIC_CONFIG',
      }),
    ).resolves.toBeUndefined();

    expect(errorSpy).toHaveBeenCalledWith(
      'audit_write_failed action=CLINIC_CONFIG_UPDATED targetType=CLINIC_CONFIG actorId=admin-user-id targetId=',
      expect.any(String),
    );
  });

  it('applies UTC date range filters', async () => {
    const { service, prisma, clinicConfigService } = createService();
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.auditLog.count.mockResolvedValue(0);

    await service.findLogs({ from: '2026-01-01', to: '2026-01-31' } as never);

    expect(clinicConfigService.getConfig).toHaveBeenCalledTimes(1);
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date('2026-01-01T00:00:00.000Z'),
            lte: new Date('2026-01-31T23:59:59.999Z'),
          },
        },
      }),
    );
    expect(prisma.auditLog.count).toHaveBeenCalledWith({
      where: {
        createdAt: {
          gte: new Date('2026-01-01T00:00:00.000Z'),
          lte: new Date('2026-01-31T23:59:59.999Z'),
        },
      },
    });
  });

  it('combines actor, action, target, and name filters', async () => {
    const { service, prisma } = createService();
    prisma.auditLog.findMany.mockResolvedValue([]);
    prisma.auditLog.count.mockResolvedValue(0);

    await service.findLogs({
      actorId: 'staff-user-id',
      actorName: 'sara',
      action: ['APPOINTMENT_STATUS_UPDATED', 'APPOINTMENT_CANCELED'],
      targetType: ['APPOINTMENT'],
      targetId: 'appointment-target-id',
    } as never);

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          actorId: 'staff-user-id',
          action: { in: ['APPOINTMENT_STATUS_UPDATED', 'APPOINTMENT_CANCELED'] },
          entityType: { in: ['APPOINTMENT'] },
          entityId: 'appointment-target-id',
          actor: {
            OR: [
              { firstName: { contains: 'sara', mode: 'insensitive' } },
              { lastName: { contains: 'sara', mode: 'insensitive' } },
              { email: { contains: 'sara', mode: 'insensitive' } },
            ],
          },
        },
      }),
    );
  });

  it('applies pagination and actor sorting', async () => {
    const { service, prisma } = createService();
    prisma.auditLog.findMany.mockResolvedValue([{ id: 'audit-1', actorId: 'staff', action: 'X', entityType: 'APPOINTMENT', entityId: null, metadata: null, createdAt: new Date(), actor: null }]);
    prisma.auditLog.count.mockResolvedValue(25);

    const result = await service.findLogs({ page: 2, pageSize: 10, sortBy: 'actor', sortDir: 'asc' } as never);

    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        orderBy: { actor: { firstName: 'asc' } },
      }),
    );
    expect(result).toMatchObject({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    });
  });
});

describe('sanitizePayload', () => {
  it.each([
    ['null input', null, null],
    ['empty object', {}, null],
    ['safe scalar', { status: 'ok' }, { status: 'ok' }],
    ['case-insensitive sensitive key', { Password: 'secret' }, { Password: REDACTION_MARKER }],
    ['nested object', { nested: { token: 'abc' } }, { nested: { token: REDACTION_MARKER } }],
    ['nested array', { arr: [{ secret: 'x' }, 'safe'] }, { arr: [{ secret: REDACTION_MARKER }, 'safe'] }],
    ['date serialization', { updatedAt: new Date('2026-01-01T00:00:00.000Z') }, { updatedAt: '2026-01-01T00:00:00.000Z' }],
    ['function and symbol omission', { fn: () => 'x', sym: Symbol('x') }, null],
  ])('%s', (_label, input, expected) => {
    expect(sanitizePayload(input)).toEqual(expected);
  });

  it('omits circular references but keeps safe fields', () => {
    const payload: Record<string, unknown> = { safe: 'ok' };
    payload.self = payload;

    expect(sanitizePayload(payload)).toEqual({ safe: 'ok' });
  });
});
