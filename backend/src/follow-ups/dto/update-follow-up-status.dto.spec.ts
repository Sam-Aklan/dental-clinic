import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FollowUpStatus } from '../../generated/prisma/enums';
import { UpdateFollowUpStatusDto } from './update-follow-up-status.dto';

describe('UpdateFollowUpStatusDto', () => {
  it('accepts terminal statuses', async () => {
    const dto = plainToInstance(UpdateFollowUpStatusDto, { status: FollowUpStatus.CANCELED, cancelReason: 'Patient requested cancellation' });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects unsupported statuses', async () => {
    const dto = plainToInstance(UpdateFollowUpStatusDto, { status: FollowUpStatus.SCHEDULED as FollowUpStatus });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
