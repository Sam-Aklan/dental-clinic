import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateScheduleOverrideDto } from './update-schedule-override.dto';

describe('UpdateScheduleOverrideDto', () => {
  it('allows partial update input', async () => {
    const dto = plainToInstance(UpdateScheduleOverrideDto, { reason: 'Updated' });
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors).toHaveLength(0);
  });
});
