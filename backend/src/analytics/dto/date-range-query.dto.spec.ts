import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DateRangeQueryDto } from './date-range-query.dto';

describe('DateRangeQueryDto', () => {
  it('accepts valid ISO date-only strings', async () => {
    const dto = plainToInstance(DateRangeQueryDto, { from: '2026-01-01', to: '2026-01-31' });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects missing dates and invalid values', async () => {
    const missing = await validate(plainToInstance(DateRangeQueryDto, { to: '2026-01-31' }));
    expect(missing.length).toBeGreaterThan(0);

    const invalid = await validate(plainToInstance(DateRangeQueryDto, { from: '2026-01-01T00:00:00Z', to: 'nope' }));
    expect(invalid.length).toBeGreaterThan(0);
  });

  it('rejects unknown query fields when whitelisting is enabled', async () => {
    const errors = await validate(plainToInstance(DateRangeQueryDto, { from: '2026-01-01', to: '2026-01-31', extra: 'value' }), {
      whitelist: true,
      forbidNonWhitelisted: true,
    });
    expect(errors.length).toBeGreaterThan(0);
  });
});
