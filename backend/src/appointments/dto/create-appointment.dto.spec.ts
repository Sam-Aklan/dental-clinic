import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAppointmentDto } from './create-appointment.dto';

describe('CreateAppointmentDto', () => {
  it('accepts valid payload', async () => {
    const dto = plainToInstance(CreateAppointmentDto, {
      doctorId: 'abcdefghijklmnopqrstuvwxy',
      startsAt: '2026-05-01T10:00:00.000Z',
      patientId: 'bcdefghijklmnopqrstuvwxyz',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects missing startsAt', async () => {
    const dto = plainToInstance(CreateAppointmentDto, {
      doctorId: 'abcdefghijklmnopqrstuvwxy',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
