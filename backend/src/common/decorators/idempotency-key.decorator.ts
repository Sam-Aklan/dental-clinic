import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function extractIdempotencyKey(headers: Record<string, unknown>) {
  const header = headers['idempotency-key'];
  const value = Array.isArray(header) ? header[0] : header;

  if (typeof value !== 'string' || !UUID_V4_REGEX.test(value)) {
    throw new BadRequestException('Invalid or missing Idempotency-Key');
  }

  return value;
}

export const IdempotencyKey = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return extractIdempotencyKey(request.headers);
});
