import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';

describe('Waitlist E2E', () => {
  let app: INestApplication;

  const doctorId = 'aaaaaaaaaaaaaaaaaaaaaaaaa';
  const patientProfileId = 'bbbbbbbbbbbbbbbbbbbbbbbbb';

  const prismaMock = {
    doctorProfile: { findUnique: jest.fn().mockResolvedValue({ id: doctorId, user: { firstName: 'Doc', lastName: 'Tor' }, specialization: 'General' }) },
    waitlistEntry: {
      aggregate: jest.fn().mockResolvedValue({ _max: { position: 0 } }),
      create: jest.fn().mockResolvedValue({ id: 'entry-1', patientProfileId: patientProfileId, doctorProfileId: doctorId, position: 1, availableFrom: null, availableUntil: null, createdAt: new Date(), doctorProfile: { id: doctorId, user: { firstName: 'Doc', lastName: 'Tor' }, specialization: 'General' }, waitlistOffers: [] }),
      findUnique: jest.fn().mockResolvedValue({ id: 'entry-1', patientProfileId: patientProfileId, doctorProfileId: doctorId, position: 1, availableFrom: null, availableUntil: null, createdAt: new Date(), doctorProfile: { id: doctorId, user: { firstName: 'Doc', lastName: 'Tor' }, specialization: 'General' }, waitlistOffers: [] }),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      update: jest.fn().mockResolvedValue({ id: 'entry-1', patientProfileId: patientProfileId, doctorProfileId: doctorId, position: 1, availableFrom: null, availableUntil: null, createdAt: new Date(), doctorProfile: { id: doctorId, user: { firstName: 'Doc', lastName: 'Tor' }, specialization: 'General' }, waitlistOffers: [] }),
      delete: jest.fn().mockResolvedValue({}),
    },
    waitlistOffer: { findUnique: jest.fn(), update: jest.fn() },
    appointment: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    $transaction: jest.fn(async (fn: any) => fn(prismaMock)),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.use((req: any, _res: any, next: any) => {
      const role = req.header('x-role') ?? 'PATIENT';
      req.user = { userId: 'user-1', role, patientProfileId, doctorProfileId: doctorId };
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('joins a waitlist entry', async () => {
    const res = await request(app.getHttpServer()).post('/api/waitlist').set('x-role', 'PATIENT').send({ doctorId }).expect(201);
    expect(res.body.data.id).toBe('entry-1');
  });

  it('rejects doctor access to waitlist list', async () => {
    await request(app.getHttpServer()).get('/api/waitlist').set('x-role', 'DOCTOR').expect(403);
  });

  it('includes the pending offer id in the waitlist list response', async () => {
    prismaMock.waitlistEntry.findMany.mockResolvedValueOnce([
      {
        id: 'entry-2',
        patientProfileId,
        doctorProfileId: doctorId,
        position: 2,
        availableFrom: null,
        availableUntil: null,
        createdAt: new Date('2026-05-19T08:00:00.000Z'),
        doctorProfile: { id: doctorId, user: { firstName: 'Doc', lastName: 'Tor' }, specialization: 'General' },
        waitlistOffers: [{ id: 'offer-1' }],
      },
    ]);
    prismaMock.waitlistEntry.count.mockResolvedValueOnce(1);

    const res = await request(app.getHttpServer()).get('/api/waitlist').set('x-role', 'PATIENT').expect(200);

    expect(res.body.data.items[0].pendingOffer).toEqual({ id: 'offer-1' });
  });
});
