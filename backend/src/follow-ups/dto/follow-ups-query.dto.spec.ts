import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FollowUpsQueryDto } from './follow-ups-query.dto';

describe('FollowUpsQueryDto', () => {
  it('accepts filters and pagination', async () => {
    const dto = plainToInstance(FollowUpsQueryDto, {
      doctorId: 'abcdefghijklmnopqrstuvwxy',
      patientId: 'bcdefghijklmnopqrstuvwxyz',
      patientName: 'Sara',
      status: 'SCHEDULED,COMPLETED',
      from: '2026-06-01',
      to: '2026-06-30',
      overdueOnly: 'false',
      page: '2',
      pageSize: '25',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.status).toEqual(['SCHEDULED', 'COMPLETED']);
    expect(dto.page).toBe(2);
    expect(dto.pageSize).toBe(25);
  });

  it('rejects invalid page sizes', async () => {
    const dto = plainToInstance(FollowUpsQueryDto, { pageSize: '0' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
