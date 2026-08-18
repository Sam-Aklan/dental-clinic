import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateHolidayDto } from './create-holiday.dto';

describe('CreateHolidayDto', () => {
  const errorsOf = async (input: Record<string, unknown>) => {
    const dto = plainToInstance(CreateHolidayDto, input);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
  };

  it('accepts a valid holiday', async () => {
    expect(await errorsOf({ date: '2026-12-25', name: 'Christmas' })).toHaveLength(0);
  });

  it('rejects time-bearing date values', async () => {
    expect(await errorsOf({ date: '2026-12-25T10:00:00Z', name: 'Christmas' })).not.toHaveLength(0);
  });

  it('rejects blank names', async () => {
    expect(await errorsOf({ date: '2026-12-25', name: '   ' })).not.toHaveLength(0);
  });

  it('rejects extra properties', async () => {
    expect(await errorsOf({ date: '2026-12-25', name: 'Christmas', extra: true })).not.toHaveLength(0);
  });
});
