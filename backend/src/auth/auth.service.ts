import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { sanitizeUser, sanitizeUserSelect } from './types/auth-user.type';
import { Locale } from '../generated/prisma/enums';
import { Role } from '../generated/prisma/enums';
import { NotificationsService } from '../notifications/notifications.service';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function buildRefreshTokenExpiry() {
  return new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
}

type AccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  doctorProfileId?: string | null;
  patientProfileId?: string | null;
};

function buildAccessTokenPayload(user: {
  id: string;
  email: string;
  role: Role;
  doctorProfileId?: string | null;
  patientProfileId?: string | null;
}): AccessTokenPayload {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  if (user.role === Role.DOCTOR) {
    payload.doctorProfileId = user.doctorProfileId ?? null;
  }

  if (user.role === Role.PATIENT) {
    payload.patientProfileId = user.patientProfileId ?? null;
  }

  return payload;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  throwUnauthorizedRefresh(): never {
    throw new UnauthorizedException('Invalid or expired refresh token');
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
    });

    const [user] = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: Role.PATIENT,
          firstName: dto.firstName,
          lastName: dto.lastName,
          preferredLocale: dto.preferredLocale ?? Locale.EN,
        },
      });
      await tx.patientProfile.create({
        data: { userId: created.id },
      });
      return [created];
    });

    const createdUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        ...sanitizeUserSelect(),
        doctorProfile: { select: { id: true } },
        patientProfile: { select: { id: true } },
      },
    });

    const doctorProfileId = createdUser.role === Role.DOCTOR ? createdUser.doctorProfile?.id ?? null : undefined;
    const patientProfileId = createdUser.role === Role.PATIENT ? createdUser.patientProfile?.id ?? null : undefined;

    const accessToken = this.jwtService.sign(
      buildAccessTokenPayload({ ...createdUser, doctorProfileId, patientProfileId }),
    );

    return {
      accessToken,
      user: sanitizeUser(createdUser),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new ForbiddenException('account_disabled');
    }

    const refreshTokenId = crypto.randomUUID();
    const rawRefreshToken = `${refreshTokenId}.${crypto.randomBytes(32).toString('hex')}`;
    const tokenHash = await argon2.hash(rawRefreshToken, {
      type: argon2.argon2id,
    });

    await this.prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        tokenHash,
        expiresAt: buildRefreshTokenExpiry(),
      },
    });

    const sanitized = sanitizeUser(user);
    const doctorProfile = user.role === Role.DOCTOR
      ? await this.prisma.doctorProfile.findUnique({ where: { userId: user.id }, select: { id: true } })
      : null;
    const patientProfile = user.role === Role.PATIENT
      ? await this.prisma.patientProfile.findUnique({ where: { userId: user.id }, select: { id: true } })
      : null;
    const accessToken = this.jwtService.sign(
      buildAccessTokenPayload({
        ...user,
        doctorProfileId: doctorProfile?.id ?? null,
        patientProfileId: patientProfile?.id ?? null,
      }),
    );

    return {
      accessToken,
      user: sanitized,
      rawRefreshToken,
      refreshTokenMaxAge: REFRESH_TOKEN_TTL_MS,
    };
  }

  async refreshTokens(userId: string, rawRefreshToken: string) {
    const refreshTokenId = this.extractRefreshTokenId(rawRefreshToken);
    if (!refreshTokenId) {
      return null;
    }

    const matchingToken = await this.prisma.refreshToken.findFirst({
      where: { id: refreshTokenId, userId, expiresAt: { gt: new Date() } },
    });

    if (!matchingToken) {
      throw new UnauthorizedException();
    }

    const isValid = await argon2.verify(matchingToken.tokenHash, rawRefreshToken);
    if (!isValid) {
      throw new UnauthorizedException();
    }

    const deletedToken = await this.prisma.refreshToken.deleteMany({
      where: { id: matchingToken.id, userId, expiresAt: { gt: new Date() } },
    });
    if (deletedToken.count !== 1) {
      throw new UnauthorizedException();
    }

    const newRefreshTokenId = crypto.randomUUID();
    const newRawToken = `${newRefreshTokenId}.${crypto.randomBytes(32).toString('hex')}`;
    const newTokenHash = await argon2.hash(newRawToken, {
      type: argon2.argon2id,
    });

    await this.prisma.refreshToken.create({
      data: {
        id: newRefreshTokenId,
        userId,
        tokenHash: newTokenHash,
        expiresAt: buildRefreshTokenExpiry(),
      },
    });

    return {
      rawRefreshToken: newRawToken,
      refreshTokenMaxAge: REFRESH_TOKEN_TTL_MS,
    };
  }

  async refreshTokensFromCookie(rawRefreshToken: string) {
    const refreshTokenId = this.extractRefreshTokenId(rawRefreshToken);
    if (!refreshTokenId) {
      return null;
    }

    const matchingToken = await this.prisma.refreshToken.findFirst({
      where: { id: refreshTokenId, expiresAt: { gt: new Date() } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            doctorProfile: { select: { id: true } },
            patientProfile: { select: { id: true } },
          },
        },
      },
    });

    if (!matchingToken) {
      return null;
    }

    const isValid = await argon2.verify(matchingToken.tokenHash, rawRefreshToken);
    if (!isValid) {
      return null;
    }

    const result = await this.refreshTokens(matchingToken.userId, rawRefreshToken);
    if (!result) {
      return null;
    }

    const user = matchingToken.user;

    const accessToken = this.jwtService.sign(
      buildAccessTokenPayload({
        id: user.id,
        email: user.email,
        role: user.role,
        doctorProfileId: user.doctorProfile?.id ?? null,
        patientProfileId: user.patientProfile?.id ?? null,
      }),
    );

    return {
      accessToken,
      rawRefreshToken: result.rawRefreshToken,
      refreshTokenMaxAge: result.refreshTokenMaxAge,
    };
  }

  async logout(userId: string, rawRefreshToken: string) {
    const refreshTokenId = this.extractRefreshTokenId(rawRefreshToken);
    if (!refreshTokenId) {
      return;
    }

    const token = await this.prisma.refreshToken.findFirst({
      where: { id: refreshTokenId, userId, expiresAt: { gt: new Date() } },
    });

    if (!token) {
      return;
    }

    const isValid = await argon2.verify(token.tokenHash, rawRefreshToken);
    if (isValid) {
      await this.prisma.refreshToken.deleteMany({
        where: { id: token.id, userId, expiresAt: { gt: new Date() } },
      });
    }
  }

  private extractRefreshTokenId(rawRefreshToken: string) {
    const [refreshTokenId, refreshTokenSecret] = rawRefreshToken.split('.');
    if (!refreshTokenId || !refreshTokenSecret) {
      return null;
    }

    return refreshTokenId;
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: sanitizeUserSelect(),
    });

    return sanitizeUser(user);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, preferredLocale: true },
    });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      const created = await this.prisma.$transaction(async (tx) => {
        await tx.passwordResetToken.deleteMany({
          where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
        });

        return tx.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000),
          },
        });
      });

      await this.notificationsService.queuePasswordReset({
        userId: user.id,
        tokenId: created.id,
        resetUrl: `${this.configService.getOrThrow<string>('FRONTEND_URL').replace(/\/$/, '')}/reset-password?token=${rawToken}`,
        locale: user.preferredLocale === Locale.AR ? 'ar' : 'en',
      });
    }

    return {
      message: 'If that email exists, a reset link was sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
    });

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    return {
      message: 'Password updated.',
    };
  }
}
