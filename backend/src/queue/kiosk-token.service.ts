import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import jwt, { JwtPayload } from 'jsonwebtoken';

type KioskTokenPayload = JwtPayload & {
  sub: string;
  type: 'kiosk';
};

@Injectable()
export class KioskTokenService {
  constructor(private readonly configService: ConfigService) {}

  sign(doctorId: string, expiresInDays: number): string {
    return jwt.sign({ sub: doctorId, type: 'kiosk' }, this.configService.getOrThrow<string>('KIOSK_TOKEN_SECRET'), {
      expiresIn: `${expiresInDays}d`,
    });
  }

  verify(token: string): KioskTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.configService.getOrThrow<string>('KIOSK_TOKEN_SECRET')) as KioskTokenPayload;
      if (payload?.type !== 'kiosk' || typeof payload.sub !== 'string' || !payload.sub) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}
