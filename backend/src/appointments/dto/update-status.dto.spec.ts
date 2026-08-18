import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateStatusDto } from './update-status.dto';

describe('UpdateStatusDto', () => {
  it('accepts a valid status', async () => {
    const dto = plainToInstance(UpdateStatusDto, { status: 'CONFIRMED' });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts the follow-up flag', async () => {
    const dto = plainToInstance(UpdateStatusDto, { status: 'COMPLETED', needsFollowUp: true });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid status', async () => {
    const dto = plainToInstance(UpdateStatusDto, { status: 'BROKEN' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
