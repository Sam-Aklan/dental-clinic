import { BadRequestException } from '@nestjs/common';
import { extractIdempotencyKey } from './idempotency-key.decorator';

describe('IdempotencyKey', () => {
  it('returns a valid UUID header', () => {
    const value = extractIdempotencyKey({ 'idempotency-key': '123e4567-e89b-42d3-a456-426614174000' });

    expect(value).toBe('123e4567-e89b-42d3-a456-426614174000');
  });

  it('throws when missing', () => {
    expect(() => extractIdempotencyKey({})).toThrow(BadRequestException);
  });
});
