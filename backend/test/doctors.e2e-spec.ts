import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe.skip('Doctors E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn(), create: jest.fn(), update: jest.fn() },
        doctorProfile: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), findUniqueOrThrow: jest.fn(), create: jest.fn(), update: jest.fn() },
        doctorScheduleOverride: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
        auditLog: { create: jest.fn() },
        $transaction: jest.fn().mockImplementation(async (fn: unknown) => (typeof fn === 'function' ? fn({}) : Promise.all(fn as []))),
      } as any)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('boots the doctors routes', async () => {
    await request(app.getHttpServer()).get('/api/doctors').expect(200);
  });
});
