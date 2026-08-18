import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { Role, Locale } from '../src/generated/prisma/enums';

jest.mock('argon2', () => ({
  argon2id: 'argon2id',
  hash: jest.fn(async (value: string) => `hashed:${value}`),
  verify: jest.fn(async (hash: string, value: string) => hash === `hashed:${value}`),
}));

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let refreshTokens: Array<{
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
  }>;

  const mockUser = {
    id: 'user-e2e-1',
    email: 'patient@example.com',
    passwordHash: 'hashed:SecurePass1',
    role: Role.PATIENT,
    firstName: 'Jane',
    lastName: 'Doe',
    preferredLocale: Locale.EN,
    isActive: true,
  };

  beforeAll(async () => {
    const refreshTokenModel = {
      create: jest.fn(async ({ data }: { data: { id: string; userId: string; tokenHash: string; expiresAt: Date } }) => {
        const record = { ...data, createdAt: new Date() };
        refreshTokens.push(record);
        return record;
      }),
      deleteMany: jest.fn(async ({ where }: { where?: { id?: string; userId?: string; expiresAt?: { gt: Date } } }) => {
        const before = refreshTokens.length;
        refreshTokens = refreshTokens.filter((token) => {
          if (where?.id && token.id !== where.id) return true;
          if (where?.userId && token.userId !== where.userId) return true;
          if (where?.expiresAt?.gt && !(token.expiresAt > where.expiresAt.gt)) return true;
          return false;
        });
        return { count: before - refreshTokens.length };
      }),
      findFirst: jest.fn(async ({ where, include }: { where?: { id?: string; userId?: string; expiresAt?: { gt: Date } }; include?: { user?: { select: unknown } } }) => {
        const token = refreshTokens.find((entry) => {
          if (where?.id && entry.id !== where.id) return false;
          if (where?.userId && entry.userId !== where.userId) return false;
          if (where?.expiresAt?.gt && !(entry.expiresAt > where.expiresAt.gt)) return false;
          return true;
        });
        if (!token) return null;
        if (include?.user) {
          return { ...token, user: { id: mockUser.id, email: mockUser.email, role: mockUser.role, doctorProfile: null } };
        }
        return token;
      }),
      delete: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn().mockResolvedValue(null),
          findUniqueOrThrow: jest.fn().mockResolvedValue(mockUser),
          create: jest.fn().mockResolvedValue(mockUser),
          update: jest.fn(),
          deleteMany: jest.fn(),
        },
        patientProfile: {
          create: jest.fn().mockResolvedValue({ id: 'profile-1', userId: mockUser.id }),
        },
        refreshToken: {
          ...refreshTokenModel,
        },
        passwordResetToken: {
          create: jest.fn(),
          findFirst: jest.fn(),
          update: jest.fn(),
        },
        $transaction: jest.fn().mockImplementation(async (fn: unknown) => {
          if (typeof fn === 'function') {
            return fn({
              user: {
                create: jest.fn().mockResolvedValue(mockUser),
                update: jest.fn().mockResolvedValue(mockUser),
              },
              patientProfile: {
                create: jest.fn().mockResolvedValue({ id: 'profile-1', userId: mockUser.id }),
              },
              refreshToken: {
                ...refreshTokenModel,
              },
              passwordResetToken: {
                create: jest.fn(),
                findFirst: jest.fn(),
                update: jest.fn(),
              },
            });
          }
          return Promise.all(fn as []);
        }),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      } as any)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.use(cookieParser());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    refreshTokens = [];
  });

  describe('POST /api/auth/register', () => {
    const validPayload = {
      email: 'patient@example.com',
      password: 'SecurePass1',
      firstName: 'Jane',
      lastName: 'Doe',
    };

    it('should return 201 for valid registration', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validPayload)
        .expect(201);

      expect(res.body.statusCode).toBe(201);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(validPayload.email);
      expect(res.body.data.user.role).toBe('PATIENT');
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return 400 for invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...validPayload, email: 'not-an-email' })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining(['email must be an email']),
      );
    });

    it('should return 400 for validation errors', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'weak' })
        .expect(400);

      expect(Array.isArray(res.body.message)).toBe(true);
      expect(res.body.error).toBe('Bad Request');
    });

    it('should return 409 for duplicate email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validPayload)
        .expect(409);

      expect(res.body.message).toBe('Email already registered');
    });

    it('should default preferredLocale to EN', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(validPayload)
        .expect(201);

      expect(res.body.data.user.preferredLocale).toBe('EN');
    });

    it('should accept preferredLocale AR', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue({
        ...mockUser,
        preferredLocale: 'AR',
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...validPayload, preferredLocale: 'AR' })
        .expect(201);

      expect(res.body.data.user.preferredLocale).toBe('AR');
    });

    it('should reject unknown extra fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ ...validPayload, extraField: 'should be rejected' })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining(['property extraField should not exist']),
      );
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login, refresh, and logout with cookie rotation', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: mockUser.email, password: 'SecurePass1' })
        .expect(200);

      expect(loginResponse.body.data.accessToken).toBeDefined();
      expect(loginResponse.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('refreshToken=')]),
      );

      const loginCookie = loginResponse.headers['set-cookie'][0].split(';')[0];
      const refreshResponse = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', loginCookie)
        .expect(200);

      expect(refreshResponse.body.data.accessToken).toBeDefined();
      expect(refreshResponse.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('refreshToken=')]),
      );

      const rotatedCookie = refreshResponse.headers['set-cookie'][0].split(';')[0];
      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${refreshResponse.body.data.accessToken}`)
        .set('Cookie', rotatedCookie)
        .expect(200);

      expect(refreshTokens).toHaveLength(0);

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', rotatedCookie)
        .expect(401);
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'SecurePass1' })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining(['email must be an email']),
      );
    });

    it('should return 400 for missing password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'patient@example.com' })
        .expect(400);

      expect(Array.isArray(res.body.message)).toBe(true);
    });

    it('should return 400 for empty password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'patient@example.com', password: '' })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining(['password should not be empty']),
      );
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should return 200 for valid email format', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'patient@example.com' })
        .expect(200);

      expect(res.body.data.message).toBe('If that email exists, a reset link was sent.');
    });

    it('should return 200 for unknown email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown@example.com' })
        .expect(200);

      expect(res.body.data.message).toBe('If that email exists, a reset link was sent.');
    });

    it('should return 400 for invalid email format', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining(['email must be an email']),
      );
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should return 400 for validation failure (short password)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: 'token', newPassword: 'weak' })
        .expect(400);

      expect(Array.isArray(res.body.message)).toBe(true);
    });

    it('should return 400 for missing token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ newPassword: 'NewSecurePass1' })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining(['token must be a string']),
      );
    });

    it('should return 400 for empty token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .send({ token: '', newPassword: 'NewSecurePass1' })
        .expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining(['token should not be empty']),
      );
    });
  });
});
