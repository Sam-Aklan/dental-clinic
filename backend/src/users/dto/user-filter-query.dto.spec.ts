import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserFilterQueryDto } from './user-filter-query.dto';
import { Locale, Role } from '../../generated/prisma/enums';

describe('UserFilterQueryDto', () => {
  const validPayload = {
    role: Role.ADMIN,
    status: 'active',
    preferredLocale: Locale.EN,
    page: '2',
    pageSize: '25',
    sortBy: 'createdAt',
    sortDir: 'desc',
  };

  const errorsOf = async (payload: Record<string, unknown>) => {
    const dto = plainToInstance(UserFilterQueryDto, payload);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    return errors.flatMap((e) => Object.values(e.constraints ?? {}));
  };

  it('accepts defaults when omitted', async () => {
    const dto = plainToInstance(UserFilterQueryDto, {});
    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(20);
  });

  it('transforms single role into array', async () => {
    const dto = plainToInstance(UserFilterQueryDto, { role: Role.DOCTOR });
    expect(dto.role).toEqual([Role.DOCTOR]);
  });

  it('accepts repeated roles', async () => {
    expect(await errorsOf({ ...validPayload, role: [Role.ADMIN, Role.DOCTOR] })).toHaveLength(0);
  });

  it('rejects invalid page size', async () => {
    expect(await errorsOf({ ...validPayload, pageSize: '101' })).toContain('pageSize must not be greater than 100');
  });
});
