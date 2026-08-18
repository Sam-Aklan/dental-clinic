import { Injectable, Logger } from '@nestjs/common';
import { DateTime } from 'luxon';
import { Server } from 'socket.io';
import { AppointmentStatus } from '../generated/prisma/enums';
import { ClinicConfigService } from '../clinic-config/clinic-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { QueueItemDto, QueueRemovedEvent, QueueSnapshotEvent, QueueUpdatedEvent } from './dto';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private server: Server | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly clinicConfigService: ClinicConfigService,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async buildSnapshot(doctorId: string): Promise<QueueSnapshotEvent> {
    const config = await this.clinicConfigService.getConfig();
    const day = DateTime.now().setZone(config.timeZone);
    const bounds = this.getDayBounds(day, config.timeZone);
    const [doctor, positions, appointments] = await Promise.all([
      this.prisma.doctorProfile.findUnique({
        where: { id: doctorId },
        select: {
          user: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      this.calculatePositions(doctorId, bounds),
      this.prisma.appointment.findMany({
        where: {
          doctorProfileId: doctorId,
          status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS] },
          startTime: { gte: bounds.start, lt: bounds.end },
        },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    return {
      doctorId,
      date: day.toISODate() ?? bounds.start.toISOString().slice(0, 10),
      doctorDisplayName: doctor?.user ? `${doctor.user.firstName} ${doctor.user.lastName}`.trim() : doctorId,
      items: appointments.map((appointment) => this.toQueueItemDto(appointment, positions.get(appointment.id) ?? null)),
    };
  }

  async emitUpdated(appointmentId: string, doctorId: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appointment) {
      this.logger.warn(`queue.updated.missing appointmentId=${appointmentId} doctorId=${doctorId}`);
      await this.emitRemoved(appointmentId, doctorId);
      return;
    }

    const positions = await this.calculatePositions(doctorId);
    const payload: QueueUpdatedEvent = {
      appointmentId: appointment.id,
      doctorId,
      status: appointment.status,
      position: positions.get(appointment.id) ?? null,
      needsFollowUp: appointment.needsFollowUp,
      startsAt: appointment.startTime.toISOString(),
      endsAt: appointment.endTime.toISOString(),
      updatedAt: appointment.updatedAt.toISOString(),
    };

    this.server?.to(`doctor:${doctorId}`).emit('queue.updated', payload);
    this.logger.log(`queue.updated appointmentId=${appointment.id} doctorId=${doctorId} status=${appointment.status}`);
  }

  async emitRemoved(appointmentId: string, doctorId: string) {
    const payload: QueueRemovedEvent = { appointmentId, doctorId };
    this.server?.to(`doctor:${doctorId}`).emit('queue.removed', payload);
    this.logger.log(`queue.removed appointmentId=${appointmentId} doctorId=${doctorId}`);
  }

  async calculatePositions(doctorId: string, bounds?: { start: Date; end: Date }): Promise<Map<string, number>> {
    const config = await this.clinicConfigService.getConfig();
    const window = bounds ?? this.getDayBounds(DateTime.now().setZone(config.timeZone), config.timeZone);
    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorProfileId: doctorId,
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.IN_PROGRESS] },
        startTime: { gte: window.start, lt: window.end },
      },
      orderBy: { startTime: 'asc' },
      select: { id: true },
    });

    return new Map(appointments.map((appointment, index) => [appointment.id, index + 1] as const));
  }

  private getDayBounds(day: DateTime, timeZone: string) {
    const start = day.startOf('day').toUTC().toJSDate();
    const end = day.plus({ days: 1 }).startOf('day').toUTC().toJSDate();
    return { start, end, timeZone };
  }

  private toQueueItemDto(appointment: { id: string; status: AppointmentStatus; needsFollowUp?: boolean; startTime: Date; endTime: Date }, position: number | null): QueueItemDto {
    return {
      appointmentId: appointment.id,
      position,
      status: appointment.status,
      needsFollowUp: appointment.needsFollowUp ?? false,
      startsAt: appointment.startTime.toISOString(),
      endsAt: appointment.endTime.toISOString(),
    };
  }
}
