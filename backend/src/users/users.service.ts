import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '../generated/prisma/client';
import { Locale, Role } from '../generated/prisma/enums';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionClient } from '../prisma/prisma.types';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateUserDto, UpdateUserDto, ChangePasswordDto, UserFilterQueryDto, UserResponseDto } from './dto';

const userSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  role: true,
  preferredLocale: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  patientProfile: {
    select: { dateOfBirth: true },
  },
} as const;

type SelectedUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditService: AuditService = { log: async () => undefined } as unknown as AuditService,
  ) {}

  async create(dto: CreateUserDto, currentUser: AuthenticatedUser): Promise<UserResponseDto> {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('email_already_exists');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    const user = await this.prisma.$transaction(async (tx: TransactionClient) => {
      const created = await tx.user.create({
        data: {
          email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          role: dto.role,
          preferredLocale: dto.preferredLocale ?? Locale.EN,
          passwordHash,
          isActive: true,
        },
      });

      if (dto.role === Role.PATIENT) {
        await tx.patientProfile.create({ data: { userId: created.id } });
      }

      if (dto.role === Role.DOCTOR) {
        await tx.doctorProfile.create({ data: { userId: created.id, specialization: '' } });
      }

      return tx.user.findUniqueOrThrow({ where: { id: created.id }, select: userSelect });
    });

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: AUDIT_ACTIONS.USER_CREATED,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: user.id,
      payload: { role: dto.role, email },
    });

    return this.toResponse(user);
  }

  async findOne(targetId: string, currentUser: AuthenticatedUser): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: targetId }, select: userSelect });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    this.assertReadAccess(user, currentUser);
    return this.toResponse(user);
  }

  async update(targetId: string, dto: UpdateUserDto, currentUser: AuthenticatedUser): Promise<UserResponseDto> {
    this.assertWriteAccess(targetId, currentUser);

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const isAdmin = currentUser.role === Role.ADMIN;
    const allowedRole = isAdmin ? dto.role : undefined;
    if (allowedRole !== undefined && currentUser.userId === targetId && target.role === Role.ADMIN && allowedRole !== Role.ADMIN) {
      const otherAdmins = await this.prisma.user.count({
        where: { role: Role.ADMIN, isActive: true, id: { not: targetId } },
      });
      if (otherAdmins === 0) {
        throw new ConflictException('last_admin');
      }
    }

    const updateData: Prisma.UserUpdateInput = {};
    if (dto.firstName !== undefined) updateData.firstName = dto.firstName;
    if (dto.lastName !== undefined) updateData.lastName = dto.lastName;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.preferredLocale !== undefined) updateData.preferredLocale = dto.preferredLocale;
    if (allowedRole !== undefined) updateData.role = allowedRole;

    const effectiveRole = allowedRole ?? target.role;
    const shouldUpdateDateOfBirth = dto.dateOfBirth !== undefined && effectiveRole === Role.PATIENT;
    const roleChanged = allowedRole !== undefined && allowedRole !== target.role;

    const user = await this.prisma.$transaction(async (tx: TransactionClient) => {
      if (Object.keys(updateData).length > 0) {
        await tx.user.update({ where: { id: targetId }, data: updateData });
      }

      if (shouldUpdateDateOfBirth) {
        await tx.patientProfile.upsert({
          where: { userId: targetId },
          create: {
            userId: targetId,
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          },
          update: {
            dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null,
          },
        });
      }

      const selected = await tx.user.findUniqueOrThrow({ where: { id: targetId }, select: userSelect });
      return selected;
    });

    if (Object.keys(updateData).length > 0 || shouldUpdateDateOfBirth || roleChanged) {
      await this.auditService.log({
        actorId: currentUser.userId,
        actorRole: currentUser.role,
        action: AUDIT_ACTIONS.USER_UPDATED,
        targetType: AUDIT_TARGET_TYPES.USER,
        targetId,
        payload: {
          ...(Object.keys(updateData).length > 0 ? { updatedFields: Object.keys(updateData) } : {}),
          ...(shouldUpdateDateOfBirth ? { dateOfBirth: dto.dateOfBirth ?? null } : {}),
          ...(roleChanged ? { fromRole: target.role, toRole: allowedRole } : {}),
        },
      });
    }

    return this.toResponse(user);
  }

  async changePassword(targetId: string, dto: ChangePasswordDto, currentUser: AuthenticatedUser): Promise<{ message: string }> {
    if (currentUser.userId !== targetId) {
      throw new ForbiddenException();
    }

    const user = await this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true, passwordHash: true } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentPasswordMatches = await argon2.verify(user.passwordHash, dto.currentPassword);
    if (!currentPasswordMatches) {
      throw new BadRequestException('current_password_incorrect');
    }

    const samePassword = await argon2.verify(user.passwordHash, dto.newPassword);
    if (samePassword) {
      throw new BadRequestException('password_same_as_current');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });

    await this.prisma.$transaction(async (tx: TransactionClient) => {
      await tx.user.update({ where: { id: targetId }, data: { passwordHash: newPasswordHash } });
      await tx.refreshToken.deleteMany({ where: { userId: targetId } });
    });

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: AUDIT_ACTIONS.USER_PASSWORD_CHANGED,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId,
      payload: {},
    });

    return { message: 'Password updated.' };
  }

  async findAll(query: UserFilterQueryDto): Promise<{ items: UserResponseDto[]; total: number; page: number; pageSize: number }> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.UserWhereInput = {};

    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' } },
        { firstName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } },
        { phone: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.role?.length) {
      where.role = { in: query.role };
    }

    if (query.preferredLocale) {
      where.preferredLocale = query.preferredLocale;
    }

    if (query.status === 'active') {
      where.isActive = true;
    } else if (query.status === 'disabled') {
      where.isActive = false;
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortDir = query.sortDir ?? 'desc';

    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: userSelect,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { [sortBy]: sortDir } as Prisma.UserOrderByWithRelationInput,
      }),
    ]);

    return {
      items: items.map((user) => this.toResponse(user)),
      total,
      page,
      pageSize,
    };
  }

  async disable(targetId: string, currentUser: AuthenticatedUser): Promise<{ message: string; id: string; isActive: boolean }> {
    if (targetId === currentUser.userId) {
      throw new ForbiddenException('cannot_disable_self');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true, isActive: true } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (!target.isActive) {
      return { message: 'User disabled.', id: target.id, isActive: false };
    }

    await this.prisma.$transaction(async (tx: TransactionClient) => {
      await tx.user.update({ where: { id: targetId }, data: { isActive: false } });
      await tx.refreshToken.deleteMany({ where: { userId: targetId } });
    });

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: AUDIT_ACTIONS.USER_DISABLED,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId,
      payload: { isActive: false },
    });

    return { message: 'User disabled.', id: targetId, isActive: false };
  }

  async enable(targetId: string, currentUser: AuthenticatedUser): Promise<{ message: string; id: string; isActive: boolean }> {
    if (targetId === currentUser.userId) {
      throw new ForbiddenException('cannot_enable_self');
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true, isActive: true } });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.isActive) {
      return { message: 'User enabled.', id: target.id, isActive: true };
    }

    await this.prisma.user.update({ where: { id: targetId }, data: { isActive: true } });

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: AUDIT_ACTIONS.USER_ENABLED,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId,
      payload: { isActive: true },
    });

    return { message: 'User enabled.', id: targetId, isActive: true };
  }

  private assertReadAccess(targetUser: { id: string; role: Role }, currentUser: AuthenticatedUser) {
    if (currentUser.role === Role.ADMIN) {
      return;
    }
    if (currentUser.userId === targetUser.id) {
      return;
    }
    if (currentUser.role === Role.RECEPTIONIST && targetUser.role === Role.PATIENT) {
      return;
    }
    throw new ForbiddenException();
  }

  private assertWriteAccess(targetId: string, currentUser: AuthenticatedUser) {
    if (currentUser.role !== Role.ADMIN && currentUser.userId !== targetId) {
      throw new ForbiddenException();
    }
  }

  private toResponse(user: SelectedUser): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      preferredLocale: user.preferredLocale,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      patientProfile: user.patientProfile
        ? { dateOfBirth: user.patientProfile.dateOfBirth ? user.patientProfile.dateOfBirth.toISOString().slice(0, 10) : null }
        : null,
    };
  }
}
