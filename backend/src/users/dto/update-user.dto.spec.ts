import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';
import { Locale, Role } from '../../generated/prisma/enums';

describe('UpdateUserDto', () => {
  const validPayload = {
    firstName: 'Janet',
    lastName: 'Doe',
    phone: null,
    role: Role.DOCTOR,
    preferredLocale: Locale.AR,
    dateOfBirth: '1990-06-15',
  };

  const errorsOf = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(UpdateUserDto, payload);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  };

  it('accepts null phone clearing', async () => {
    expect(await errorsOf(validPayload)).toHaveLength(0);
  });

  it('rejects invalid dateOfBirth', async () => {
    expect(await errorsOf({ ...validPayload, dateOfBirth: 'not-a-date' })).toContain('dateOfBirth must be a valid ISO 8601 date string');
  });

  it('rejects extra fields', async () => {
    expect(await errorsOf({ ...validPayload, extra: 'x' })).toContain('property extra should not exist');
  });
});
