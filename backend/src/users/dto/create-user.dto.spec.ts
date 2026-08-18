import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { Locale, Role } from '../../generated/prisma/enums';

describe('CreateUserDto', () => {
  const validPayload = {
    email: 'jane.doe@clinic.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: Role.RECEPTIONIST,
    password: 'SecurePass1',
    preferredLocale: Locale.EN,
  };

  const errorsOf = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(CreateUserDto, payload);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  };

  it('accepts a valid payload', async () => {
    expect(await errorsOf(validPayload)).toHaveLength(0);
  });

  it('rejects invalid email', async () => {
    expect(await errorsOf({ ...validPayload, email: 'bad' })).toContain('email must be an email');
  });

  it('rejects blank names', async () => {
    expect(await errorsOf({ ...validPayload, firstName: '' })).toContain('firstName must be longer than or equal to 1 characters');
  });

  it('rejects password without uppercase or digit', async () => {
    const messages = await errorsOf({ ...validPayload, password: 'securepass1' });
    expect(messages).toContain('password must contain at least one uppercase letter');
    expect(messages).not.toContain('password must contain at least one digit');
  });

  it('rejects extra fields', async () => {
    expect(await errorsOf({ ...validPayload, extra: true })).toContain('property extra should not exist');
  });
});
