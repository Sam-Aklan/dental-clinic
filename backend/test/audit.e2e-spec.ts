import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '../src/generated/prisma/enums';
import { REDACTION_MARKER } from '../src/audit/audit.constants';

type ActorFixture = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
};

type AuditFixture = {
  id: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  actor: ActorFixture | null;
};

const actors = {
  admin: {
    id: '11111111-1111-4111-8111-111111111111',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@clinic.test',
    role: Role.ADMIN,
  },
  receptionist: {
    id: '22222222-2222-4222-8222-222222222222',
    firstName: 'Reception',
    lastName: 'Ist',
    email: 'receptionist@clinic.test',
    role: Role.RECEPTIONIST,
  },
  doctor: {
    id: '33333333-3333-4333-8333-333333333333',
    firstName: 'Doctor',
    lastName: 'Who',
    email: 'doctor@clinic.test',
    role: Role.DOCTOR,
  },
  patient: {
    id: '44444444-4444-4444-8444-444444444444',
    firstName: 'Patient',
    lastName: 'Person',
    email: 'patient@clinic.test',
    role: Role.PATIENT,
  },
} satisfies Record<string, ActorFixture>;

const appointmentTargetId = 'appointment-target-id';
const appointmentFixture = () => ({
  id: 'audit-appt-1',
  actorId: actors.receptionist.id,
  action: 'APPOINTMENT_STATUS_UPDATED',
  entityType: 'APPOINTMENT',
  entityId: appointmentTargetId,
  metadata: {
    before: { status: 'PENDING' },
    after: { status: 'CONFIRMED' },
  },
  createdAt: new Date('2026-01-15T12:00:00.000Z'),
  actor: actors.receptionist,
});

const configFixture = () => ({
  id: 'audit-config-1',
  actorId: actors.admin.id,
  action: 'CLINIC_CONFIG_UPDATED',
  entityType: 'CLINIC_CONFIG',
  entityId: null,
  metadata: {
    before: { slotDurationMinutes: 30, secret: REDACTION_MARKER },
    after: { slotDurationMinutes: 45, secret: REDACTION_MARKER },
  },
  createdAt: new Date('2026-03-20T12:00:00.000Z'),
  actor: actors.admin,
});

describe('Audit E2E', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let prisma: any;

  const state: {
    config: {
      id: string;
      slotDurationMinutes: number;
      timeZone: string;
      reminderHoursBefore: number;
      offerWindowMinutes: number;
      minArrivalMinutes: number;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    auditLogs: AuditFixture[];
    nextAuditLogId: number;
  } = {
    config: null,
    auditLogs: [],
    nextAuditLogId: 1,
  };

  const cloneRow = (row: AuditFixture): AuditFixture => structuredClone(row);

  const matchesText = (value: string | null | undefined, filter: { contains?: string; mode?: 'insensitive' | 'default' } | undefined) => {
    if (!filter) {
      return true;
    }

    if (value === null || value === undefined) {
      return false;
    }

    const haystack = filter.mode === 'insensitive' ? value.toLowerCase() : value;
    const needle = filter.mode === 'insensitive' ? filter.contains?.toLowerCase() ?? '' : filter.contains ?? '';
    return haystack.includes(needle);
  };

  const matchesWhere = (row: AuditFixture, where: Record<string, unknown> = {}) => {
    if (where.actorId && row.actorId !== where.actorId) {
      return false;
    }

    if (where.action && typeof where.action === 'object' && Array.isArray((where.action as { in?: string[] }).in)) {
      if (!(where.action as { in: string[] }).in.includes(row.action)) {
        return false;
      }
    }

    if (where.entityType && typeof where.entityType === 'object' && Array.isArray((where.entityType as { in?: string[] }).in)) {
      if (!(where.entityType as { in: string[] }).in.includes(row.entityType)) {
        return false;
      }
    }

    if (where.entityId && row.entityId !== where.entityId) {
      return false;
    }

    if (where.actor && typeof where.actor === 'object' && Array.isArray((where.actor as { OR?: Array<Record<string, { contains?: string; mode?: 'insensitive' | 'default' }>> }).OR)) {
      const clauses = (where.actor as { OR: Array<Record<string, { contains?: string; mode?: 'insensitive' | 'default' }>> }).OR;
      const actor = row.actor;
      const clauseMatch = clauses.some((clause) => {
        if (!actor) {
          return false;
        }

        return (
          ('firstName' in clause && matchesText(actor.firstName, clause.firstName)) ||
          ('lastName' in clause && matchesText(actor.lastName, clause.lastName)) ||
          ('email' in clause && matchesText(actor.email, clause.email))
        );
      });

      if (!clauseMatch) {
        return false;
      }
    }

    if (where.createdAt && typeof where.createdAt === 'object') {
      const range = where.createdAt as { gte?: Date; lte?: Date };
      if (range.gte && row.createdAt < range.gte) {
        return false;
      }
      if (range.lte && row.createdAt > range.lte) {
        return false;
      }
    }

    return true;
  };

  const sortedRows = (rows: AuditFixture[], orderBy: Record<string, unknown> | undefined) => {
    const entries = Object.entries(orderBy ?? {});
    const [field, directionOrNested] = entries[0] ?? ['createdAt', 'desc'];
    const direction = typeof directionOrNested === 'string' ? directionOrNested : Object.values(directionOrNested as Record<string, string>)[0] ?? 'desc';

    return [...rows].sort((left, right) => {
      const factor = direction === 'asc' ? 1 : -1;

      if (field === 'actor') {
        const leftName = left.actor?.firstName ?? '';
        const rightName = right.actor?.firstName ?? '';
        return leftName.localeCompare(rightName) * factor;
      }

      if (field === 'action') {
        return left.action.localeCompare(right.action) * factor;
      }

      if (field === 'entityType') {
        return left.entityType.localeCompare(right.entityType) * factor;
      }

      return (left.createdAt.getTime() - right.createdAt.getTime()) * factor;
    });
  };

  const prismaMock = {
    clinicConfig: {
      findUnique: jest.fn(async () => (state.config ? structuredClone(state.config) : null)),
      findFirst: jest.fn(async () => (state.config ? structuredClone(state.config) : null)),
      findMany: jest.fn(async () => (state.config ? [structuredClone(state.config)] : [])),
      upsert: jest.fn(async ({ create, update }: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
        if (!state.config) {
          state.config = {
            id: create.id as string,
            slotDurationMinutes: create.slotDurationMinutes as number,
            timeZone: create.timeZone as string,
            reminderHoursBefore: create.reminderHoursBefore as number,
            offerWindowMinutes: create.offerWindowMinutes as number,
            minArrivalMinutes: create.minArrivalMinutes as number,
            createdAt: new Date('2026-05-16T00:00:00.000Z'),
            updatedAt: new Date('2026-05-16T00:00:00.000Z'),
          };
        } else {
          const current = state.config;
          state.config = {
            ...current,
            ...(update as Record<string, unknown>),
            updatedAt: new Date('2026-05-16T00:00:00.000Z'),
          };
        }

        return structuredClone(state.config);
      }),
    },
    auditLog: {
      create: jest.fn(async ({ data }: { data: { actorId: string | null; action: string; entityType: string; entityId: string | null; metadata?: Record<string, unknown> | null; createdAt?: Date } }) => {
        const row: AuditFixture = {
          id: `audit-${state.nextAuditLogId++}`,
          actorId: data.actorId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          metadata: data.metadata ?? null,
          createdAt: data.createdAt ?? new Date('2026-05-16T10:00:00.000Z'),
          actor: data.actorId === actors.admin.id ? actors.admin : data.actorId === actors.receptionist.id ? actors.receptionist : data.actorId === actors.doctor.id ? actors.doctor : data.actorId === actors.patient.id ? actors.patient : null,
        };

        state.auditLogs.push(row);
        return cloneRow(row);
      }),
      findMany: jest.fn(async ({ where, skip = 0, take = 50, orderBy }: { where?: Record<string, unknown>; skip?: number; take?: number; orderBy?: Record<string, unknown> }) => {
        const filtered = state.auditLogs.filter((row) => matchesWhere(row, where));
        const ordered = sortedRows(filtered, orderBy);
        return ordered.slice(skip, skip + take).map(cloneRow);
      }),
      count: jest.fn(async ({ where }: { where?: Record<string, unknown> }) => state.auditLogs.filter((row) => matchesWhere(row, where)).length),
    },
    $transaction: jest.fn(async (operations: Promise<unknown>[] | ((tx: any) => Promise<unknown>)) => {
      if (typeof operations === 'function') {
        return operations(prismaMock);
      }

      return Promise.all(operations);
    }),
  };

  const tokenFor = (actor: ActorFixture) => jwtService.sign({ sub: actor.id, email: actor.email, role: actor.role });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(app.get(TransformInterceptor));
    app.useGlobalFilters(app.get(HttpExceptionFilter));
    await app.init();

    const jwtSecret = app.get(ConfigService).getOrThrow<string>('JWT_ACCESS_SECRET');
    jwtService = new JwtService({ secret: jwtSecret });
    prisma = prismaMock;
  });

  beforeEach(() => {
    state.config = {
      id: 'clinic-config-singleton',
      slotDurationMinutes: 30,
      timeZone: 'UTC',
      reminderHoursBefore: 24,
      offerWindowMinutes: 30,
      minArrivalMinutes: 45,
      createdAt: new Date('2026-05-16T00:00:00.000Z'),
      updatedAt: new Date('2026-05-16T00:00:00.000Z'),
    };
    state.auditLogs = [appointmentFixture(), configFixture()];
    state.nextAuditLogId = 3;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows admin access and returns paginated audit data', async () => {
    const response = await request(app.getHttpServer()).get('/api/audit').set('Authorization', `Bearer ${tokenFor(actors.admin)}`).expect(200);

    expect(response.body.statusCode).toBe(200);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.items.map((item: { id: string }) => item.id)).toEqual(expect.arrayContaining(['audit-appt-1', 'audit-config-1']));
  });

  it('blocks receptionist access', async () => {
    await request(app.getHttpServer()).get('/api/audit').set('Authorization', `Bearer ${tokenFor(actors.receptionist)}`).expect(403);
  });

  it('blocks doctor access', async () => {
    await request(app.getHttpServer()).get('/api/audit').set('Authorization', `Bearer ${tokenFor(actors.doctor)}`).expect(403);
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/api/audit').expect(401);
  });

  it('filters by actor, action, target and date range', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/audit')
      .set('Authorization', `Bearer ${tokenFor(actors.admin)}`)
      .query({
        actorId: actors.receptionist.id,
        action: 'APPOINTMENT_STATUS_UPDATED',
        targetType: 'APPOINTMENT',
        targetId: appointmentTargetId,
        from: '2026-01-01',
        to: '2026-01-31',
      })
      .expect(200);

    expect(response.body.data.total).toBe(1);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0]).toMatchObject({
      actorId: actors.receptionist.id,
      action: 'APPOINTMENT_STATUS_UPDATED',
      targetType: 'APPOINTMENT',
      targetId: appointmentTargetId,
      createdAt: '2026-01-15T12:00:00.000Z',
    });
  });

  it('returns stable pagination metadata', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/audit')
      .set('Authorization', `Bearer ${tokenFor(actors.admin)}`)
      .query({ page: 2, pageSize: 1, sortBy: 'createdAt', sortDir: 'asc' })
      .expect(200);

    expect(response.body.data).toMatchObject({
      page: 2,
      pageSize: 1,
      total: 2,
      totalPages: 2,
    });
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].id).toBe('audit-config-1');
  });

  it('surfaces a workflow audit row seeded through Prisma create', async () => {
    state.auditLogs = [];
    await prisma.auditLog.create({
      data: {
        actorId: actors.receptionist.id,
        action: 'APPOINTMENT_STATUS_UPDATED',
        entityType: 'APPOINTMENT',
        entityId: appointmentTargetId,
        metadata: {
          before: { status: 'PENDING' },
          after: { status: 'CONFIRMED' },
        },
        createdAt: new Date('2026-01-15T12:00:00.000Z'),
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/audit')
      .set('Authorization', `Bearer ${tokenFor(actors.admin)}`)
      .query({ targetType: 'APPOINTMENT', targetId: appointmentTargetId })
      .expect(200);

    expect(response.body.data.items[0]).toMatchObject({
      action: 'APPOINTMENT_STATUS_UPDATED',
      targetType: 'APPOINTMENT',
      targetId: appointmentTargetId,
      actor: {
        id: actors.receptionist.id,
        firstName: 'Reception',
        lastName: 'Ist',
        email: 'receptionist@clinic.test',
        role: 'RECEPTIONIST',
      },
    });
  });

  it('keeps redacted clinic config payloads visible through the audit log', async () => {
    state.auditLogs = [];
    await prisma.auditLog.create({
      data: {
        actorId: actors.admin.id,
        action: 'CLINIC_CONFIG_UPDATED',
        entityType: 'CLINIC_CONFIG',
        entityId: null,
        metadata: {
          before: { slotDurationMinutes: 30, secret: REDACTION_MARKER },
          after: { slotDurationMinutes: 45, secret: REDACTION_MARKER },
        },
        createdAt: new Date('2026-03-20T12:00:00.000Z'),
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/audit')
      .set('Authorization', `Bearer ${tokenFor(actors.admin)}`)
      .query({ targetType: 'CLINIC_CONFIG' })
      .expect(200);

    expect(response.body.data.items[0].payload.before.secret).toBe(REDACTION_MARKER);
    expect(response.body.data.items[0].payload.after.secret).toBe(REDACTION_MARKER);
  });

  it('keeps January date filters on the appointment fixture only', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/audit')
      .set('Authorization', `Bearer ${tokenFor(actors.admin)}`)
      .query({ from: '2026-01-01', to: '2026-01-31' })
      .expect(200);

    expect(response.body.data.total).toBe(1);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].id).toBe('audit-appt-1');
  });
});
