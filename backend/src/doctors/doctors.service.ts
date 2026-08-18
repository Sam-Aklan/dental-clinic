import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import { Locale, Role } from '../generated/prisma/enums';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDoctorDto,
  CreateScheduleOverrideDto,
  DoctorResponseDto,
  PublicDoctorResponseDto,
  ScheduleOverrideResponseDto,
  UpdateDoctorDto,
  UpdateScheduleOverrideDto,
} from './dto';

type DoctorRecord = {
  id: string;
  specialization: string | null;
  bio: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    preferredLocale: Locale;
    isActive: boolean;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
  };
};

type ScheduleOverrideRecord = {
  id: string;
  doctorProfileId: string;
  date: Date;
  isUnavailable: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class DoctorsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditService: AuditService = { log: async () => undefined } as unknown as AuditService,
  ) {}

  async findAll(isAdmin: boolean): Promise<Array<PublicDoctorResponseDto | DoctorResponseDto>> {
    const doctors = (await this.prisma.doctorProfile.findMany({
      where: isAdmin ? undefined : { user: { isActive: true } },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            preferredLocale: true,
            isActive: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { user: { lastName: 'asc' } },
    })) as DoctorRecord[];

    return doctors.map((doctor) => (isAdmin ? this.toFullDoctorResponse(doctor) : this.toPublicDoctorResponse(doctor)));
  }

  async findOne(id: string, isAdmin: boolean): Promise<PublicDoctorResponseDto | DoctorResponseDto> {
    const doctor = (await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            preferredLocale: true,
            isActive: true,
            role: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    })) as DoctorRecord | null;

    if (!doctor || doctor.user.role !== Role.DOCTOR) {
      throw new NotFoundException('Doctor not found');
    }

    return isAdmin ? this.toFullDoctorResponse(doctor) : this.toPublicDoctorResponse(doctor);
  }

  async create(dto: CreateDoctorDto, currentUser: AuthenticatedUser): Promise<DoctorResponseDto> {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }

    const email = dto.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('email already in use');
    }

    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });

    try {
      const doctor = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone ?? null,
            role: Role.DOCTOR,
            preferredLocale: dto.preferredLocale ?? Locale.EN,
            passwordHash,
            isActive: true,
          },
        });

        const profile = await tx.doctorProfile.create({
          data: {
            userId: user.id,
            specialization: dto.specialization ?? null,
            bio: dto.bio ?? null,
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                preferredLocale: true,
                isActive: true,
                role: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        });

        return profile;
      });

      await this.auditService.log({
        actorId: currentUser.userId,
        actorRole: currentUser.role,
        action: AUDIT_ACTIONS.DOCTOR_CREATED,
        targetType: AUDIT_TARGET_TYPES.DOCTOR,
        targetId: doctor.id,
        payload: { userId: doctor.userId, email },
      });

      return this.toFullDoctorResponse(doctor as DoctorRecord);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('email already in use');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateDoctorDto, currentUser: AuthenticatedUser): Promise<DoctorResponseDto> {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!doctor || doctor.user.role !== Role.DOCTOR) {
      throw new NotFoundException('Doctor not found');
    }

    this.assertDoctorOwnership(id, currentUser);

    const isAdmin = currentUser.role === Role.ADMIN;
    const userData: Record<string, unknown> = {};
    const profileData: Record<string, unknown> = {};

    if (dto.firstName !== undefined) userData.firstName = dto.firstName;
    if (dto.lastName !== undefined) userData.lastName = dto.lastName;
    if (dto.phone !== undefined) userData.phone = dto.phone;
    if (dto.preferredLocale !== undefined) userData.preferredLocale = dto.preferredLocale;
    if (dto.specialization !== undefined) profileData.specialization = dto.specialization;
    if (dto.bio !== undefined) profileData.bio = dto.bio;

    if (isAdmin && dto.isActive !== undefined) {
      userData.isActive = dto.isActive;
    }

    if (currentUser.role === Role.DOCTOR) {
      delete userData.isActive;
    }

    const updated = (await this.prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id: doctor.userId }, data: userData });
      }

      if (Object.keys(profileData).length > 0) {
        await tx.doctorProfile.update({ where: { id }, data: profileData });
      }

      return tx.doctorProfile.findUniqueOrThrow({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              preferredLocale: true,
              isActive: true,
              role: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });
    })) as DoctorRecord;

    if (Object.keys(userData).length > 0 || Object.keys(profileData).length > 0 || (isAdmin && dto.isActive !== undefined)) {
      await this.auditService.log({
        actorId: currentUser.userId,
        actorRole: currentUser.role,
        action: AUDIT_ACTIONS.DOCTOR_UPDATED,
        targetType: AUDIT_TARGET_TYPES.DOCTOR,
        targetId: id,
        payload: {
          ...(Object.keys(userData).length > 0 ? { userChanges: Object.keys(userData) } : {}),
          ...(Object.keys(profileData).length > 0 ? { profileChanges: Object.keys(profileData) } : {}),
          ...(isAdmin && dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });
    }

    return this.toFullDoctorResponse(updated);
  }

  async listScheduleOverrides(id: string, currentUser: AuthenticatedUser): Promise<ScheduleOverrideResponseDto[]> {
    await this.ensureDoctorExists(id);
    if (currentUser.role === Role.DOCTOR) {
      this.assertDoctorOwnership(id, currentUser);
    }

    const overrides = (await this.prisma.doctorScheduleOverride.findMany({
      where: { doctorProfileId: id },
      orderBy: { date: 'asc' },
    })) as ScheduleOverrideRecord[];

    return overrides.map((override) => this.toScheduleOverrideResponse(override));
  }

  async createScheduleOverride(id: string, dto: CreateScheduleOverrideDto, currentUser: AuthenticatedUser): Promise<ScheduleOverrideResponseDto> {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }

    await this.ensureDoctorExists(id);
    this.validateScheduleOverrideState(dto.isUnavailable, dto.startTime ?? null, dto.endTime ?? null);

    const date = this.toDateOnly(dto.date);
    const existing = await this.prisma.doctorScheduleOverride.findFirst({ where: { doctorProfileId: id, date } });
    if (existing) {
      throw new ConflictException('An override already exists for this date');
    }

    const created = (await this.prisma.$transaction(async (tx) => {
      const override = await tx.doctorScheduleOverride.create({
        data: {
          doctorProfileId: id,
          date,
          isUnavailable: dto.isUnavailable,
          startTime: dto.isUnavailable ? null : dto.startTime ?? null,
          endTime: dto.isUnavailable ? null : dto.endTime ?? null,
          reason: dto.reason ?? null,
        },
      });

      return override;
    })) as ScheduleOverrideRecord;

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: AUDIT_ACTIONS.SCHEDULE_OVERRIDE_CREATED,
      targetType: AUDIT_TARGET_TYPES.SCHEDULE_OVERRIDE,
      targetId: created.id,
      payload: { doctorId: id, date: dto.date },
    });

    return this.toScheduleOverrideResponse(created);
  }

  async updateScheduleOverride(id: string, overrideId: string, dto: UpdateScheduleOverrideDto, currentUser: AuthenticatedUser): Promise<ScheduleOverrideResponseDto> {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }

    const existing = (await this.prisma.doctorScheduleOverride.findFirst({
      where: { id: overrideId, doctorProfileId: id },
    })) as ScheduleOverrideRecord | null;

    if (!existing) {
      throw new NotFoundException('Schedule override not found');
    }

    const merged = {
      date: dto.date ?? this.toDateString(existing.date),
      isUnavailable: dto.isUnavailable ?? existing.isUnavailable,
      startTime: dto.startTime !== undefined ? dto.startTime : existing.startTime,
      endTime: dto.endTime !== undefined ? dto.endTime : existing.endTime,
      reason: dto.reason !== undefined ? dto.reason : existing.reason,
    };

    this.validateScheduleOverrideState(merged.isUnavailable, merged.startTime, merged.endTime);

    const normalizedDate = this.toDateOnly(merged.date);
    if (normalizedDate.getTime() !== existing.date.getTime()) {
      const duplicate = await this.prisma.doctorScheduleOverride.findFirst({
        where: { doctorProfileId: id, date: normalizedDate, id: { not: overrideId } },
      });
      if (duplicate) {
        throw new ConflictException('An override already exists for this date');
      }
    }

    const updated = (await this.prisma.$transaction(async (tx) => tx.doctorScheduleOverride.update({
      where: { id: overrideId },
      data: {
        date: normalizedDate,
        isUnavailable: merged.isUnavailable,
        startTime: merged.isUnavailable ? null : merged.startTime,
        endTime: merged.isUnavailable ? null : merged.endTime,
        reason: merged.reason,
      },
    }))) as ScheduleOverrideRecord;

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: 'SCHEDULE_OVERRIDE_UPDATED',
      targetType: AUDIT_TARGET_TYPES.SCHEDULE_OVERRIDE,
      targetId: updated.id,
      payload: { doctorId: id, date: this.toDateString(normalizedDate) },
    });

    return this.toScheduleOverrideResponse(updated);
  }

  async deleteScheduleOverride(id: string, overrideId: string, currentUser: AuthenticatedUser): Promise<void> {
    if (currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }

    const existing = await this.prisma.doctorScheduleOverride.findFirst({ where: { id: overrideId, doctorProfileId: id } });
    if (!existing) {
      throw new NotFoundException('Schedule override not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.doctorScheduleOverride.delete({ where: { id: overrideId } });
    });

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: AUDIT_ACTIONS.SCHEDULE_OVERRIDE_DELETED,
      targetType: AUDIT_TARGET_TYPES.SCHEDULE_OVERRIDE,
      targetId: overrideId,
      payload: { doctorId: id, date: this.toDateString(existing.date) },
    });
  }

  private async ensureDoctorExists(id: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id }, select: { id: true } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }

  private assertDoctorOwnership(requestedDoctorProfileId: string, currentUser: AuthenticatedUser): void {
    if (currentUser.role === Role.DOCTOR && currentUser.doctorProfileId !== requestedDoctorProfileId) {
      throw new ForbiddenException();
    }
  }

  private validateScheduleOverrideState(isUnavailable: boolean, startTime: string | null | undefined, endTime: string | null | undefined) {
    if (isUnavailable) {
      if (startTime !== null && startTime !== undefined) {
        throw new BadRequestException('startTime and endTime must not be provided when isUnavailable is true');
      }
      if (endTime !== null && endTime !== undefined) {
        throw new BadRequestException('startTime and endTime must not be provided when isUnavailable is true');
      }
      return;
    }

    if (!startTime || !endTime) {
      throw new BadRequestException('startTime and endTime are required when isUnavailable is false');
    }

    if (endTime <= startTime) {
      throw new BadRequestException('endTime must be strictly after startTime');
    }
  }

  private toDateOnly(dateString: string) {
    return new Date(`${dateString}T00:00:00.000Z`);
  }

  private toDateString(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private toPublicDoctorResponse(doctor: DoctorRecord): PublicDoctorResponseDto {
    return {
      id: doctor.id,
      firstName: doctor.user.firstName,
      lastName: doctor.user.lastName,
      specialization: doctor.specialization,
      bio: doctor.bio,
      isActive: doctor.user.isActive,
    };
  }

  private toFullDoctorResponse(doctor: DoctorRecord): DoctorResponseDto {
    return {
      ...this.toPublicDoctorResponse(doctor),
      userId: doctor.user.id,
      email: doctor.user.email,
      phone: doctor.user.phone,
      preferredLocale: doctor.user.preferredLocale,
      createdAt: doctor.user.createdAt.toISOString(),
      updatedAt: doctor.user.updatedAt.toISOString(),
    };
  }

  private toScheduleOverrideResponse(override: ScheduleOverrideRecord): ScheduleOverrideResponseDto {
    return {
      id: override.id,
      doctorId: override.doctorProfileId,
      date: this.toDateString(override.date),
      isUnavailable: override.isUnavailable,
      startTime: override.startTime,
      endTime: override.endTime,
      reason: override.reason,
      createdAt: override.createdAt.toISOString(),
    };
  }
}
