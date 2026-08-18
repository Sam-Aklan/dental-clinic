import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SlotsQueryDto } from './slots-query.dto';

describe('SlotsQueryDto', () => {
  it('accepts a valid query', async () => {
    const dto = plainToInstance(SlotsQueryDto, {
      doctorId: 'abcdefghijklmnopqrstuvwxy',
      from: '2026-05-01',
      to: '2026-05-02',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid dates', async () => {
    const dto = plainToInstance(SlotsQueryDto, {
      doctorId: 'abcdefghijklmnopqrstuvwxy',
      from: '2026-05-01T00:00:00Z',
      to: '2026-05-02',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('accepts includeReserved when provided', async () => {
    const dto = plainToInstance(SlotsQueryDto, {
      doctorId: 'abcdefghijklmnopqrstuvwxy',
      from: '2026-05-01',
      to: '2026-05-02',
      includeReserved: 'true',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.includeReserved).toBe(true);
  });
});
