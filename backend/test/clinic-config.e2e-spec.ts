import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Role } from '../src/generated/prisma/enums';

describe('ClinicConfig E2E', () => {
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
    workingHours: Array<{ id: string; dayOfWeek: number; isClosed: boolean; startTime: string | null; endTime: string | null; createdAt: Date; updatedAt: Date }>;
    holidays: Array<{ id: string; date: Date; name: string; createdAt: Date; updatedAt: Date }>;
    nextHoliday: number;
    nextWorkingHour: number;
  } = {
    config: null,
    workingHours: [],
    holidays: [],
    nextHoliday: 1,
    nextWorkingHour: 1,
  };

  prisma = {
    clinicConfig: {
      findUnique: jest.fn(async () => (state.config ? { ...state.config } : null)),
      findMany: jest.fn(async () => (state.config ? [{ ...state.config }] : [])),
      upsert: jest.fn(async ({ update, create }: { update: Record<string, unknown>; create: Record<string, unknown> }) => {
        if (!state.config) {
          state.config = {
            id: create.id as string,
            slotDurationMinutes: create.slotDurationMinutes as number,
            timeZone: create.timeZone as string,
            reminderHoursBefore: create.reminderHoursBefore as number,
            offerWindowMinutes: create.offerWindowMinutes as number,
            minArrivalMinutes: create.minArrivalMinutes as number,
            createdAt: new Date('2026-05-14T10:00:00.000Z'),
            updatedAt: new Date(),
          };
        } else {
          state.config = {
            ...state.config,
            ...update,
            updatedAt: new Date(),
          };
        }
        return { ...state.config };
      }),
    },
    workingHour: {
      findMany: jest.fn(async () => [...state.workingHours].sort((a, b) => a.dayOfWeek - b.dayOfWeek)),
      deleteMany: jest.fn(async () => {
        state.workingHours = [];
        return { count: 0 };
      }),
      createMany: jest.fn(async ({ data }: { data: Array<{ dayOfWeek: number; isClosed: boolean; startTime: string | null; endTime: string | null }> }) => {
        state.workingHours = data.map((item) => ({
          id: `wh-${state.nextWorkingHour++}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...item,
        }));
        return { count: data.length };
      }),
    },
    holiday: {
      findMany: jest.fn(async () => [...state.holidays].sort((a, b) => a.date.getTime() - b.date.getTime())),
      findUnique: jest.fn(async ({ where: { id } }: { where: { id: string } }) => state.holidays.find((holiday) => holiday.id === id) ?? null),
      create: jest.fn(async ({ data }: { data: { date: Date; name: string } }) => {
        const dateKey = data.date.toISOString().slice(0, 10);
        if (state.holidays.some((holiday) => holiday.date.toISOString().slice(0, 10) === dateKey)) {
          const error: Error & { code?: string } = new Error('duplicate');
          error.code = 'P2002';
          throw error;
        }

        const created = {
          id: `hol-${state.nextHoliday++}`,
          date: data.date,
          name: data.name,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        state.holidays.push(created);
        return created;
      }),
      delete: jest.fn(async ({ where: { id } }: { where: { id: string } }) => {
        const index = state.holidays.findIndex((holiday) => holiday.id === id);
        if (index >= 0) {
          state.holidays.splice(index, 1);
        }
        return { id };
      }),
    },
    $transaction: jest.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
  };

  const adminToken = async () => jwtService.sign({ sub: 'admin-1', email: 'admin@clinic.test', role: Role.ADMIN });
  const doctorToken = async () => jwtService.sign({ sub: 'doctor-1', email: 'doctor@clinic.test', role: Role.DOCTOR });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(app.get(TransformInterceptor));
    app.useGlobalFilters(app.get(HttpExceptionFilter));
    await app.init();

    jwtService = app.get(JwtService);
  });

  beforeEach(() => {
    state.config = {
      id: 'clinic-config-singleton',
      slotDurationMinutes: 30,
      timeZone: 'UTC',
      reminderHoursBefore: 24,
      offerWindowMinutes: 30,
      minArrivalMinutes: 45,
      createdAt: new Date('2026-05-14T10:00:00.000Z'),
      updatedAt: new Date('2026-05-14T10:00:00.000Z'),
    };
    state.workingHours = [];
    state.holidays = [];
    state.nextHoliday = 1;
    state.nextWorkingHour = 1;
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows public reads without authentication', async () => {
    await request(app.getHttpServer()).get('/api/clinic-config').expect(200);
    const workingHours = await request(app.getHttpServer()).get('/api/clinic-config/working-hours').expect(200);
    expect(workingHours.body.data).toHaveLength(7);
    expect(workingHours.body.data[0]).toMatchObject({ dayOfWeek: 0, isClosed: true });
    const holidays = await request(app.getHttpServer()).get('/api/clinic-config/holidays').expect(200);
    expect(holidays.body.data).toEqual([]);
  });

  it('updates clinic config as admin and rejects invalid or unauthorized writes', async () => {
    const token = await adminToken();

    const update = await request(app.getHttpServer())
      .patch('/api/clinic-config')
      .set('Authorization', `Bearer ${token}`)
      .send({ slotDurationMinutes: 20, timeZone: 'Asia/Riyadh' })
      .expect(200);

    expect(update.body.data).toMatchObject({ slotDurationMinutes: 20, timeZone: 'Asia/Riyadh' });

    const readBack = await request(app.getHttpServer()).get('/api/clinic-config').expect(200);
    expect(readBack.body.data).toMatchObject({ slotDurationMinutes: 20, timeZone: 'Asia/Riyadh' });

    await request(app.getHttpServer())
      .patch('/api/clinic-config')
      .set('Authorization', `Bearer ${token}`)
      .send({ slotDurationMinutes: 26 })
      .expect(400);

    await request(app.getHttpServer())
      .patch('/api/clinic-config')
      .set('Authorization', `Bearer ${token}`)
      .send({ timeZone: 'Mars/Phobos' })
      .expect(400);

    await request(app.getHttpServer()).patch('/api/clinic-config').send({ slotDurationMinutes: 20 }).expect(401);
    await request(app.getHttpServer())
      .patch('/api/clinic-config')
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ slotDurationMinutes: 20 })
      .expect(403);
  });

  it('replaces weekly working hours atomically', async () => {
    const token = await adminToken();
    const body = [
      { dayOfWeek: 0, isClosed: true, startTime: null, endTime: null },
      { dayOfWeek: 1, isClosed: false, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 2, isClosed: false, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 3, isClosed: false, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 4, isClosed: false, startTime: '09:00', endTime: '17:00' },
      { dayOfWeek: 5, isClosed: false, startTime: '09:00', endTime: '13:00' },
      { dayOfWeek: 6, isClosed: true, startTime: null, endTime: null },
    ];

    await request(app.getHttpServer())
      .patch('/api/clinic-config/working-hours')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(200);

    const readBack = await request(app.getHttpServer()).get('/api/clinic-config/working-hours').expect(200);
    expect(readBack.body.data).toHaveLength(7);
    expect(readBack.body.data[1]).toMatchObject({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' });

    await request(app.getHttpServer())
      .patch('/api/clinic-config/working-hours')
      .set('Authorization', `Bearer ${token}`)
      .send(body.slice(0, 6))
      .expect(400);

    await request(app.getHttpServer())
      .patch('/api/clinic-config/working-hours')
      .set('Authorization', `Bearer ${token}`)
      .send(body.map((row, index) => (index === 1 ? { ...row, endTime: '08:00' } : row)))
      .expect(400);

    await request(app.getHttpServer()).patch('/api/clinic-config/working-hours').send(body).expect(401);
    await request(app.getHttpServer())
      .patch('/api/clinic-config/working-hours')
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send(body)
      .expect(403);
  });

  it('manages holidays end-to-end', async () => {
    const token = await adminToken();

    const created = await request(app.getHttpServer())
      .post('/api/clinic-config/holidays')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-12-25', name: 'Christmas' })
      .expect(201);

    expect(created.body.data).toMatchObject({ date: '2026-12-25', name: 'Christmas' });

    const holidays = await request(app.getHttpServer()).get('/api/clinic-config/holidays').expect(200);
    expect(holidays.body.data).toHaveLength(1);

    await request(app.getHttpServer())
      .post('/api/clinic-config/holidays')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-12-25', name: 'Duplicate' })
      .expect(409);

    await request(app.getHttpServer())
      .post('/api/clinic-config/holidays')
      .set('Authorization', `Bearer ${token}`)
      .send({ date: '2020-01-01', name: 'Past' })
      .expect(400);

    await request(app.getHttpServer())
      .delete(`/api/clinic-config/holidays/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    await request(app.getHttpServer())
      .delete('/api/clinic-config/holidays/missing')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    await request(app.getHttpServer()).post('/api/clinic-config/holidays').send({ date: '2026-12-26', name: 'Boxing Day' }).expect(401);
    await request(app.getHttpServer())
      .post('/api/clinic-config/holidays')
      .set('Authorization', `Bearer ${await doctorToken()}`)
      .send({ date: '2026-12-26', name: 'Boxing Day' })
      .expect(403);
  });

  it('keeps the clinic config singleton intact across repeated updates', async () => {
    const token = await adminToken();

    await request(app.getHttpServer())
      .patch('/api/clinic-config')
      .set('Authorization', `Bearer ${token}`)
      .send({ slotDurationMinutes: 45 })
      .expect(200);

    await request(app.getHttpServer())
      .patch('/api/clinic-config')
      .set('Authorization', `Bearer ${token}`)
      .send({ reminderHoursBefore: 48 })
      .expect(200);

    const readBack = await request(app.getHttpServer()).get('/api/clinic-config').expect(200);
    expect(readBack.body.data).toMatchObject({ slotDurationMinutes: 45, reminderHoursBefore: 48 });
    expect(await prisma.clinicConfig.findMany()).toHaveLength(1);
  });
});
