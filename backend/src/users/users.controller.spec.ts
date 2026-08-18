import { Test } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('UsersController', () => {
  let controller: UsersController;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    changePassword: jest.fn(),
    disable: jest.fn(),
    enable: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [Reflector, { provide: UsersService, useValue: mockService }],
    }).compile();

    controller = moduleRef.get(UsersController);
    jest.clearAllMocks();
  });

  it('delegates create to the service', async () => {
    mockService.create.mockResolvedValue({ id: 'u1' });

    await controller.create({} as never, { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

    expect(mockService.create).toHaveBeenCalledWith({}, { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });
  });

  it('delegates list to the service', async () => {
    mockService.findAll.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });

    await controller.findAll({} as never, { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

    expect(mockService.findAll).toHaveBeenCalledWith({});
  });

  it('delegates disable to the service', async () => {
    mockService.disable.mockResolvedValue({ id: 'u1', isActive: false });

    await controller.disable('u1', { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

    expect(mockService.disable).toHaveBeenCalledWith('u1', { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });
  });

  it('delegates enable to the service', async () => {
    mockService.enable.mockResolvedValue({ id: 'u1', isActive: true });

    await controller.enable('u1', { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });

    expect(mockService.enable).toHaveBeenCalledWith('u1', { userId: 'admin-1', email: 'admin@example.com', role: 'ADMIN' });
  });

  it('uses admin role metadata where required', () => {
    const createRoles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.create) ?? Reflect.getMetadata(ROLES_KEY, controller.create);
    const listRoles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.findAll) ?? Reflect.getMetadata(ROLES_KEY, controller.findAll);
    const disableRoles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.disable) ?? Reflect.getMetadata(ROLES_KEY, controller.disable);
    const enableRoles = Reflect.getMetadata(ROLES_KEY, UsersController.prototype.enable) ?? Reflect.getMetadata(ROLES_KEY, controller.enable);

    expect(createRoles).toEqual(['ADMIN']);
    expect(listRoles).toEqual(['ADMIN', 'RECEPTIONIST']);
    expect(disableRoles).toEqual(['ADMIN']);
    expect(enableRoles).toEqual(['ADMIN']);
  });

  it('declares me routes before id routes', () => {
    const keys = Object.getOwnPropertyNames(UsersController.prototype);
    expect(keys.indexOf('findMe')).toBeLessThan(keys.indexOf('findOneById'));
    expect(keys.indexOf('updateMe')).toBeLessThan(keys.indexOf('updateOneById'));
    expect(keys.indexOf('changePasswordMe')).toBeLessThan(keys.indexOf('changePasswordById'));
  });
});
