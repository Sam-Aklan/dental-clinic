import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangePasswordDto } from './change-password.dto';

describe('ChangePasswordDto', () => {
  const validPayload = {
    currentPassword: 'OldPass1',
    newPassword: 'NewPass2',
  };

  const errorsOf = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(ChangePasswordDto, payload);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  };

  it('accepts a valid payload', async () => {
    expect(await errorsOf(validPayload)).toHaveLength(0);
  });

  it('rejects missing current password', async () => {
    expect(await errorsOf({ newPassword: 'NewPass2' })).toContain('currentPassword should not be empty');
  });

  it('rejects weak new password', async () => {
    const messages = await errorsOf({ ...validPayload, newPassword: 'weakpass1' });
    expect(messages).toContain('password must contain at least one uppercase letter');
    expect(messages).not.toContain('password must contain at least one digit');
  });
});
