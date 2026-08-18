import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IsMultipleOf } from './is-multiple-of.decorator';

class MultipleDto {
  @IsMultipleOf(5)
  value!: number;
}

describe('IsMultipleOf', () => {
  it('accepts multiples of the divisor', async () => {
    const dto = plainToInstance(MultipleDto, { value: 25 });
    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects values that are not multiples', async () => {
    const dto = plainToInstance(MultipleDto, { value: 26 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
