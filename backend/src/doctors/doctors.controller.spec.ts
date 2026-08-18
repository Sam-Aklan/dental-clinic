import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';

describe('DoctorsController', () => {
  let controller: DoctorsController;
  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    listScheduleOverrides: jest.fn(),
    createScheduleOverride: jest.fn(),
    updateScheduleOverride: jest.fn(),
    deleteScheduleOverride: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [DoctorsController],
      providers: [Reflector, { provide: DoctorsService, useValue: service }],
    }).compile();

    controller = moduleRef.get(DoctorsController);
    jest.clearAllMocks();
  });

  it('delegates public list and profile routes', async () => {
    service.findAll.mockResolvedValue([]);
    service.findOne.mockResolvedValue({ id: 'doctor-1' });

    await controller.findAll(undefined);
    await controller.findOne('doctor-1', undefined);

    expect(service.findAll).toHaveBeenCalledWith(false);
    expect(service.findOne).toHaveBeenCalledWith('doctor-1', false);
  });

  it('uses the expected role metadata', () => {
    const createRoles = Reflect.getMetadata(ROLES_KEY, DoctorsController.prototype.create);
    const updateRoles = Reflect.getMetadata(ROLES_KEY, DoctorsController.prototype.update);
    const listRoles = Reflect.getMetadata(ROLES_KEY, DoctorsController.prototype.listOverrides);
    const overrideCreateRoles = Reflect.getMetadata(ROLES_KEY, DoctorsController.prototype.createOverride);

    expect(createRoles).toEqual([Role.ADMIN]);
    expect(updateRoles).toEqual([Role.ADMIN, Role.DOCTOR]);
    expect(listRoles).toEqual([Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR]);
    expect(overrideCreateRoles).toEqual([Role.ADMIN]);
  });
});
