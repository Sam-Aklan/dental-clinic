import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { AppointmentStatus, FollowUpStatus, Locale, Role } from '../generated/prisma/enums';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { SlotValidationService } from '../appointments/slot-validation.service';
import { CreateFollowUpDto, FollowUpPageResponseDto, FollowUpsQueryDto, FollowUpRecord, FollowUpResponseDto, UpdateFollowUpDto, UpdateFollowUpStatusDto, CancelFollowUpDto } from './dto';
import { DateTime } from 'luxon';

@Injectable()
export class FollowUpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slotValidationService: SlotValidationService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateFollowUpDto, currentUser: AuthenticatedUser, idempotencyKey: string): Promise<FollowUpResponseDto> {
    const config = await this.slotValidationService.loadClinicConfig();
    const startsAt = this.parseUtcDateTime(dto.startsAt);
    if (startsAt < new Date()) {
      throw new BadRequestException('startsAt must be in the future');
    }

    const [patient, doctor, sourceAppointment, existingAppointment] = await Promise.all([
      this.loadPatient(dto.patientId),
      this.slotValidationService.ensureDoctor(dto.doctorId),
      dto.sourceAppointmentId ? this.loadSourceAppointment(dto.sourceAppointmentId) : Promise.resolve(null),
      this.prisma.appointment.findUnique({
        where: { idempotencyKey },
        include: this.appointmentWithFollowUpInclude(),
      }),
    ]);

    if (currentUser.role === Role.DOCTOR && currentUser.doctorProfileId !== doctor.id) {
      throw new ForbiddenException();
    }

    if (sourceAppointment && (sourceAppointment.patientUserId !== patient.id || sourceAppointment.doctorProfileId !== doctor.id)) {
      throw new NotFoundException('Source appointment not found');
    }

    if (existingAppointment?.followUp) {
      return FollowUpResponseDto.fromRecord(existingAppointment.followUp as any);
    }

    const slot = await this.slotValidationService.assertAvailableSlot(doctor.id, startsAt, { ...config, minArrivalMinutes: 0 });

    let createdFollowUpId: string;
    try {
      createdFollowUpId = await this.prisma.$transaction(async (tx) => {
        const conflict = await tx.appointment.findFirst({
          where: {
            doctorProfileId: doctor.id,
            startTime: startsAt,
            status: { not: AppointmentStatus.CANCELED },
          },
        });
        if (conflict) {
          throw new ConflictException('slot_already_booked');
        }

        const appointment = await tx.appointment.create({
          data: {
            doctorProfileId: doctor.id,
            patientUserId: patient.id,
            startTime: startsAt,
            endTime: slot.endsAt,
            idempotencyKey,
            status: AppointmentStatus.CONFIRMED,
            needsFollowUp: false,
          },
        });

        const followUp = await tx.followUp.create({
          data: {
            appointmentId: appointment.id,
            sourceAppointmentId: sourceAppointment?.id ?? null,
            patientUserId: patient.id,
            doctorProfileId: doctor.id,
            scheduledById: currentUser.userId,
            reason: dto.reason.trim(),
            notes: dto.notes?.trim() || null,
          },
        });

        if (sourceAppointment) {
          await tx.appointment.update({
            where: { id: sourceAppointment.id },
            data: { needsFollowUp: false },
          });
        }

        return followUp.id;
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        const original = await this.prisma.appointment.findUnique({ where: { idempotencyKey }, include: this.appointmentWithFollowUpInclude() });
        if (original?.followUp) {
          return FollowUpResponseDto.fromRecord(original.followUp as any);
        }
        throw new ConflictException('slot_already_booked');
      }
      throw error;
    }

    const created = await this.getFollowUpOrThrow(createdFollowUpId);
    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: AUDIT_ACTIONS.FOLLOW_UP_CREATED,
      targetType: AUDIT_TARGET_TYPES.FOLLOW_UP,
      targetId: created.id,
      payload: {
        doctorId: created.doctorProfileId,
        doctorName: `${created.doctorProfile.user.firstName} ${created.doctorProfile.user.lastName}`.trim(),
        patientId: created.patientUserId,
        patientName: `${created.patient.firstName} ${created.patient.lastName}`.trim(),
        startsAt: created.appointment.startTime.toISOString(),
      },
    });

    await this.queueFollowUpNotifications(created, config.reminderHoursBefore);
    return FollowUpResponseDto.fromRecord(created);
  }

  async list(query: FollowUpsQueryDto, currentUser: AuthenticatedUser): Promise<FollowUpPageResponseDto> {
    const config = await this.slotValidationService.loadClinicConfig();
    const where = await this.buildWhere(query, currentUser, config.timeZone);
    const [items, total] = await Promise.all([
      this.prisma.followUp.findMany({
        where,
        orderBy: [{ appointment: { startTime: 'asc' } }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        include: this.followUpInclude(),
      }),
      this.prisma.followUp.count({ where }),
    ]);

    return {
      items: items.map((item) => FollowUpResponseDto.fromRecord(item as any)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async getOne(id: string, currentUser: AuthenticatedUser): Promise<FollowUpResponseDto> {
    const record = await this.getFollowUpOrThrow(id);
    this.assertOwnership(record, currentUser);
    return FollowUpResponseDto.fromRecord(record);
  }

  async update(id: string, dto: UpdateFollowUpDto, currentUser: AuthenticatedUser): Promise<FollowUpResponseDto> {
    const current = await this.getFollowUpOrThrow(id);
    this.assertOwnership(current, currentUser);
    if (current.status !== FollowUpStatus.SCHEDULED) {
      throw new ConflictException('follow_up_already_terminal');
    }
    if (!dto.doctorId && !dto.startsAt && dto.reason === undefined && dto.notes === undefined && dto.sourceAppointmentId === undefined) {
      throw new BadRequestException('At least one field is required');
    }

    const targetDoctorId = dto.doctorId ?? current.doctorProfileId;
    if (currentUser.role === Role.DOCTOR && currentUser.doctorProfileId !== targetDoctorId) {
      throw new ForbiddenException();
    }

    const targetStartsAt = dto.startsAt ? this.parseUtcDateTime(dto.startsAt) : current.appointment.startTime;
    if (targetStartsAt < new Date()) {
      throw new BadRequestException('startsAt must be in the future');
    }

    const config = await this.slotValidationService.loadClinicConfig();
    const slotChanged = targetDoctorId !== current.doctorProfileId || targetStartsAt.getTime() !== current.appointment.startTime.getTime();
    const slot = slotChanged ? await this.slotValidationService.assertAvailableSlot(targetDoctorId, targetStartsAt, { ...config, minArrivalMinutes: 0 }) : null;
    const sourceAppointment = dto.sourceAppointmentId ? await this.loadSourceAppointment(dto.sourceAppointmentId) : null;
    if (sourceAppointment && (sourceAppointment.patientUserId !== current.patientUserId || sourceAppointment.doctorProfileId !== targetDoctorId)) {
      throw new NotFoundException('Source appointment not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (slotChanged) {
        const conflict = await tx.appointment.findFirst({
          where: {
            doctorProfileId: targetDoctorId,
            startTime: targetStartsAt,
            status: { not: AppointmentStatus.CANCELED },
            id: { not: current.appointmentId },
          },
        });
        if (conflict) {
          throw new ConflictException('slot_already_booked');
        }
      }

      if (slotChanged) {
        await tx.appointment.update({
          where: { id: current.appointmentId },
          data: {
            doctorProfileId: targetDoctorId,
            startTime: targetStartsAt,
            endTime: slot!.endsAt,
            status: AppointmentStatus.CONFIRMED,
          },
        });
      }

      await tx.followUp.update({
        where: { id },
        data: {
          doctorProfileId: targetDoctorId,
          sourceAppointmentId: dto.sourceAppointmentId === undefined ? current.sourceAppointmentId : dto.sourceAppointmentId,
          reason: dto.reason === undefined ? current.reason : dto.reason.trim(),
          notes: dto.notes === undefined ? current.notes : dto.notes?.trim() || null,
          cancellationReason: current.cancellationReason,
        },
      });

      return (await tx.followUp.findUnique({ where: { id }, include: this.followUpInclude().include })) as any;
    });

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: slotChanged ? AUDIT_ACTIONS.FOLLOW_UP_RESCHEDULED : AUDIT_ACTIONS.FOLLOW_UP_UPDATED,
      targetType: AUDIT_TARGET_TYPES.FOLLOW_UP,
      targetId: updated.id,
      payload: {
        fromDoctorId: current.doctorProfileId,
        toDoctorId: updated.doctorProfileId,
        fromStartsAt: current.appointment.startTime.toISOString(),
        toStartsAt: updated.appointment.startTime.toISOString(),
      },
    });

    if (slotChanged) {
      await this.queueFollowUpNotifications(updated, config.reminderHoursBefore);
    }

    return FollowUpResponseDto.fromRecord(updated);
  }

  async updateStatus(id: string, dto: UpdateFollowUpStatusDto, currentUser: AuthenticatedUser): Promise<FollowUpResponseDto> {
    const current = await this.getFollowUpOrThrow(id);
    this.assertOwnership(current, currentUser);
    if (current.status !== FollowUpStatus.SCHEDULED) {
      throw new ConflictException('follow_up_already_terminal');
    }

    if (dto.status === FollowUpStatus.CANCELED && !dto.cancelReason?.trim()) {
      throw new BadRequestException('cancelReason is required');
    }

    if (
      dto.status !== FollowUpStatus.COMPLETED &&
      dto.status !== FollowUpStatus.CANCELED &&
      dto.status !== FollowUpStatus.MISSED
    ) {
      throw new UnprocessableEntityException('invalid_status_transition');
    }

    const updated = await this.prisma.followUp.update({
      where: { id },
      data: {
        status: dto.status,
        cancellationReason: dto.status === FollowUpStatus.CANCELED ? dto.cancelReason!.trim() : null,
      },
      include: this.followUpInclude(),
    });

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: dto.status === FollowUpStatus.CANCELED ? AUDIT_ACTIONS.FOLLOW_UP_CANCELED : AUDIT_ACTIONS.FOLLOW_UP_STATUS_UPDATED,
      targetType: AUDIT_TARGET_TYPES.FOLLOW_UP,
      targetId: updated.id,
      payload: { from: current.status, to: dto.status },
    });

    return FollowUpResponseDto.fromRecord(updated as any);
  }

  async cancel(id: string, dto: CancelFollowUpDto, currentUser: AuthenticatedUser): Promise<FollowUpResponseDto> {
    return this.updateStatus(id, { status: FollowUpStatus.CANCELED, cancelReason: dto.cancelReason }, currentUser);
  }

  private async buildWhere(query: FollowUpsQueryDto, currentUser: AuthenticatedUser, timeZone: string): Promise<any> {
    const where: any = {};

    if (currentUser.role === Role.DOCTOR) {
      if (!currentUser.doctorProfileId) {
        throw new ForbiddenException();
      }
      where.doctorProfileId = currentUser.doctorProfileId;
    }

    if (currentUser.role !== Role.DOCTOR && query.doctorId) {
      where.doctorProfileId = query.doctorId;
    }

    if (query.patientId) {
      where.patientUserId = query.patientId;
    }

    if (query.patientName) {
      where.patient = {
        OR: [
          { firstName: { contains: query.patientName, mode: 'insensitive' } },
          { lastName: { contains: query.patientName, mode: 'insensitive' } },
        ],
      };
    }

    if (query.status?.length) {
      where.status = { in: query.status };
    }

    if (query.overdueOnly) {
      where.status = FollowUpStatus.SCHEDULED;
      where.appointment = { startTime: { lt: new Date() } };
    }

    const from = query.from ? this.normalizeQueryDate(query.from, timeZone, 'from').startOf('day').toUTC().toJSDate() : null;
    const to = query.to ? this.normalizeQueryDate(query.to, timeZone, 'to').endOf('day').toUTC().toJSDate() : null;
    if (from && to && to < from) {
      throw new BadRequestException('to must be greater than or equal to from');
    }
    if (from || to) {
      where.appointment = {
        ...(where.appointment ?? {}),
        startTime: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        },
      };
    }

    return where;
  }

  private async loadPatient(patientId: string) {
    const patient = await this.prisma.user.findUnique({
      where: { id: patientId },
      include: { patientProfile: true },
    });
    if (!patient || patient.patientProfile === null) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  private normalizeQueryDate(value: string, timeZone: string, field: 'from' | 'to') {
    const day = DateTime.fromISO(value, { zone: timeZone });
    if (!day.isValid) {
      throw new BadRequestException(`Invalid ${field} date`);
    }
    return day;
  }

  private async loadSourceAppointment(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctorProfile: { include: { user: true } },
      },
    });
    if (!appointment) {
      throw new NotFoundException('Source appointment not found');
    }
    return appointment;
  }

  private async getFollowUpOrThrow(id: string) {
    const record = await this.prisma.followUp.findUnique({ where: { id }, ...this.followUpInclude() });
    if (!record) {
      throw new NotFoundException('Follow-up not found');
    }
    return record as any;
  }

  private followUpInclude():any {
    return {
      include: {
        appointment: { select: { id: true, startTime: true, endTime: true, status: true, needsFollowUp: true } },
        patient: { select: { id: true, firstName: true, lastName: true, preferredLocale: true } },
        doctorProfile: { include: { user: { select: { firstName: true, lastName: true } } } },
        scheduledBy: { select: { id: true, firstName: true, lastName: true } },
        sourceAppointment: { select: { id: true, needsFollowUp: true } },
      },
    } as const;
  }

  private appointmentWithFollowUpInclude(): any {
    return {
      followUp: {
        include: this.followUpInclude().include,
      },
    } as const;
  }

  private assertOwnership(record: FollowUpRecord, currentUser: AuthenticatedUser) {
    if (currentUser.role === Role.ADMIN || currentUser.role === Role.RECEPTIONIST) {
      return;
    }
    if (currentUser.role === Role.DOCTOR && record.doctorProfileId === currentUser.doctorProfileId) {
      return;
    }
    throw new ForbiddenException();
  }

  private parseUtcDateTime(value: string) {
    const dt = DateTime.fromISO(value, { zone: 'utc' });
    if (!dt.isValid || !value.endsWith('Z')) {
      throw new BadRequestException('Invalid UTC datetime');
    }
    return dt.toJSDate();
  }

  private async queueFollowUpNotifications(record: FollowUpRecord, reminderHoursBefore: number) {
    const locale = record.patient.preferredLocale === Locale.AR ? 'ar' : 'en';
    await this.notificationsService.queueAppointmentConfirmation({
      appointmentId: record.appointmentId,
      patientUserId: record.patientUserId,
      locale,
    });
    await this.notificationsService.queueReminder(
      {
        appointmentId: record.appointmentId,
        patientUserId: record.patientUserId,
        locale,
      },
      record.appointment.startTime,
      reminderHoursBefore,
    );
  }
}
