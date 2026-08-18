import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { SlotGeneratorService } from './slot-generator.service';

export type ClinicConfigRecord = {
  slotDurationMinutes: number;
  timeZone: string;
  minArrivalMinutes: number;
  reminderHoursBefore: number;
};

@Injectable()
export class SlotValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slotGenerator: SlotGeneratorService,
  ) {}

  async loadClinicConfig(): Promise<ClinicConfigRecord> {
    const config = await this.prisma.clinicConfig.findFirst();
    if (!config) {
      throw new NotFoundException('Clinic configuration not found');
    }

    return { ...config, reminderHoursBefore: config.reminderHoursBefore ?? 0 } as ClinicConfigRecord;
  }

  async ensureDoctor(doctorProfileId: string) {
    const doctor = await this.prisma.doctorProfile.findUnique({
      where: { id: doctorProfileId },
      include: { user: true },
    });

    if (!doctor || doctor.user.role !== Role.DOCTOR) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }

  async assertAvailableSlot(doctorProfileId: string, startsAt: Date, config: ClinicConfigRecord) {
    const slots = this.slotGenerator.generate({
      doctorProfileId,
      from: startsAt,
      to: startsAt,
      clinicConfig: config,
      workingHours: await this.prisma.workingHour.findMany(),
      holidays: await this.prisma.holiday.findMany({ where: { date: startsAt } }),
      overrides: await this.prisma.doctorScheduleOverride.findMany({ where: { doctorProfileId, date: startsAt } }),
      bookedStartTimes: (
        await this.prisma.appointment.findMany({
          where: { doctorProfileId, startTime: startsAt, status: { not: AppointmentStatus.CANCELED } },
          select: { startTime: true },
        })
      ).map((row) => row.startTime),
    });

    const slot = slots.find((candidate) => candidate.startsAt === startsAt.toISOString());
    if (!slot) {
      throw new ConflictException('slot_already_booked');
    }

    return { endsAt: new Date(slot.endsAt) };
  }
}
