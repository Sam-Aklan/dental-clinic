import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, Optional, UnprocessableEntityException } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { Prisma } from '../generated/prisma/client';
import { AppointmentStatus, Role } from '../generated/prisma/enums';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentRecord, AppointmentResponseDto, AppointmentsQueryDto, AvailableSlotResponseDto, CreateAppointmentDto, RescheduleDto, SlotsQueryDto, UpdateNotesDto, UpdateStatusDto } from './dto';
import { SlotGeneratorService } from './slot-generator.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { QueueService } from '../queue/queue.service';
import { SLOT_OPENED_JOB, WAITLIST_OFFER_ENGINE_QUEUE } from '../common/constants/queue.constants';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DateTime } from 'luxon';
import { NotificationsService } from '../notifications/notifications.service';
import { Locale } from '../generated/prisma/enums';
import { SlotValidationService } from './slot-validation.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly slotGenerator: SlotGeneratorService,
    private readonly slotValidationService: SlotValidationService,
    @InjectQueue(WAITLIST_OFFER_ENGINE_QUEUE) private readonly waitlistOfferQueue: Queue,
    private readonly queueService: QueueService,
    private readonly notificationsService: NotificationsService,
    @Optional() private readonly auditService: AuditService = { log: async () => undefined } as unknown as AuditService,
  ) {}

  async getSlots(query: SlotsQueryDto, currentUser?: AuthenticatedUser): Promise<AvailableSlotResponseDto[]> {
    const doctor = await this.slotValidationService.ensureDoctor(query.doctorId);
    const config = await this.slotValidationService.loadClinicConfig();
    const range = this.parseDateRange(query.from, query.to, config.timeZone);

    const [workingHours, holidays, overrides, bookedStartTimes] = await Promise.all([
      this.prisma.workingHour.findMany({ orderBy: { dayOfWeek: 'asc' } }),
      this.prisma.holiday.findMany({ where: { date: { gte: range.from, lte: range.to } } }),
      this.prisma.doctorScheduleOverride.findMany({ where: { doctorProfileId: doctor.id, date: { gte: range.from, lte: range.to } } }),
      this.prisma.appointment.findMany({
        where: {
          doctorProfileId: doctor.id,
          status: { not: AppointmentStatus.CANCELED },
          startTime: { gte: range.from, lte: range.to },
        },
        select: { startTime: true },
      }),
    ]);

    const isReceptionistOrAdmin = currentUser?.role === Role.RECEPTIONIST || currentUser?.role === Role.ADMIN;
    const minArrivalMinutes = isReceptionistOrAdmin ? 0 : config.minArrivalMinutes;

    return this.slotGenerator.generate({
      doctorProfileId: doctor.id,
      from: range.from,
      to: range.to,
      clinicConfig: { ...config, minArrivalMinutes },
      workingHours,
      holidays,
      overrides,
      bookedStartTimes: bookedStartTimes.map((row) => row.startTime),
      includeReserved: query.includeReserved,
    });
  }

  async createAppointment(dto: CreateAppointmentDto, currentUser: AuthenticatedUser, idempotencyKey: string): Promise<AppointmentResponseDto> {
    const targetPatientId = this.resolvePatientId(dto.patientId, currentUser);
    const doctor = await this.slotValidationService.ensureDoctor(dto.doctorId);
    const startsAt = this.parseUtcDateTime(dto.startsAt);
    const config = await this.slotValidationService.loadClinicConfig();
    if (startsAt < new Date()) {
      throw new BadRequestException('startsAt must be in the future');
    }

    const existingByKey = await this.prisma.appointment.findUnique({
      where: { idempotencyKey },
      include: this.appointmentInclude(),
    });
    if (existingByKey) {
      return AppointmentResponseDto.fromRecord(existingByKey as AppointmentRecord);
    }

    const isReceptionistOrAdmin = currentUser.role === Role.RECEPTIONIST || currentUser.role === Role.ADMIN;
    const minArrivalMinutes = isReceptionistOrAdmin ? 0 : config.minArrivalMinutes;
    const slot = await this.slotValidationService.assertAvailableSlot(doctor.id, startsAt, { ...config, minArrivalMinutes });

    try {
      const created = await this.prisma.$transaction(async (tx) => {
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
            patientUserId: targetPatientId,
            startTime: startsAt,
            endTime: slot.endsAt,
            idempotencyKey,
            status: AppointmentStatus.PENDING,
            needsFollowUp: false,
          } as any,
          include: this.appointmentInclude(),
        });

        return appointment;
      });

      await this.auditService.log({
        actorId: currentUser.userId,
        actorRole: currentUser.role,
        action: AUDIT_ACTIONS.APPOINTMENT_CREATED,
        targetType: AUDIT_TARGET_TYPES.APPOINTMENT,
        targetId: created.id,
        payload: {
          doctorId: doctor.id,
          doctorName: `${created.doctorProfile.user.firstName} ${created.doctorProfile.user.lastName}`.trim(),
          patientId: targetPatientId,
          patientName: `${created.patient.firstName} ${created.patient.lastName}`.trim(),
          startsAt: created.startTime.toISOString(),
        },
      });

      const patientLocale = created.patient.preferredLocale === Locale.AR ? 'ar' : 'en';
      await this.runNotificationTask(
        'appointment_confirmation',
        created.id,
        this.notificationsService.queueAppointmentConfirmation({
          appointmentId: created.id,
          patientUserId: created.patientUserId,
          locale: patientLocale,
        }),
      );
      await this.runNotificationTask(
        'appointment_reminder',
        created.id,
        this.notificationsService.queueReminder(
          {
            appointmentId: created.id,
            patientUserId: created.patientUserId,
            locale: patientLocale,
          },
          created.startTime,
          config.reminderHoursBefore,
        ),
      );

      await this.queueService.emitUpdated(created.id, created.doctorProfileId);
      return AppointmentResponseDto.fromRecord(created as AppointmentRecord);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if ((error as { code?: string }).code === 'P2002') {
        const original = await this.prisma.appointment.findUnique({ where: { idempotencyKey }, include: this.appointmentInclude() });
        if (original) {
          return AppointmentResponseDto.fromRecord(original as AppointmentRecord);
        }
        throw new ConflictException('slot_already_booked');
      }
      throw error;
    }
  }

  async updateStatus(id: string, dto: UpdateStatusDto, currentUser: AuthenticatedUser): Promise<AppointmentResponseDto> {
    const appointment = await this.getAppointmentRecordOrThrow(id);
    const followUpFlagOnlyUpdate = appointment.status === AppointmentStatus.COMPLETED && dto.status === AppointmentStatus.COMPLETED && dto.needsFollowUp !== undefined;

    if (followUpFlagOnlyUpdate) {
      this.assertOwnership(appointment, currentUser);
    } else {
      this.assertStatusTransition(appointment, dto.status, currentUser);
    }

    if (dto.needsFollowUp !== undefined && dto.status !== AppointmentStatus.COMPLETED && !followUpFlagOnlyUpdate) {
      throw new BadRequestException('needsFollowUp can only be set for completed appointments');
    }

    const config = await this.slotValidationService.loadClinicConfig();

    const updated = await this.prisma.$transaction(async (tx) => {
      if (followUpFlagOnlyUpdate) {
        return tx.appointment.update({
          where: { id },
          data: {
            needsFollowUp: dto.needsFollowUp ?? false,
          } as any,
          include: this.appointmentInclude(),
        });
      }

      const next = await tx.appointment.update({
        where: { id },
        data: {
          status: dto.status,
          needsFollowUp: dto.status === AppointmentStatus.COMPLETED ? (dto.needsFollowUp ?? false) : false,
          cancellationReason: appointment.cancellationReason,
        } as any,
        include: this.appointmentInclude(),
      });

      return next;
    });

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: dto.status === AppointmentStatus.CANCELED ? AUDIT_ACTIONS.APPOINTMENT_CANCELED : AUDIT_ACTIONS.APPOINTMENT_STATUS_UPDATED,
      targetType: AUDIT_TARGET_TYPES.APPOINTMENT,
      targetId: updated.id,
      payload: followUpFlagOnlyUpdate
        ? { from: appointment.needsFollowUp, to: dto.needsFollowUp, needsFollowUp: dto.needsFollowUp }
        : { from: appointment.status, to: dto.status, ...(dto.needsFollowUp !== undefined ? { needsFollowUp: dto.needsFollowUp } : {}) },
    });

    if (!followUpFlagOnlyUpdate) {
      const patientLocale = updated.patient.preferredLocale === Locale.AR ? 'ar' : 'en';
      await this.notificationsService.queueReminder(
        {
          appointmentId: updated.id,
          patientUserId: updated.patientUserId,
          locale: patientLocale,
        },
        dto.status === AppointmentStatus.CONFIRMED || dto.status === AppointmentStatus.IN_PROGRESS ? updated.startTime : new Date(0),
        config.reminderHoursBefore,
      );

      if (dto.status === AppointmentStatus.CANCELED) {
        await this.waitlistOfferQueue.add(SLOT_OPENED_JOB, {
          doctorProfileId: updated.doctorProfileId,
          startsAt: updated.startTime.toISOString(),
          actorId: currentUser.userId,
          actorRole: currentUser.role,
        });
        this.logger.log(`appointment.slot_opened_enqueued doctorProfileId=${updated.doctorProfileId} startTime=${updated.startTime.toISOString()}`);
      }
    }

    await this.queueService.emitUpdated(updated.id, updated.doctorProfileId);
    return AppointmentResponseDto.fromRecord(updated as AppointmentRecord);
  }

  async reschedule(id: string, dto: RescheduleDto, currentUser: AuthenticatedUser): Promise<AppointmentResponseDto> {
    if (currentUser.role !== Role.RECEPTIONIST && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }

    const current = await this.getAppointmentRecordOrThrow(id);
    const startsAt = this.parseUtcDateTime(dto.startsAt);
    if (startsAt < new Date()) {
      throw new BadRequestException('startsAt must be in the future');
    }

    const config = await this.slotValidationService.loadClinicConfig();
    const slot = await this.slotValidationService.assertAvailableSlot(current.doctorProfileId, startsAt, { ...config, minArrivalMinutes: 0 });

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.appointment.update({
        where: { id },
        data: {
          startTime: startsAt,
          endTime: slot.endsAt,
          status: AppointmentStatus.PENDING,
          cancellationReason: dto.cancellationReason ?? null,
          needsFollowUp: false,
        } as any,
        include: this.appointmentInclude(),
      });

      return next;
    });

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: AUDIT_ACTIONS.APPOINTMENT_RESCHEDULED,
      targetType: AUDIT_TARGET_TYPES.APPOINTMENT,
      targetId: updated.id,
      payload: { from: current.startTime.toISOString(), to: startsAt.toISOString() },
    });

    const patientLocale = current.patient.preferredLocale === Locale.AR ? 'ar' : 'en';
    await this.notificationsService.queueReminder(
      {
        appointmentId: updated.id,
        patientUserId: updated.patientUserId,
        locale: patientLocale,
      },
      startsAt,
      config.reminderHoursBefore,
    );

    await this.waitlistOfferQueue.add(SLOT_OPENED_JOB, {
      doctorProfileId: current.doctorProfileId,
      startsAt: current.startTime.toISOString(),
      actorId: currentUser.userId,
      actorRole: currentUser.role,
    });
    await this.queueService.emitUpdated(updated.id, updated.doctorProfileId);

    return AppointmentResponseDto.fromRecord(updated as AppointmentRecord);
  }

  async updateNotes(id: string, dto: UpdateNotesDto, currentUser: AuthenticatedUser): Promise<AppointmentResponseDto> {
    const appointment = await this.getAppointmentRecordOrThrow(id);
    this.assertCanUpdateNotes(appointment, currentUser);

    const normalizedNotes = dto.notes?.trim() ? dto.notes.trim() : null;
    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { notes: normalizedNotes } as any,
      include: this.appointmentInclude(),
    });

    await this.queueService.emitUpdated(updated.id, updated.doctorProfileId);
    return AppointmentResponseDto.fromRecord(updated as AppointmentRecord);
  }

  async deleteAppointment(id: string, currentUser: AuthenticatedUser): Promise<void> {
    if (currentUser.role !== Role.RECEPTIONIST && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }

    const current = await this.getAppointmentRecordOrThrow(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.appointment.delete({ where: { id } });
    });

    await this.auditService.log({
      actorId: currentUser.userId,
      actorRole: currentUser.role,
      action: AUDIT_ACTIONS.APPOINTMENT_CANCELED,
      targetType: AUDIT_TARGET_TYPES.APPOINTMENT,
      targetId: id,
      payload: {
        doctorId: current.doctorProfileId,
        doctorName: `${current.doctorProfile.user.firstName} ${current.doctorProfile.user.lastName}`.trim(),
        patientId: current.patientUserId,
        patientName: `${current.patient.firstName} ${current.patient.lastName}`.trim(),
        removed: true,
      },
    });

    const patientLocale = current.patient.preferredLocale === Locale.AR ? 'ar' : 'en';
    await this.notificationsService.queueReminder(
      {
        appointmentId: current.id,
        patientUserId: current.patientUserId,
        locale: patientLocale,
      },
      new Date(0),
      0,
    );

    await this.waitlistOfferQueue.add(SLOT_OPENED_JOB, {
      doctorProfileId: current.doctorProfileId,
      startsAt: current.startTime.toISOString(),
      actorId: currentUser.userId,
      actorRole: currentUser.role,
    });
    this.logger.log(`appointment.slot_opened_enqueued doctorProfileId=${current.doctorProfileId} startTime=${current.startTime.toISOString()}`);

    await this.queueService.emitRemoved(id, current.doctorProfileId);
  }

  async getAppointments(query: AppointmentsQueryDto, currentUser: AuthenticatedUser) {
    const where = await this.buildListWhere(query, currentUser);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const orderBy = this.buildOrderBy(query);

    let pastCount: number | undefined;
    let upcomingCount: number | undefined;

    if (currentUser.role === Role.RECEPTIONIST && query.patientId) {
      const now = new Date();
      const [past, upcoming] = await Promise.all([
        this.prisma.appointment.count({
          where: {
            patientUserId: query.patientId,
            status: { in: [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW] },
            startTime: { lt: now },
          },
        }),
        this.prisma.appointment.count({
          where: {
            patientUserId: query.patientId,
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS] },
            startTime: { gte: now },
          },
        }),
      ]);
      pastCount = past;
      upcomingCount = upcoming;
    }

    const [total, items] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: this.appointmentInclude(),
      }),
    ]);

    return {
      items: items.map((item) => AppointmentResponseDto.fromRecord(item as AppointmentRecord)),
      total,
      page,
      pageSize,
      ...(pastCount !== undefined ? { pastCount } : {}),
      ...(upcomingCount !== undefined ? { upcomingCount } : {}),
    };
  }

  async getAppointment(id: string, currentUser: AuthenticatedUser): Promise<AppointmentResponseDto> {
    const appointment = await this.getAppointmentRecordOrThrow(id);
    this.assertOwnership(appointment, currentUser);
    return AppointmentResponseDto.fromRecord(appointment);
  }

  async exportToCsv(query: AppointmentsQueryDto, currentUser: AuthenticatedUser): Promise<string> {
    if (currentUser.role !== Role.RECEPTIONIST && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }

    const rows = await this.prisma.appointment.findMany({
      where: await this.buildListWhere(query, currentUser, true),
      orderBy: this.buildOrderBy(query),
      include: this.appointmentInclude(),
    });

    return stringify(
      rows.map((row) => {
        const dto = AppointmentResponseDto.fromRecord(row as AppointmentRecord);
        return {
          id: dto.id,
          patientFirstName: dto.patient.firstName,
          patientLastName: dto.patient.lastName,
          doctorFirstName: dto.doctor.firstName,
          doctorLastName: dto.doctor.lastName,
          startsAt: dto.startsAt,
          endsAt: dto.endsAt,
          status: dto.status,
          createdAt: dto.createdAt,
          cancellationReason: dto.cancellationReason ?? '',
        };
      }),
      {
        header: true,
        columns: [
          { key: 'id', header: 'id' },
          { key: 'patientFirstName', header: 'patientFirstName' },
          { key: 'patientLastName', header: 'patientLastName' },
          { key: 'doctorFirstName', header: 'doctorFirstName' },
          { key: 'doctorLastName', header: 'doctorLastName' },
          { key: 'startsAt', header: 'startsAt' },
          { key: 'endsAt', header: 'endsAt' },
          { key: 'status', header: 'status' },
          { key: 'createdAt', header: 'createdAt' },
          { key: 'cancellationReason', header: 'cancellationReason' },
        ],
      },
    );
  }

  private appointmentInclude() {
    return {
      doctorProfile: { include: { user: { select: { firstName: true, lastName: true } } } },
      patient: { select: { id: true, firstName: true, lastName: true, email: true, preferredLocale: true, phone: true } },
      followUp: { select: { id: true } },
    } as const;
  }

  private parseDateRange(from: string, to: string, timeZone = 'utc') {
    const fromDate = DateTime.fromISO(from, { zone: timeZone }).startOf('day').toUTC().toJSDate();
    const toDate = DateTime.fromISO(to, { zone: timeZone }).endOf('day').toUTC().toJSDate();
    if (toDate < fromDate) {
      throw new BadRequestException('to must be >= from');
    }
    const spanDays = DateTime.fromJSDate(toDate).diff(DateTime.fromJSDate(fromDate), 'days').days;
    if (spanDays > 31) {
      throw new BadRequestException('date range must not exceed 31 days');
    }
    return { from: fromDate, to: toDate };
  }

  private parseUtcDateTime(value: string) {
    const dt = DateTime.fromISO(value, { zone: 'utc' });
    if (!dt.isValid || !value.endsWith('Z')) {
      throw new BadRequestException('Invalid UTC datetime');
    }
    return dt.toJSDate();
  }

  private resolvePatientId(patientId: string | undefined, currentUser: AuthenticatedUser) {
    if (currentUser.role === Role.PATIENT) {
      return currentUser.userId;
    }
    if (patientId) {
      return patientId;
    }
    throw new BadRequestException('patientId is required for staff bookings');
  }

  private async buildListWhere(query: AppointmentsQueryDto, currentUser: AuthenticatedUser, staffOnly = false): Promise<Prisma.AppointmentWhereInput> {
    const where: Prisma.AppointmentWhereInput = {};
    const dateRange = query.date ? { from: query.date, to: query.date } : query.from && query.to ? { from: query.from, to: query.to } : undefined;
    if (dateRange) {
      const parsed = this.parseDateRange(dateRange.from, dateRange.to);
      where.startTime = { gte: parsed.from, lte: parsed.to };
    }

    if (query.doctorId?.length) {
      where.doctorProfileId = { in: query.doctorId };
    }

    if (query.status?.length) {
      where.status = { in: query.status };
    }

    if (query.patientName && !query.patientId && (currentUser.role === Role.RECEPTIONIST || currentUser.role === Role.ADMIN)) {
      where.patient = {
        OR: [
          { firstName: { contains: query.patientName, mode: 'insensitive' } },
          { lastName: { contains: query.patientName, mode: 'insensitive' } },
          { phone: { contains: query.patientName, mode: 'insensitive' } },
        ],
      };
    }

    if (currentUser.role === Role.PATIENT) {
      where.patientUserId = currentUser.userId;
    } else if (query.patientId) {
      where.patientUserId = query.patientId;
    }

    if (currentUser.role === Role.DOCTOR) {
      where.doctorProfileId = currentUser.doctorProfileId ?? undefined;
    }

    return where;
  }

  private buildOrderBy(query: AppointmentsQueryDto) {
    switch (query.sortBy) {
      case 'createdAt':
        return { createdAt: query.sortDir ?? 'asc' };
      case 'status':
        return { status: query.sortDir ?? 'asc' };
      case 'patientName':
        return { patient: { lastName: query.sortDir ?? 'asc' } };
      case 'startsAt':
      default:
        return { startTime: query.sortDir ?? 'asc' };
    }
  }

  private async runNotificationTask(taskName: string, appointmentId: string, task: Promise<void>) {
    try {
      await task;
    } catch (error) {
      this.logger.warn(
        `appointments.notification_enqueue_failed task=${taskName} appointmentId=${appointmentId} error=${error instanceof Error ? error.message : 'unknown_error'}`,
      );
    }
  }

  private async getAppointmentRecordOrThrow(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id }, include: this.appointmentInclude() });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment as AppointmentRecord;
  }

  private assertOwnership(appointment: AppointmentRecord, currentUser: AuthenticatedUser) {
    if (currentUser.role === Role.ADMIN || currentUser.role === Role.RECEPTIONIST) {
      return;
    }
    if (currentUser.role === Role.PATIENT && appointment.patientUserId === currentUser.userId) {
      return;
    }
    if (currentUser.role === Role.DOCTOR && appointment.doctorProfileId === currentUser.doctorProfileId) {
      return;
    }
    throw new ForbiddenException();
  }

  private assertCanUpdateNotes(appointment: AppointmentRecord, currentUser: AuthenticatedUser) {
    if (currentUser.role !== Role.DOCTOR && currentUser.role !== Role.RECEPTIONIST && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }

    this.assertOwnership(appointment, currentUser);
  }

  private assertStatusTransition(appointment: AppointmentRecord, status: AppointmentStatus, currentUser: AuthenticatedUser) {
    const allowed: Record<AppointmentStatus, AppointmentStatus[]> = {
      PENDING: [AppointmentStatus.CONFIRMED, AppointmentStatus.CANCELED],
      CONFIRMED: [AppointmentStatus.IN_PROGRESS, AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW],
      IN_PROGRESS: [AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW],
      COMPLETED: [],
      CANCELED: [],
      NO_SHOW: [],
    };

    if (!allowed[appointment.status].includes(status)) {
      throw new UnprocessableEntityException('invalid_status_transition');
    }

    if (status === AppointmentStatus.CONFIRMED) {
      if (currentUser.role === Role.DOCTOR) {
        if (appointment.doctorProfileId !== currentUser.doctorProfileId) {
          throw new ForbiddenException();
        }
      } else if (currentUser.role !== Role.RECEPTIONIST && currentUser.role !== Role.ADMIN) {
        throw new ForbiddenException();
      }
    }

    if (status === AppointmentStatus.IN_PROGRESS || status === AppointmentStatus.COMPLETED) {
      if (currentUser.role === Role.DOCTOR) {
        if (appointment.doctorProfileId !== currentUser.doctorProfileId) {
          throw new ForbiddenException();
        }
      } else if (currentUser.role !== Role.RECEPTIONIST && currentUser.role !== Role.ADMIN) {
        throw new ForbiddenException();
      }
    }

    if (status === AppointmentStatus.CANCELED && currentUser.role === Role.PATIENT) {
      if (appointment.patientUserId !== currentUser.userId) {
        throw new ForbiddenException();
      }
      const hoursUntilStart = DateTime.fromJSDate(appointment.startTime).diff(DateTime.now(), 'hours').hours;
      if (hoursUntilStart < 24) {
        throw new ForbiddenException('cancellation_window_expired');
      }
    } else if (status === AppointmentStatus.CANCELED && currentUser.role !== Role.RECEPTIONIST && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }

    if (status === AppointmentStatus.NO_SHOW && currentUser.role !== Role.RECEPTIONIST && currentUser.role !== Role.ADMIN) {
      throw new ForbiddenException();
    }
  }

}
