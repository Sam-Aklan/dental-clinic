import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { UsersService } from './users.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { Locale, Role } from '../generated/prisma/enums';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  verify: jest.fn().mockResolvedValue(true),
  argon2id: 2,
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  const auditService = { log: jest.fn().mockResolvedValue(undefined) };

  const admin = { userId: 'admin-1', email: 'admin@example.com', role: Role.ADMIN };
  const patient = { userId: 'patient-1', email: 'patient@example.com', role: Role.PATIENT };
  type SelectedUserFixture = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: Role;
    preferredLocale: Locale;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    patientProfile: { dateOfBirth: Date | null } | null;
  };

  const adminUser: SelectedUserFixture = {
    id: 'admin-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    phone: null,
    role: Role.ADMIN,
    preferredLocale: Locale.EN,
    isActive: true,
    createdAt: new Date('2026-05-14T10:00:00.000Z'),
    updatedAt: new Date('2026-05-14T10:00:00.000Z'),
    patientProfile: null,
  };

  const makeSelectedUser = (overrides: Partial<SelectedUserFixture> = {}) => ({ ...adminUser, ...overrides });

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      patientProfile: {
        create: jest.fn(),
        upsert: jest.fn(),
      },
      doctorProfile: {
        create: jest.fn(),
      },
      refreshToken: {
        deleteMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (fn: any) => fn(prisma)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }, { provide: AuditService, useValue: auditService }],
    }).compile();

    service = moduleRef.get(UsersService);
    jest.clearAllMocks();
  });

  it('creates a patient user and audit log', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({ id: 'user-1' });
    prisma.user.findUniqueOrThrow.mockResolvedValue(
      makeSelectedUser({
        id: 'user-1',
        email: 'patient@example.com',
        role: Role.PATIENT,
        patientProfile: { dateOfBirth: null },
      }),
    );

    const result = await service.create(
      {
        email: 'Patient@Example.com',
        firstName: 'Jane',
        lastName: 'Doe',
        role: Role.PATIENT,
        password: 'SecurePass1',
      },
      admin,
    );

    expect(prisma.patientProfile.create).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_CREATED', targetType: 'USER' }));
    expect(result.email).toBe('patient@example.com');
    expect(JSON.stringify(result)).not.toContain('passwordHash');
  });

  it('rejects duplicate email creation', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create({ email: 'patient@example.com', firstName: 'Jane', lastName: 'Doe', role: Role.RECEPTIONIST, password: 'SecurePass1' }, admin),
    ).rejects.toThrow('email_already_exists');
  });

  it('updates self profile and preserves patient date of birth', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'patient-1', role: Role.PATIENT, isActive: true });
    prisma.user.findUniqueOrThrow.mockResolvedValue(
      makeSelectedUser({
        id: 'patient-1',
        firstName: 'Janet',
        role: Role.PATIENT,
        patientProfile: { dateOfBirth: new Date('1990-06-15') },
      }),
    );

    const result = await service.update(
      'patient-1',
      { firstName: 'Janet', dateOfBirth: '1990-06-15' },
      patient,
    );

    expect(prisma.patientProfile.upsert).toHaveBeenCalled();
    expect(result.firstName).toBe('Janet');
  });

  it('blocks cross-user updates for non-admins', async () => {
    await expect(service.update('other-user', { firstName: 'x' }, patient)).rejects.toThrow('Forbidden');
  });

  it('blocks last admin self-demotion', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: Role.ADMIN, isActive: true });
    prisma.user.count.mockResolvedValue(0);

    await expect(service.update('admin-1', { role: Role.RECEPTIONIST }, admin)).rejects.toThrow('last_admin');
  });

  it('changes password and revokes refresh tokens', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'patient-1', passwordHash: 'old-hash' });
    (argon2.verify as jest.Mock).mockResolvedValueOnce(true).mockResolvedValueOnce(false);

    const result = await service.changePassword('patient-1', { currentPassword: 'OldPass1', newPassword: 'NewPass2' }, patient);

    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'patient-1' } });
    expect(result.message).toBe('Password updated.');
  });

  it('lists users with pagination and sanitized payloads', async () => {
    prisma.user.count.mockResolvedValue(1);
    prisma.user.findMany.mockResolvedValue([makeSelectedUser()]);

    const result = await service.findAll({ page: 1, pageSize: 20, sortBy: 'createdAt', sortDir: 'desc' });

    expect(result.total).toBe(1);
    expect(result.items[0].email).toBe('admin@example.com');
  });

  it('disables active users and writes audit log', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-2', isActive: true });

    const result = await service.disable('user-2', admin);

    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_DISABLED', targetType: 'USER' }));
    expect(result.isActive).toBe(false);
  });

  it('enables disabled users and writes audit log', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-2', isActive: false });

    const result = await service.enable('user-2', admin);

    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_ENABLED', targetType: 'USER' }));
    expect(result.isActive).toBe(true);
  });
});
