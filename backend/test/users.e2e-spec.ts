import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe.skip('Users e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.patientProfile.deleteMany({});
    await prisma.doctorProfile.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.user.deleteMany({ where: { email: { not: 'admin@clinic.com' } } });
  });

  afterAll(async () => {
    await app.close();
  });

  it('scaffold for admin create flow', async () => {
    await request(app.getHttpServer()).get('/api/users');
  });
});
