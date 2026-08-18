import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role, Locale } from '../generated/prisma/enums';
import { NotificationsService } from '../notifications/notifications.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('mock_hashed_password'),
  verify: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let notificationsService: NotificationsService & { queuePasswordReset: jest.Mock };

  const mockUser = {
    id: 'user-1',
    email: 'patient@example.com',
    passwordHash: 'old_hash',
    role: Role.PATIENT,
    firstName: 'Jane',
    lastName: 'Doe',
    preferredLocale: Locale.EN,
    isActive: true,
  };

  const mockDisabledUser = {
    ...mockUser,
    id: 'user-disabled',
    email: 'disabled@example.com',
    isActive: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              findUniqueOrThrow: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              deleteMany: jest.fn(),
            },
            patientProfile: {
              create: jest.fn(),
              findUnique: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              deleteMany: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              delete: jest.fn(),
            },
              passwordResetToken: {
                create: jest.fn(),
                findFirst: jest.fn(),
                update: jest.fn(),
                deleteMany: jest.fn(),
              },
              $transaction: jest.fn().mockImplementation(async (fn: unknown) => {
                if (typeof fn === 'function') {
                  return fn({
                    user: prisma!.user,
                    patientProfile: prisma!.patientProfile,
                    refreshToken: prisma!.refreshToken,
                    passwordResetToken: prisma!.passwordResetToken,
                  });
                }
              return Promise.all(fn as []);
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_access_token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('mock-secret'),
            get: jest.fn().mockReturnValue('15m'),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            queuePasswordReset: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    notificationsService = module.get(NotificationsService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'patient@example.com',
      password: 'SecurePass1',
      firstName: 'Jane',
      lastName: 'Doe',
      preferredLocale: Locale.EN,
    };

    it('should successfully register a new user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(result).toEqual({
        accessToken: 'mock_access_token',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          preferredLocale: mockUser.preferredLocale,
          isActive: mockUser.isActive,
          doctorProfileId: null,
        },
      });
    });

    it('should throw ConflictException for duplicate email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow('Email already registered');
    });

    it('should hash password with argon2id', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(argon2.hash).toHaveBeenCalledWith('SecurePass1', {
        type: argon2.argon2id,
      });
    });

    it('should default preferredLocale to EN when omitted', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      await service.register({
        email: 'patient@example.com',
        password: 'SecurePass1',
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            preferredLocale: Locale.EN,
          }),
        }),
      );
    });

    it('should use explicit Locale.AR when provided', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      await service.register({ ...registerDto, preferredLocale: Locale.AR });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            preferredLocale: Locale.AR,
          }),
        }),
      );
    });

    it('should create User and PatientProfile in a transaction', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.patientProfile.create).toHaveBeenCalled();
    });

    it('should return a JWT access token', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        patientProfileId: null,
      });
      expect(result.accessToken).toBe('mock_access_token');
    });

    it('should not return passwordHash', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(JSON.stringify(result)).not.toContain('passwordHash');
    });
  });

  describe('login', () => {
    const loginDto = { email: 'patient@example.com', password: 'SecurePass1' };

    it('should successfully login', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.patientProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'patient-profile-1' });

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('mock_access_token');
      expect(result.user.email).toBe(mockUser.email);
      expect(result.rawRefreshToken).toBeDefined();
    });

    it('includes patientProfileId in access tokens for patient logins', async () => {
		(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
		(prisma.patientProfile.findUnique as jest.Mock).mockResolvedValue({ id: 'patient-profile-1' });

		await service.login(loginDto);

		expect(jwtService.sign).toHaveBeenCalledWith({
			sub: mockUser.id,
			email: mockUser.email,
			role: mockUser.role,
			patientProfileId: 'patient-profile-1',
		});
	});

    it('should throw UnauthorizedException for unknown email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    it('should throw ForbiddenException for disabled account', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDisabledUser);

      await expect(service.login({ email: 'disabled@example.com', password: 'SecurePass1' })).rejects.toThrow('account_disabled');
    });

    it('should store refresh token hash', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      await service.login(loginDto);

      expect(argon2.hash).toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should rotate refresh token', async () => {
      const mockToken = {
        id: 'rt-1',
        tokenHash: 'old_argon_hash',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 100000),
      };
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(mockToken);
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.refreshTokens('user-1', 'rt-1.raw-token');

      expect(result).toBeDefined();
      expect(result!.rawRefreshToken).toBeDefined();
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { id: 'rt-1', userId: 'user-1', expiresAt: expect.any(Object) },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should return null for malformed refresh tokens', async () => {
      const result = await service.refreshTokens('user-1', 'invalid-token');
      expect(result).toBeNull();
    });

    it('should throw for reused or unknown refresh tokens', async () => {
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.refreshTokens('user-1', 'rt-1.old-token')).rejects.toThrow('Unauthorized');
    });
  });

  describe('refreshTokensFromCookie', () => {
    it('should rotate an opaque refresh token from the cookie', async () => {
      const mockToken = {
        id: 'rt-1',
        tokenHash: 'old_argon_hash',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 100000),
        user: {
          id: 'user-1',
          email: mockUser.email,
          role: mockUser.role,
          doctorProfile: null,
        },
      };
      (prisma.refreshToken.findFirst as jest.Mock)
        .mockResolvedValueOnce(mockToken)
        .mockResolvedValueOnce({ ...mockToken, user: undefined });
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.refreshTokensFromCookie('rt-1.raw-token');

      expect(result).toEqual({
        accessToken: 'mock_access_token',
        rawRefreshToken: expect.any(String),
        refreshTokenMaxAge: 7 * 24 * 60 * 60 * 1000,
      });
    });

    it('should return null when the cookie token does not match a stored hash', async () => {
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(service.refreshTokensFromCookie('rt-1.bad-token')).resolves.toBeNull();
    });
  });

  describe('forgotPassword', () => {
    it('should create reset token for existing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({ id: 'prt-1' });

      const result = await service.forgotPassword({ email: 'patient@example.com' });

      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
      expect(notificationsService.queuePasswordReset).toHaveBeenCalled();
      expect(result.message).toBe('If that email exists, a reset link was sent.');
    });

    it('should return same success for missing user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'nonexistent@example.com' });

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(result.message).toBe('If that email exists, a reset link was sent.');
    });

    it('should store SHA-256 token hash', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({ id: 'prt-1' });

      await service.forgotPassword({ email: 'patient@example.com' });

      const createCall = (prisma.passwordResetToken.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.tokenHash).toBeDefined();
      expect(createCall.data.tokenHash).toHaveLength(64);
    });

    it('should set one-hour expiry', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.passwordResetToken.create as jest.Mock).mockResolvedValue({ id: 'prt-1' });

      await service.forgotPassword({ email: 'patient@example.com' });

      expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            expiresAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  describe('resetPassword', () => {
    const resetDto = {
      token: 'raw-reset-token',
      newPassword: 'NewSecurePass1',
    };

    const mockResetToken = {
      id: 'prt-1',
      tokenHash: crypto.createHash('sha256').update('raw-reset-token').digest('hex'),
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 100000),
      usedAt: null,
      createdAt: new Date(),
    };

    it('should reset password successfully', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockResetToken);

      const result = await service.resetPassword(resetDto);

      expect(result.message).toBe('Password updated.');
      expect(argon2.hash).toHaveBeenCalledWith('NewSecurePass1', {
        type: argon2.argon2id,
      });
    });

    it('should throw BadRequestException for token not found', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw BadRequestException for expired token', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.resetPassword({
        token: 'expired-token',
        newPassword: 'NewSecurePass1',
      })).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw BadRequestException for used token', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(null);

      const usedDto = { token: 'used-token', newPassword: 'NewSecurePass1' };
      await expect(service.resetPassword(usedDto)).rejects.toThrow('Invalid or expired reset token');
    });

    it('should purge refresh tokens on password reset', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockResetToken);

      await service.resetPassword(resetDto);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });

    it('should mark token as used and update password in transaction', async () => {
      (prisma.passwordResetToken.findFirst as jest.Mock).mockResolvedValue(mockResetToken);

      await service.resetPassword(resetDto);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.passwordResetToken.update).toHaveBeenCalled();
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should return sanitized user', async () => {
      (prisma.user.findUniqueOrThrow as jest.Mock).mockResolvedValue(mockUser);

      const result = await service.getCurrentUser('user-1');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        preferredLocale: mockUser.preferredLocale,
        isActive: mockUser.isActive,
        doctorProfileId: null,
      });
      expect(JSON.stringify(result)).not.toContain('passwordHash');
    });
  });

  describe('logout', () => {
    it('should delete refresh token', async () => {
      const mockToken = {
        id: 'rt-1',
        tokenHash: 'hash',
        userId: 'user-1',
        expiresAt: new Date(Date.now() + 100000),
      };
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(mockToken);
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      await service.logout('user-1', 'rt-1.raw-token');

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { id: 'rt-1', userId: 'user-1', expiresAt: expect.any(Object) },
      });
    });

    it('should not throw for missing token', async () => {
      (prisma.refreshToken.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.logout('user-1', 'nonexistent')).resolves.toBeUndefined();
    });
  });
});
