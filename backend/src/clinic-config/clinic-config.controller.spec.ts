import { Test } from '@nestjs/testing';
import { ClinicConfigController } from './clinic-config.controller';
import { ClinicConfigService } from './clinic-config.service';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

describe('ClinicConfigController', () => {
  let controller: ClinicConfigController;
  const service = {
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
    getWorkingHours: jest.fn(),
    replaceWorkingHours: jest.fn(),
    getHolidays: jest.fn(),
    createHoliday: jest.fn(),
    deleteHoliday: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ClinicConfigController],
      providers: [{ provide: ClinicConfigService, useValue: service }],
    }).compile();

    controller = moduleRef.get(ClinicConfigController);
    jest.clearAllMocks();
  });

  it('marks public read routes as public', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, ClinicConfigController.prototype.getConfig)).toBe(true);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, ClinicConfigController.prototype.getWorkingHours)).toBe(true);
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, ClinicConfigController.prototype.getHolidays)).toBe(true);
  });

  it('applies admin roles to write routes', () => {
    expect(Reflect.getMetadata(ROLES_KEY, ClinicConfigController.prototype.updateConfig)).toEqual([Role.ADMIN]);
    expect(Reflect.getMetadata(ROLES_KEY, ClinicConfigController.prototype.replaceWorkingHours)).toEqual([Role.ADMIN]);
    expect(Reflect.getMetadata(ROLES_KEY, ClinicConfigController.prototype.createHoliday)).toEqual([Role.ADMIN]);
    expect(Reflect.getMetadata(ROLES_KEY, ClinicConfigController.prototype.deleteHoliday)).toEqual([Role.ADMIN]);
  });

  it('delegates route handlers to the service', async () => {
    service.getConfig.mockResolvedValue({ id: 'clinic-config-singleton' });
    service.getWorkingHours.mockResolvedValue([]);
    service.getHolidays.mockResolvedValue([]);
    service.updateConfig.mockResolvedValue({ id: 'clinic-config-singleton' });
    service.replaceWorkingHours.mockResolvedValue([]);
    service.createHoliday.mockResolvedValue({ id: 'holiday-1' });

    await controller.getConfig();
    await controller.getWorkingHours();
    await controller.getHolidays();
    await controller.updateConfig({} as any);
    await controller.replaceWorkingHours([] as any);
    await controller.createHoliday({ date: '2026-12-25', name: 'Christmas' } as any);
    await controller.deleteHoliday('holiday-1');

    expect(service.getConfig).toHaveBeenCalled();
    expect(service.getWorkingHours).toHaveBeenCalled();
    expect(service.getHolidays).toHaveBeenCalled();
    expect(service.updateConfig).toHaveBeenCalledWith({}, undefined);
    expect(service.replaceWorkingHours).toHaveBeenCalledWith([], undefined);
    expect(service.createHoliday).toHaveBeenCalledWith({ date: '2026-12-25', name: 'Christmas' }, undefined);
    expect(service.deleteHoliday).toHaveBeenCalledWith('holiday-1', undefined);
  });
});
