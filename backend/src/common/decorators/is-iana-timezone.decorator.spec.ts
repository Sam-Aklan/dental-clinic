import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsIanaTimezone } from './is-iana-timezone.decorator';

class TimeZoneDto {
  @IsIanaTimezone()
  timeZone!: string;
}

describe('IsIanaTimezone', () => {
  it('accepts a supported timezone', async () => {
    const dto = plainToInstance(TimeZoneDto, { timeZone: 'UTC' });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an unsupported timezone', async () => {
    const dto = plainToInstance(TimeZoneDto, { timeZone: 'Mars/Phobos' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
