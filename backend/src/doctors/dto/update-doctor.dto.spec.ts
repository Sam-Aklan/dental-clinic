import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateDoctorDto } from './update-doctor.dto';
import { Locale } from '../../generated/prisma/enums';

describe('UpdateDoctorDto', () => {
  const errorsOf = async (input: Record<string, unknown>) => {
    const dto = plainToInstance(UpdateDoctorDto, input);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  };

  it('accepts nullable values', async () => {
    expect(await errorsOf({ phone: null, specialization: null, bio: null, preferredLocale: Locale.AR })).toHaveLength(0);
  });

  it('rejects invalid phone format', async () => {
    expect(await errorsOf({ phone: 'bad' })).toContain('phone must match /^\\+?[0-9\\s\\-().]{7,20}$/ regular expression');
  });
});
