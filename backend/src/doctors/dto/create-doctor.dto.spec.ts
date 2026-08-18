import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDoctorDto } from './create-doctor.dto';
import { Locale } from '../../generated/prisma/enums';

describe('CreateDoctorDto', () => {
  const payload = {
    email: 'doctor@example.com',
    firstName: 'Sara',
    lastName: 'Ahmed',
    password: 'SecurePass1',
    preferredLocale: Locale.EN,
  };

  const errorsOf = async (input: Record<string, unknown>) => {
    const dto = plainToInstance(CreateDoctorDto, input);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  };

  it('accepts a valid payload', async () => {
    expect(await errorsOf(payload)).toHaveLength(0);
  });

  it('rejects invalid password rules', async () => {
    const messages = await errorsOf({ ...payload, password: 'securepass1' });
    expect(messages).toContain('password must contain at least one uppercase letter');
  });

  it('allows nullable optional profile fields', async () => {
    expect(await errorsOf({ ...payload, specialization: null, bio: null, phone: null })).toHaveLength(0);
  });
});
