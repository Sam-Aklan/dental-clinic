import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  const validPayload = {
    email: 'patient@example.com',
    password: 'SecurePass1',
  };

  async function getErrors(payload: Record<string, unknown>) {
    const dto = plainToInstance(LoginDto, payload);
    const errors = await validate(dto);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  }

  it('should pass validation for valid payload', async () => {
    const errors = await validate(plainToInstance(LoginDto, validPayload));
    expect(errors).toHaveLength(0);
  });

  it('should reject malformed email', async () => {
    const errors = await getErrors({ ...validPayload, email: 'not-an-email' });
    expect(errors).toContain('email must be an email');
  });

  it('should reject missing email', async () => {
    const { email, ...rest } = validPayload;
    const errors = await getErrors(rest);
    expect(errors).toContain('email must be an email');
  });

  it('should reject missing password', async () => {
    const { password, ...rest } = validPayload;
    const errors = await getErrors(rest);
    expect(errors).toContain('password must be a string');
  });

  it('should reject empty password', async () => {
    const errors = await getErrors({ ...validPayload, password: '' });
    expect(errors).toContain('password should not be empty');
  });

  it('should reject non-string password', async () => {
    const errors = await getErrors({ ...validPayload, password: 12345 as unknown as string });
    expect(errors.some((m) => m.includes('password'))).toBe(true);
  });

  it('should reject unknown extra fields', async () => {
    const errors = await validate(
      plainToInstance(LoginDto, { ...validPayload, extraField: 'no' }),
      { whitelist: true, forbidNonWhitelisted: true },
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages).toContain('property extraField should not exist');
  });
});
