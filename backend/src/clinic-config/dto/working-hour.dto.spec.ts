import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { WorkingHourDto } from './working-hour.dto';

describe('WorkingHourDto', () => {
  const errorsOf = async (input: Record<string, unknown>) => {
    const dto = plainToInstance(WorkingHourDto, input);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    return errors.flatMap((error) => Object.values(error.constraints ?? {}));
  };

  it('accepts a valid open day', async () => {
    expect(await errorsOf({ dayOfWeek: 1, isClosed: false, startTime: '09:00', endTime: '17:00' })).toHaveLength(0);
  });

  it('accepts a valid closed day', async () => {
    expect(await errorsOf({ dayOfWeek: 0, isClosed: true, startTime: null, endTime: null })).toHaveLength(0);
  });

  it('rejects invalid weekdays', async () => {
    expect(await errorsOf({ dayOfWeek: 7, isClosed: true })).not.toHaveLength(0);
  });

  it('rejects invalid booleans and time formats', async () => {
    expect(await errorsOf({ dayOfWeek: 1, isClosed: 'yes', startTime: '9am', endTime: '17:00' })).not.toHaveLength(0);
  });

  it('rejects extra properties', async () => {
    expect(await errorsOf({ dayOfWeek: 1, isClosed: true, extra: true })).not.toHaveLength(0);
  });
});
