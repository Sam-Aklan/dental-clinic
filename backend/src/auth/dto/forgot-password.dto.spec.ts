import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ForgotPasswordDto } from './forgot-password.dto';

describe('ForgotPasswordDto', () => {
  const validPayload = { email: 'patient@example.com' };

  async function getErrors(payload: Record<string, unknown>) {
    const dto = plainToInstance(ForgotPasswordDto, payload);
    const errors = await validate(dto);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  }

  it('should pass validation for valid email', async () => {
    const errors = await validate(plainToInstance(ForgotPasswordDto, validPayload));
    expect(errors).toHaveLength(0);
  });

  it('should reject malformed email', async () => {
    const errors = await getErrors({ email: 'not-an-email' });
    expect(errors).toContain('email must be an email');
  });

  it('should reject missing email', async () => {
    const errors = await getErrors({});
    expect(errors).toContain('email must be an email');
  });

  it('should reject non-string email', async () => {
    const errors = await getErrors({ email: 12345 as unknown as string });
    expect(errors.some((m) => m.includes('email'))).toBe(true);
  });

  it('should reject unknown extra fields', async () => {
    const errors = await validate(
      plainToInstance(ForgotPasswordDto, { ...validPayload, extraField: 'no' }),
      { whitelist: true, forbidNonWhitelisted: true },
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages).toContain('property extraField should not exist');
  });
});
