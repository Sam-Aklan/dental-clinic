import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateFollowUpDto } from './create-follow-up.dto';

describe('CreateFollowUpDto', () => {
  it('accepts a valid payload', async () => {
    const dto = plainToInstance(CreateFollowUpDto, {
      patientId: 'abcdefghijklmnopqrstuvwxy',
      doctorId: 'bcdefghijklmnopqrstuvwxyz',
      startsAt: '2026-06-20T08:00:00.000Z',
      reason: 'Review healing progress',
      notes: 'Check implant site',
      sourceAppointmentId: 'cdefghijklmnopqrstuvwxyz1',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects an empty reason', async () => {
    const dto = plainToInstance(CreateFollowUpDto, {
      patientId: 'abcdefghijklmnopqrstuvwxy',
      doctorId: 'bcdefghijklmnopqrstuvwxyz',
      startsAt: '2026-06-20T08:00:00.000Z',
      reason: '   ',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
