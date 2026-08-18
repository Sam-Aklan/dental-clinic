import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsCalendarDate } from './is-calendar-date.decorator';

class CalendarDateDto {
  @IsCalendarDate()
  date!: string;
}

describe('IsCalendarDate', () => {
  it('accepts YYYY-MM-DD values', async () => {
    const dto = plainToInstance(CalendarDateDto, { date: '2026-12-25' });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects time-bearing values', async () => {
    const dto = plainToInstance(CalendarDateDto, { date: '2026-12-25T10:00:00Z' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
