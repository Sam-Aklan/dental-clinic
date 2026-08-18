import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedUser, UserRole } from '../../common/types/authenticated-user.type';

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  doctorProfileId?: string | null;
  patientProfileId?: string | null;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      doctorProfileId: payload.doctorProfileId ?? null,
      patientProfileId: payload.patientProfileId ?? null,
    };
  }
}
