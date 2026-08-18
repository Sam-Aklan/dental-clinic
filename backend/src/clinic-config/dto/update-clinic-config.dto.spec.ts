import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateClinicConfigDto } from './update-clinic-config.dto';

describe('UpdateClinicConfigDto', () => {
  const errorsOf = async (input: Record<string, unknown>) => {
    const dto = plainToInstance(UpdateClinicConfigDto, input);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
  };

  it('accepts a valid partial update', async () => {
    expect(await errorsOf({ slotDurationMinutes: 30, timeZone: 'UTC' })).toHaveLength(0);
  });

  it('rejects invalid timezone values', async () => {
    expect(await errorsOf({ timeZone: 'Mars/Phobos' })).not.toHaveLength(0);
  });

  it('rejects slot durations that are not multiples of 5', async () => {
    expect(await errorsOf({ slotDurationMinutes: 26 })).not.toHaveLength(0);
  });

  it('rejects extra properties', async () => {
    expect(await errorsOf({ timeZone: 'UTC', extra: true })).not.toHaveLength(0);
  });
});
