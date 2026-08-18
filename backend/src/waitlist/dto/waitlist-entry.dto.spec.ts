import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JoinWaitlistDto, UpdateWindowDto, WaitlistQueryDto } from './index';

describe('Waitlist DTO validation', () => {
  it('rejects partial join windows', async () => {
    const dto = plainToInstance(JoinWaitlistDto, { doctorId: 'aaaaaaaaaaaaaaaaaaaaaaaaa', availableFrom: '09:00' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects invalid time formatting', async () => {
    const dto = plainToInstance(UpdateWindowDto, { availableFrom: '25:00', availableUntil: '26:00' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('applies pagination defaults and bounds', async () => {
    const dto = plainToInstance(WaitlistQueryDto, { pageSize: 200 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
