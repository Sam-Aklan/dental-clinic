import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateScheduleOverrideDto } from './create-schedule-override.dto';

describe('CreateScheduleOverrideDto', () => {
  const errorsOf = async (input: Record<string, unknown>) => {
    const dto = plainToInstance(CreateScheduleOverrideDto, input);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  };

  it('accepts a valid full-day override', async () => {
    expect(await errorsOf({ date: '2026-07-01', isUnavailable: true })).toHaveLength(0);
  });

  it('accepts a valid partial-day override', async () => {
    expect(await errorsOf({ date: '2026-07-01', isUnavailable: false, startTime: '09:00', endTime: '13:00' })).toHaveLength(0);
  });
});
