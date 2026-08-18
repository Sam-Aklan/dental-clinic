import { BadRequestException, ConflictException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../audit/audit.constants';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import {
  ClinicConfigResponseDto,
  CreateHolidayDto,
  HolidayResponseDto,
  UpdateClinicConfigDto,
  WorkingHourDto,
  WorkingHourResponseDto,
} from './dto';

type ClinicConfigRecord = {
  id: string;
  slotDurationMinutes: number;
  timeZone: string;
  reminderHoursBefore: number;
  offerWindowMinutes: number;
  minArrivalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
};

type WorkingHourRecord = {
  id: string | null;
  dayOfWeek: number;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type HolidayRecord = {
  id: string;
  date: Date;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

const SINGLETON_ID = 'clinic-config-singleton';
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

@Injectable()
export class ClinicConfigService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly auditService: AuditService = { log: async () => undefined } as unknown as AuditService,
  ) {}

  async getConfig(): Promise<ClinicConfigResponseDto> {
    return this.mapClinicConfig(await this.getConfigRecord());
  }

  async updateConfig(dto: UpdateClinicConfigDto, currentUser?: AuthenticatedUser): Promise<ClinicConfigResponseDto> {
    const data = this.toClinicConfigUpdateData(dto);
    if (Object.keys(data).length === 0) {
      return this.mapClinicConfig(await this.getConfigRecord());
    }

    const config = (await this.prisma.clinicConfig.upsert({
      where: { id: SINGLETON_ID },
      update: data,
      create: {
        id: SINGLETON_ID,
        slotDurationMinutes: dto.slotDurationMinutes ?? 30,
        timeZone: dto.timeZone ?? 'UTC',
        reminderHoursBefore: dto.reminderHoursBefore ?? 24,
        offerWindowMinutes: dto.offerWindowMinutes ?? 30,
        minArrivalMinutes: dto.minArrivalMinutes ?? 45,
      },
    })) as ClinicConfigRecord;

    if (currentUser) {
      await this.auditService.log({
        actorId: currentUser.userId,
        actorRole: currentUser.role,
        action: AUDIT_ACTIONS.CLINIC_CONFIG_UPDATED,
        targetType: AUDIT_TARGET_TYPES.CLINIC_CONFIG,
        targetId: config.id,
        payload: data,
      });
    }

    return this.mapClinicConfig(config);
  }

  async getWorkingHours(): Promise<WorkingHourResponseDto[]> {
    const rows = (await this.prisma.workingHour.findMany({ orderBy: { dayOfWeek: 'asc' } })) as WorkingHourRecord[];
    const byDay = new Map(rows.map((row) => [row.dayOfWeek, row] as const));

    return Array.from({ length: 7 }, (_, dayOfWeek) => this.mapWorkingHour(byDay.get(dayOfWeek) ?? this.syntheticClosedDay(dayOfWeek)));
  }

  async replaceWorkingHours(dtos: WorkingHourDto[], currentUser?: AuthenticatedUser): Promise<WorkingHourResponseDto[]> {
    if (dtos.length !== 7) {
      throw new BadRequestException('Exactly 7 working hour entries required, one per day of week');
    }

    const seen = new Set<number>();
    for (const dto of dtos) {
      if (seen.has(dto.dayOfWeek)) {
        throw new BadRequestException('Duplicate dayOfWeek values are not allowed');
      }
      seen.add(dto.dayOfWeek);
      this.validateWorkingHour(dto);
    }

    const data = dtos.map((dto) => ({
      dayOfWeek: dto.dayOfWeek,
      isClosed: dto.isClosed,
      startTime: dto.isClosed ? null : dto.startTime ?? null,
      endTime: dto.isClosed ? null : dto.endTime ?? null,
    }));

    const [, , rows] = (await this.prisma.$transaction([
      this.prisma.workingHour.deleteMany(),
      this.prisma.workingHour.createMany({ data }),
      this.prisma.workingHour.findMany({ orderBy: { dayOfWeek: 'asc' } }),
    ])) as [unknown, unknown, WorkingHourRecord[]];

    if (currentUser) {
      await this.auditService.log({
        actorId: currentUser.userId,
        actorRole: currentUser.role,
        action: AUDIT_ACTIONS.WORKING_HOURS_UPDATED,
        targetType: AUDIT_TARGET_TYPES.CLINIC_CONFIG,
        targetId: SINGLETON_ID,
        payload: { dayCount: dtos.length },
      });
    }

    return rows.map((row) => this.mapWorkingHour(row));
  }

  async getHolidays(): Promise<HolidayResponseDto[]> {
    const rows = (await this.prisma.holiday.findMany({ orderBy: { date: 'asc' } })) as HolidayRecord[];
    return rows.map((row) => this.mapHoliday(row));
  }

  async createHoliday(dto: CreateHolidayDto, currentUser?: AuthenticatedUser): Promise<HolidayResponseDto> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('name must contain at least one non-whitespace character');
    }

    const config = await this.getConfigRecord();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: config.timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    if (dto.date < today) {
      throw new BadRequestException('Holiday date must be today or in the future');
    }

    try {
      const holiday = (await this.prisma.holiday.create({
        data: {
          date: new Date(`${dto.date}T00:00:00.000Z`),
          name,
        },
      })) as HolidayRecord;

      const response = this.mapHoliday(holiday);

      if (currentUser) {
        await this.auditService.log({
          actorId: currentUser.userId,
          actorRole: currentUser.role,
          action: AUDIT_ACTIONS.HOLIDAY_CREATED,
          targetType: AUDIT_TARGET_TYPES.HOLIDAY,
          targetId: holiday.id,
          payload: { date: dto.date, name },
        });
      }

      return response;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictException('A holiday already exists for this date');
      }
      throw error;
    }
  }

  async deleteHoliday(id: string, currentUser?: AuthenticatedUser): Promise<void> {
    const existing = (await this.prisma.holiday.findUnique({ where: { id } })) as HolidayRecord | null;
    if (!existing) {
      throw new NotFoundException('Holiday not found');
    }

    await this.prisma.holiday.delete({ where: { id } });

    if (currentUser) {
      await this.auditService.log({
        actorId: currentUser.userId,
        actorRole: currentUser.role,
        action: AUDIT_ACTIONS.HOLIDAY_DELETED,
        targetType: AUDIT_TARGET_TYPES.HOLIDAY,
        targetId: id,
        payload: { date: existing.date.toISOString().slice(0, 10), name: existing.name },
      });
    }
  }

  private async getConfigRecord(): Promise<ClinicConfigRecord> {
    const existing = (await this.prisma.clinicConfig.findUnique({ where: { id: SINGLETON_ID } })) as ClinicConfigRecord | null;
    if (existing) {
      return existing;
    }

    return (await this.prisma.clinicConfig.upsert({
      where: { id: SINGLETON_ID },
      update: {},
      create: {
        id: SINGLETON_ID,
        slotDurationMinutes: 30,
        timeZone: 'UTC',
        reminderHoursBefore: 24,
        offerWindowMinutes: 30,
        minArrivalMinutes: 45,
      },
    })) as ClinicConfigRecord;
  }

  private toClinicConfigUpdateData(dto: UpdateClinicConfigDto) {
    const data: Record<string, unknown> = {};
    if (dto.timeZone !== undefined) data.timeZone = dto.timeZone;
    if (dto.slotDurationMinutes !== undefined) data.slotDurationMinutes = dto.slotDurationMinutes;
    if (dto.reminderHoursBefore !== undefined) data.reminderHoursBefore = dto.reminderHoursBefore;
    if (dto.offerWindowMinutes !== undefined) data.offerWindowMinutes = dto.offerWindowMinutes;
    if (dto.minArrivalMinutes !== undefined) data.minArrivalMinutes = dto.minArrivalMinutes;
    return data;
  }

  private validateWorkingHour(dto: WorkingHourDto) {
    if (dto.isClosed) {
      if (dto.startTime !== null && dto.startTime !== undefined) {
        throw new BadRequestException('startTime and endTime must be null when isClosed is true');
      }
      if (dto.endTime !== null && dto.endTime !== undefined) {
        throw new BadRequestException('startTime and endTime must be null when isClosed is true');
      }
      return;
    }

    if (!dto.startTime || !dto.endTime) {
      throw new BadRequestException('startTime and endTime are required when isClosed is false');
    }

    if (!TIME_REGEX.test(dto.startTime)) {
      throw new BadRequestException('startTime must be in HH:mm format');
    }

    if (!TIME_REGEX.test(dto.endTime)) {
      throw new BadRequestException('endTime must be in HH:mm format');
    }

    if (dto.endTime <= dto.startTime) {
      throw new BadRequestException('endTime must be after startTime');
    }
  }

  private syntheticClosedDay(dayOfWeek: number): WorkingHourRecord {
    return {
      id: null,
      dayOfWeek,
      isClosed: true,
      startTime: null,
      endTime: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    };
  }

  private mapClinicConfig(config: ClinicConfigRecord): ClinicConfigResponseDto {
    return {
      id: config.id,
      slotDurationMinutes: config.slotDurationMinutes,
      timeZone: config.timeZone,
      reminderHoursBefore: config.reminderHoursBefore,
      offerWindowMinutes: config.offerWindowMinutes,
      minArrivalMinutes: config.minArrivalMinutes,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  private mapWorkingHour(hour: WorkingHourRecord): WorkingHourResponseDto {
    return {
      id: hour.id ?? null,
      dayOfWeek: hour.dayOfWeek,
      isClosed: hour.isClosed,
      startTime: hour.startTime,
      endTime: hour.endTime,
    };
  }

  private mapHoliday(holiday: HolidayRecord): HolidayResponseDto {
    return {
      id: holiday.id,
      date: holiday.date.toISOString().slice(0, 10),
      name: holiday.name,
      createdAt: holiday.createdAt.toISOString(),
    };
  }
}
