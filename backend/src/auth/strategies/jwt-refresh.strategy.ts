import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { AuthenticatedUser, UserRole } from '../../common/types/authenticated-user.type';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => {
        return req.cookies?.refreshToken ?? null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<AuthenticatedUser & { rawRefreshToken: string }> {
    const rawRefreshToken = req.cookies?.refreshToken ?? '';
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      rawRefreshToken,
    };
  }
}
