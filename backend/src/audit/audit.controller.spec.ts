import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditLogPageDto } from './dto/audit-log-page-response.dto';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

describe('AuditController', () => {
  let controller: AuditController;
  const service = {
    findLogs: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: service }],
    }).compile();

    controller = moduleRef.get(AuditController);
    jest.clearAllMocks();
  });

  it('applies admin-only metadata and Swagger response type', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AuditController.prototype.findAll)).toEqual([Role.ADMIN]);

    const apiResponse = Reflect.getMetadata('swagger/apiResponse', AuditController.prototype.findAll);
    expect(apiResponse[200].type).toBe(AuditLogPageDto);
  });

  it('delegates query handling to the service', async () => {
    const page = { items: [], page: 1, pageSize: 50, total: 0, totalPages: 0 };
    service.findLogs.mockResolvedValue(page);

    await expect(controller.findAll({ actorId: 'admin-user-id' } as never)).resolves.toBe(page);

    expect(service.findLogs).toHaveBeenCalledWith({ actorId: 'admin-user-id' });
  });

  it('rejects invalid sort values before the service runs', async () => {
    const dto = plainToInstance(AuditLogQueryDto, { sortBy: 'invalid' });
    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'sortBy')).toBe(true);
    expect(service.findLogs).not.toHaveBeenCalled();
  });
});
