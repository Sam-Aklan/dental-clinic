import jwt from 'jsonwebtoken';
import { KioskTokenService } from './kiosk-token.service';

describe('KioskTokenService', () => {
  const createService = (secret: string) => {
    const configService = { getOrThrow: jest.fn().mockReturnValue(secret) };
    return new KioskTokenService(configService as never);
  };

  it('signs and verifies kiosk tokens', () => {
    const service = createService('secret-one');
    const token = service.sign('doctor-1', 30);

    const payload = service.verify(token);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('doctor-1');
    expect(payload?.type).toBe('kiosk');
  });

  it('returns null for expired, malformed, wrong-secret, or wrong-type tokens', () => {
    const service = createService('secret-one');
    const otherService = createService('secret-two');

    const expired = jwt.sign({ sub: 'doctor-1', type: 'kiosk' }, 'secret-one', { expiresIn: '-1s' });
    const wrongType = jwt.sign({ sub: 'doctor-1', type: 'other' }, 'secret-one', { expiresIn: '1d' });
    const signed = service.sign('doctor-1', 30);

    expect(service.verify(expired)).toBeNull();
    expect(service.verify('not-a-token')).toBeNull();
    expect(otherService.verify(signed)).toBeNull();
    expect(service.verify(wrongType)).toBeNull();
  });
});
