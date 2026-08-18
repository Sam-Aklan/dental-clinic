import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ResetPasswordDto } from './reset-password.dto';

describe('ResetPasswordDto', () => {
  const validPayload = {
    token: 'abc123rawresettoken',
    newPassword: 'NewSecurePass1',
  };

  async function getErrors(payload: Record<string, unknown>) {
    const dto = plainToInstance(ResetPasswordDto, payload);
    const errors = await validate(dto);
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  }

  it('should pass validation for valid payload', async () => {
    const errors = await validate(plainToInstance(ResetPasswordDto, validPayload));
    expect(errors).toHaveLength(0);
  });

  it('should reject missing token', async () => {
    const { token, ...rest } = validPayload;
    const errors = await getErrors(rest);
    expect(errors).toContain('token must be a string');
  });

  it('should reject empty token', async () => {
    const errors = await getErrors({ ...validPayload, token: '' });
    expect(errors).toContain('token should not be empty');
  });

  it('should reject missing newPassword', async () => {
    const { newPassword, ...rest } = validPayload;
    const errors = await getErrors(rest);
    expect(errors).toContain('newPassword must be a string');
  });

  it('should reject newPassword under 8 characters', async () => {
    const errors = await getErrors({ ...validPayload, newPassword: 'Ab1' });
    expect(errors).toContain('newPassword must be longer than or equal to 8 characters');
  });

  it('should reject newPassword over 72 characters', async () => {
    const errors = await getErrors({
      ...validPayload,
      newPassword: 'A1' + 'a'.repeat(71),
    });
    expect(errors).toContain('newPassword must be shorter than or equal to 72 characters');
  });

  it('should reject newPassword missing uppercase', async () => {
    const errors = await getErrors({ ...validPayload, newPassword: 'newsecurepass1' });
    expect(errors).toContain('newPassword must contain at least one uppercase letter');
  });

  it('should reject newPassword missing digit', async () => {
    const errors = await getErrors({ ...validPayload, newPassword: 'NewSecurePass' });
    expect(errors).toContain('newPassword must contain at least one digit');
  });

  it('should reject non-string token', async () => {
    const errors = await getErrors({ ...validPayload, token: 12345 as unknown as string });
    expect(errors.some((m) => m.includes('token'))).toBe(true);
  });

  it('should reject unknown extra fields', async () => {
    const errors = await validate(
      plainToInstance(ResetPasswordDto, { ...validPayload, extraField: 'no' }),
      { whitelist: true, forbidNonWhitelisted: true },
    );
    const messages = errors.flatMap((e) => Object.values(e.constraints ?? {}));
    expect(messages).toContain('property extraField should not exist');
  });
});
