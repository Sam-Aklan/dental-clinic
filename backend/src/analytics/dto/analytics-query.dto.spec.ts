import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BucketedRangeQueryDto } from './bucketed-range-query.dto';
import { CancellationTrendsQueryDto } from './cancellation-trends-query.dto';
import { DateRangeQueryDto } from './date-range-query.dto';
import { FollowUpsQueryDto } from './follow-ups-query.dto';
import { MyStatsQueryDto } from './my-stats-query.dto';
import { MyTrendsQueryDto } from './my-trends-query.dto';

describe('analytics query DTOs', () => {
  it('accepts date-only ranges and rejects invalid range inputs', async () => {
    await expect(validate(plainToInstance(DateRangeQueryDto, { from: '2026-01-01', to: '2026-01-31' }))).resolves.toHaveLength(0);

    const missing = await validate(plainToInstance(DateRangeQueryDto, { to: '2026-01-31' }));
    expect(missing.length).toBeGreaterThan(0);

    const invalid = await validate(plainToInstance(DateRangeQueryDto, { from: '2026-01-01T10:00:00Z', to: 'not-a-date' }));
    expect(invalid.length).toBeGreaterThan(0);

    const extra = await validate(plainToInstance(DateRangeQueryDto, { from: '2026-01-01', to: '2026-01-31', extra: 'nope' }), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(extra.length).toBeGreaterThan(0);
  });

  it('validates analytics bucket choices', async () => {
    await expect(validate(plainToInstance(BucketedRangeQueryDto, { from: '2026-01-01', to: '2026-02-28', bucket: 'month' }))).resolves.toHaveLength(0);
    const invalidBucket = await validate(plainToInstance(BucketedRangeQueryDto, { from: '2026-01-01', to: '2026-01-31', bucket: 'quarter' } as never));
    expect(invalidBucket.length).toBeGreaterThan(0);

    await expect(validate(plainToInstance(CancellationTrendsQueryDto, { from: '2026-01-01', to: '2026-01-31', bucket: 'day' }))).resolves.toHaveLength(0);
    const month = await validate(plainToInstance(CancellationTrendsQueryDto, { from: '2026-01-01', to: '2026-01-31', bucket: 'month' } as never));
    expect(month.length).toBeGreaterThan(0);
  });

  it('transforms follow-up pagination defaults and limits', async () => {
    const dto = plainToInstance(FollowUpsQueryDto, { thresholdDays: '120', page: '2', pageSize: '25' });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.thresholdDays).toBe(120);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(25);

    const defaults = plainToInstance(FollowUpsQueryDto, {});
    await expect(validate(defaults)).resolves.toHaveLength(0);
    expect(defaults.thresholdDays).toBe(90);
    expect(defaults.page).toBe(1);
    expect(defaults.pageSize).toBe(20);
  });

  it('handles doctor-specific query DTOs', async () => {
    await expect(validate(plainToInstance(MyStatsQueryDto, {}))).resolves.toHaveLength(0);
    await expect(validate(plainToInstance(MyStatsQueryDto, { date: '2026-05-16' }))).resolves.toHaveLength(0);

    await expect(validate(plainToInstance(MyTrendsQueryDto, { week: '2026-05-16' }))).resolves.toHaveLength(0);
    const missingWeek = await validate(plainToInstance(MyTrendsQueryDto, {}));
    expect(missingWeek.length).toBeGreaterThan(0);
  });
});
