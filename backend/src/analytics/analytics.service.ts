import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { AppointmentStatus, Role } from '../generated/prisma/enums';
import { SlotGeneratorService } from '../appointments/slot-generator.service';
import {
  APPOINTMENT_STATUS_ZERO_MAP,
  ACTIVE_APPOINTMENT_STATUSES,
  AnalyticsBucket,
  AnalyticsDayOrWeekBucket,
  BOOKED_APPOINTMENT_STATUSES,
  FOLLOW_UP_DEFAULT_PAGE,
  FOLLOW_UP_DEFAULT_PAGE_SIZE,
  FOLLOW_UP_DEFAULT_THRESHOLD_DAYS,
  FOLLOW_UP_MAX_PAGE_SIZE,
  FOLLOW_UP_MAX_THRESHOLD_DAYS,
  MAX_CLINIC_RANGE_DAYS,
  WEEKDAY_LABELS,
} from './analytics.types';
import {
  AppointmentTrendResponseDto,
  AppointmentsByWeekdayResponseDto,
  BucketedRangeQueryDto,
  CancellationTrendResponseDto,
  CancellationTrendsQueryDto,
  DateRangeQueryDto,
  DoctorStatsResponseDto,
  DoctorUtilizationResponseDto,
  FollowUpItemResponseDto,
  FollowUpResponseDto,
  FollowUpsQueryDto,
  HourlyLoadResponseDto,
  KpiSummaryResponseDto,
  MyStatsQueryDto,
  MyTrendResponseDto,
  MyTrendsQueryDto,
  StatusDistributionResponseDto,
  TodayByDoctorResponseDto,
  TodaySummaryResponseDto,
  WaitlistSummaryByDoctorDto,
  WaitlistSummaryResponseDto,
} from './dto';

type DateWindow = {
  zone: string;
  from: DateTime;
  to: DateTime;
  utcFrom: Date;
  utcTo: Date;
  durationDays: number;
};

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slotGenerator: SlotGeneratorService,
  ) {}

  async getKpiSummary(query: DateRangeQueryDto): Promise<KpiSummaryResponseDto> {
    const window = await this.buildClinicWindow(query);
    const previousWindow = this.buildPreviousWindow(window);

    const [appointments, previousAppointments, activePatients, waitlistSize] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { startTime: { gte: window.utcFrom, lt: window.utcTo } },
        select: { status: true, patientUserId: true },
      }),
      this.prisma.appointment.findMany({
        where: { startTime: { gte: previousWindow.utcFrom, lt: previousWindow.utcTo } },
        select: { status: true },
      }),
      this.prisma.appointment.findMany({
        where: {
          startTime: { gte: window.utcFrom, lt: window.utcTo },
          status: { not: AppointmentStatus.CANCELED },
        },
        distinct: ['patientUserId'],
        select: { patientUserId: true },
      }),
      this.prisma.waitlistEntry.count(),
    ]);

    const currentTotals = this.reduceStatusCounts(appointments.map((appointment) => appointment.status));
    const previousTotals = this.reduceStatusCounts(previousAppointments.map((appointment) => appointment.status));
    const totalAppointments = appointments.length;
    const completed = currentTotals.COMPLETED;

    return {
      totalAppointments,
      completed,
      cancellationRate: this.safeRate(currentTotals.CANCELED, totalAppointments),
      noShowRate: this.safeRate(currentTotals.NO_SHOW, totalAppointments),
      activePatients: activePatients.length,
      waitlistSize,
      deltaTotalPct: this.safeDelta(totalAppointments, previousAppointments.length),
      deltaCompletedPct: this.safeDelta(completed, previousTotals.COMPLETED),
    };
  }

  async getWaitlistSummary(): Promise<WaitlistSummaryResponseDto> {
    const waitlistEntries = await this.prisma.waitlistEntry.findMany({
      include: {
        doctorProfile: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const byDoctor = new Map<string, WaitlistSummaryByDoctorDto>();
    for (const entry of waitlistEntries) {
      const doctorId = entry.doctorProfileId;
      const doctorName = `${entry.doctorProfile.user.firstName} ${entry.doctorProfile.user.lastName}`;
      const current = byDoctor.get(doctorId);
      if (current) {
        current.count += 1;
      } else {
        byDoctor.set(doctorId, { doctorId, doctorName, count: 1 });
      }
    }

    return {
      totalActive: waitlistEntries.length,
      byDoctor: Array.from(byDoctor.values()).sort((a, b) => b.count - a.count || a.doctorName.localeCompare(b.doctorName)),
    };
  }

  async getTodaySummary(): Promise<TodaySummaryResponseDto> {
    const window = await this.buildTodayWindow();
    const appointments = await this.prisma.appointment.findMany({
      where: { startTime: { gte: window.utcFrom, lt: window.utcTo } },
      select: { status: true, startTime: true },
    });
    const now = DateTime.now().setZone(window.zone);

    return {
      total: appointments.length,
      inProgress: appointments.filter((appointment) => appointment.status === AppointmentStatus.IN_PROGRESS).length,
      waiting: appointments.filter((appointment) => appointment.status === AppointmentStatus.CONFIRMED && DateTime.fromJSDate(appointment.startTime, { zone: window.zone }).toMillis() <= now.toMillis()).length,
      completed: appointments.filter((appointment) => appointment.status === AppointmentStatus.COMPLETED).length,
      canceledToday: appointments.filter((appointment) => appointment.status === AppointmentStatus.CANCELED).length,
      noShow: appointments.filter((appointment) => appointment.status === AppointmentStatus.NO_SHOW).length,
      pendingConfirmation: appointments.filter((appointment) => appointment.status === AppointmentStatus.PENDING).length,
    };
  }

  async getAppointmentTrends(query: BucketedRangeQueryDto): Promise<AppointmentTrendResponseDto[]> {
    const window = await this.buildClinicWindow(query);
    this.assertBucketWindow(window, query.bucket);

    const appointments = await this.prisma.appointment.findMany({
      where: { startTime: { gte: window.utcFrom, lt: window.utcTo } },
      select: { status: true, startTime: true },
    });

    return this.buildTrendSeries(query.bucket, window, appointments.map((appointment) => ({
      status: appointment.status,
      bucketDate: DateTime.fromJSDate(appointment.startTime, { zone: window.zone }),
    })));
  }

  async getStatusDistribution(query: DateRangeQueryDto): Promise<StatusDistributionResponseDto> {
    const window = await this.buildClinicWindow(query);
    const appointments = await this.prisma.appointment.findMany({
      where: { startTime: { gte: window.utcFrom, lt: window.utcTo } },
      select: { status: true },
    });
    return this.reduceStatusCounts(appointments.map((appointment) => appointment.status)) as StatusDistributionResponseDto;
  }

  async getAppointmentsByWeekday(query: DateRangeQueryDto): Promise<AppointmentsByWeekdayResponseDto[]> {
    const window = await this.buildClinicWindow(query);
    const appointments = await this.prisma.appointment.findMany({
      where: { startTime: { gte: window.utcFrom, lt: window.utcTo } },
      select: { startTime: true },
    });

    const counts = new Array<number>(7).fill(0);
    for (const appointment of appointments) {
      const weekday = DateTime.fromJSDate(appointment.startTime, { zone: window.zone }).weekday % 7;
      counts[weekday] += 1;
    }

    return WEEKDAY_LABELS.map((label, dayOfWeek) => ({ dayOfWeek, label, count: counts[dayOfWeek] }));
  }

  async getCancellationTrends(query: CancellationTrendsQueryDto): Promise<CancellationTrendResponseDto[]> {
    const window = await this.buildClinicWindow(query);
    this.assertBucketWindow(window, query.bucket);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        startTime: { gte: window.utcFrom, lt: window.utcTo },
        status: { in: [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW] },
      },
      select: { id: true, status: true, startTime: true },
    });

    const canceledIds = appointments.filter((appointment) => appointment.status === AppointmentStatus.CANCELED).map((appointment) => appointment.id);
    const auditLogs = canceledIds.length
      ? await this.prisma.auditLog.findMany({
          where: {
            entityType: 'appointment',
            action: 'appointment.canceled',
            entityId: { in: canceledIds },
          },
          select: { entityId: true, actor: { select: { role: true } } },
        })
      : [];
    const auditRoleByAppointment = new Map(auditLogs.map((log) => [log.entityId as string, log.actor.role]));

    const buckets = this.initializeBucketSeries(query.bucket, window, (bucketDate) => ({
      date: bucketDate.toISODate() ?? '',
      canceledByPatient: 0,
      canceledByStaff: 0,
      noShow: 0,
    }));

    for (const appointment of appointments) {
      const bucketDate = this.bucketStart(DateTime.fromJSDate(appointment.startTime, { zone: window.zone }), query.bucket);
      const key = bucketDate.toISODate() ?? '';
      const item = buckets.get(key);
      if (!item) continue;
      if (appointment.status === AppointmentStatus.NO_SHOW) {
        item.noShow += 1;
        continue;
      }
      const role = auditRoleByAppointment.get(appointment.id);
      if (role === Role.PATIENT) {
        item.canceledByPatient += 1;
      } else {
        item.canceledByStaff += 1;
      }
    }

    return Array.from(buckets.values());
  }

  async getDoctorUtilization(query: DateRangeQueryDto): Promise<DoctorUtilizationResponseDto[]> {
    const window = await this.buildClinicWindow(query);
    const [clinicConfig, workingHours, holidays, overrides, doctors, appointments] = await Promise.all([
      this.loadClinicConfig(),
      this.prisma.workingHour.findMany({ orderBy: { dayOfWeek: 'asc' } }),
      this.prisma.holiday.findMany({ where: { date: { gte: window.utcFrom, lt: window.utcTo } } }),
      this.prisma.doctorScheduleOverride.findMany({ where: { date: { gte: window.utcFrom, lt: window.utcTo } } }),
      this.prisma.doctorProfile.findMany({
        where: { user: { isActive: true, role: Role.DOCTOR } },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.appointment.findMany({
        where: {
          startTime: { gte: window.utcFrom, lt: window.utcTo },
          status: { in: [...BOOKED_APPOINTMENT_STATUSES] },
        },
        select: { doctorProfileId: true },
      }),
    ]);

    const bookedByDoctor = appointments.reduce((acc, appointment) => {
      acc.set(appointment.doctorProfileId, (acc.get(appointment.doctorProfileId) ?? 0) + 1);
      return acc;
    }, new Map<string, number>());

    return doctors
      .map((doctor) => {
        const totalSlots = this.slotGenerator.generate({
          doctorProfileId: doctor.id,
          from: window.from.toUTC().toJSDate(),
          to: window.to.toUTC().toJSDate(),
          clinicConfig,
          workingHours,
          holidays,
          overrides: overrides.filter((override) => override.doctorProfileId === doctor.id),
          bookedStartTimes: [],
        }).length;
        const bookedSlots = bookedByDoctor.get(doctor.id) ?? 0;
        const doctorName = `${doctor.user.firstName} ${doctor.user.lastName}`;
        return {
          doctorId: doctor.id,
          doctorName,
          bookedSlots,
          totalSlots,
          utilizationPct: totalSlots === 0 ? 0 : Math.min(bookedSlots / totalSlots, 1),
        };
      })
      .sort((a, b) => b.utilizationPct - a.utilizationPct || a.doctorName.localeCompare(b.doctorName));
  }

  async getTodayByDoctor(): Promise<TodayByDoctorResponseDto[]> {
    const window = await this.buildTodayWindow();
    const [doctors, appointments] = await Promise.all([
      this.prisma.doctorProfile.findMany({
        where: { user: { isActive: true, role: Role.DOCTOR } },
        include: { user: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.appointment.findMany({
        where: { startTime: { gte: window.utcFrom, lt: window.utcTo } },
        select: { doctorProfileId: true, status: true },
      }),
    ]);

    const counts = new Map<string, TodayByDoctorResponseDto>();
    for (const doctor of doctors) {
      counts.set(doctor.id, {
        doctorId: doctor.id,
        doctorName: `${doctor.user.firstName} ${doctor.user.lastName}`,
        confirmed: 0,
        inProgress: 0,
        completed: 0,
        canceled: 0,
      });
    }

    for (const appointment of appointments) {
      const item = counts.get(appointment.doctorProfileId);
      if (!item) continue;
      if (appointment.status === AppointmentStatus.CONFIRMED) item.confirmed += 1;
      if (appointment.status === AppointmentStatus.IN_PROGRESS) item.inProgress += 1;
      if (appointment.status === AppointmentStatus.COMPLETED) item.completed += 1;
      if (appointment.status === AppointmentStatus.CANCELED) item.canceled += 1;
    }

    return Array.from(counts.values());
  }

  async getMyStats(query: MyStatsQueryDto, currentUser: AuthenticatedUser): Promise<DoctorStatsResponseDto> {
    const doctorProfileId = this.requireDoctorProfile(currentUser);
    const zone = await this.getClinicTimeZone();
    const targetDate = query.date ? DateTime.fromISO(query.date, { zone }).startOf('day') : DateTime.now().setZone(zone).startOf('day');
    const todayWindow = this.buildWindowFromLocalDay(targetDate);
    const weekWindow = this.buildWeekWindow(targetDate);

    const [todayAppointments, weekAppointments] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { doctorProfileId, startTime: { gte: todayWindow.utcFrom, lt: todayWindow.utcTo } },
        select: { status: true },
      }),
      this.prisma.appointment.findMany({
        where: { doctorProfileId, startTime: { gte: weekWindow.utcFrom, lt: weekWindow.utcTo } },
        select: { status: true },
      }),
    ]);

    return {
      todayTotal: todayAppointments.length,
      completedToday: todayAppointments.filter((appointment) => appointment.status === AppointmentStatus.COMPLETED).length,
      remainingToday: todayAppointments.filter((appointment) => appointment.status === AppointmentStatus.PENDING || appointment.status === AppointmentStatus.CONFIRMED).length,
      inSession: todayAppointments.filter((appointment) => appointment.status === AppointmentStatus.IN_PROGRESS).length,
      noShowsToday: todayAppointments.filter((appointment) => appointment.status === AppointmentStatus.NO_SHOW).length,
      weekTotal: weekAppointments.length,
    };
  }

  async getMyTrends(query: MyTrendsQueryDto, currentUser: AuthenticatedUser): Promise<MyTrendResponseDto[]> {
    const doctorProfileId = this.requireDoctorProfile(currentUser);
    const zone = await this.getClinicTimeZone();
    const target = DateTime.fromISO(query.week, { zone }).startOf('day');
    const weekWindow = this.buildWeekWindow(target);
    const appointments = await this.prisma.appointment.findMany({
      where: { doctorProfileId, startTime: { gte: weekWindow.utcFrom, lt: weekWindow.utcTo } },
      select: { startTime: true },
    });

    const counts = new Map<string, number>();
    for (const appointment of appointments) {
      const dateKey = DateTime.fromJSDate(appointment.startTime, { zone }).startOf('day').toISODate() ?? '';
      counts.set(dateKey, (counts.get(dateKey) ?? 0) + 1);
    }

    const items: MyTrendResponseDto[] = [];
    for (let cursor = weekWindow.from; cursor <= weekWindow.to; cursor = cursor.plus({ days: 1 })) {
      const date = cursor.toISODate() ?? '';
      items.push({
        date,
        dayLabel: WEEKDAY_LABELS[cursor.weekday % 7],
        count: counts.get(date) ?? 0,
      });
    }
    return items;
  }

  async getMyHourlyLoad(query: DateRangeQueryDto, currentUser: AuthenticatedUser): Promise<HourlyLoadResponseDto[]> {
    const doctorProfileId = this.requireDoctorProfile(currentUser);
    const window = await this.buildClinicWindow(query);
    const appointments = await this.prisma.appointment.findMany({
      where: { doctorProfileId, startTime: { gte: window.utcFrom, lt: window.utcTo } },
      select: { startTime: true },
    });

    const counts = new Map<number, number>();
    for (const appointment of appointments) {
      const hour = DateTime.fromJSDate(appointment.startTime, { zone: window.zone }).hour;
      counts.set(hour, (counts.get(hour) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => a - b)
      .map(([hour, count]) => ({ hour, count }));
  }

  async getMyStatusDistribution(query: DateRangeQueryDto, currentUser: AuthenticatedUser): Promise<StatusDistributionResponseDto> {
    const doctorProfileId = this.requireDoctorProfile(currentUser);
    const window = await this.buildClinicWindow(query);
    const appointments = await this.prisma.appointment.findMany({
      where: { doctorProfileId, startTime: { gte: window.utcFrom, lt: window.utcTo } },
      select: { status: true },
    });
    return this.reduceStatusCounts(appointments.map((appointment) => appointment.status)) as StatusDistributionResponseDto;
  }

  async getFollowUps(query: FollowUpsQueryDto, currentUser: AuthenticatedUser): Promise<FollowUpResponseDto> {
    const doctorProfileId = currentUser.role === Role.DOCTOR ? this.requireDoctorProfile(currentUser) : null;
    const thresholdDays = query.thresholdDays ?? FOLLOW_UP_DEFAULT_THRESHOLD_DAYS;
    const page = query.page ?? FOLLOW_UP_DEFAULT_PAGE;
    const pageSize = query.pageSize ?? FOLLOW_UP_DEFAULT_PAGE_SIZE;
    if (pageSize > FOLLOW_UP_MAX_PAGE_SIZE || thresholdDays > FOLLOW_UP_MAX_THRESHOLD_DAYS) {
      throw new BadRequestException('Invalid follow-up query');
    }

    const zone = await this.getClinicTimeZone();
    const today = DateTime.now().setZone(zone).startOf('day');
    const completedAppointments = await this.prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.COMPLETED,
        ...(doctorProfileId ? { doctorProfileId } : {}),
      },
      select: {
        patientUserId: true,
        startTime: true,
        patient: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startTime: 'desc' },
    });

    const latestByPatient = new Map<string, { patientId: string; patientName: string; lastAppointmentDate: DateTime; daysSince: number }>();
    for (const appointment of completedAppointments) {
      if (latestByPatient.has(appointment.patientUserId)) continue;
      const lastAppointmentDate = DateTime.fromJSDate(appointment.startTime, { zone }).startOf('day');
      const daysSince = Math.floor(today.diff(lastAppointmentDate, 'days').days);
      if (daysSince <= thresholdDays) continue;
      latestByPatient.set(appointment.patientUserId, {
        patientId: appointment.patient.id,
        patientName: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        lastAppointmentDate,
        daysSince,
      });
    }

    const patientIds = Array.from(latestByPatient.keys());
    const upcomingAppointments = patientIds.length
      ? await this.prisma.appointment.findMany({
          where: {
            patientUserId: { in: patientIds },
            status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
            startTime: { gt: today.toUTC().toJSDate() },
          },
          select: { patientUserId: true },
        })
      : [];
    const upcomingByPatient = new Set(upcomingAppointments.map((appointment) => appointment.patientUserId));

    const items = Array.from(latestByPatient.values())
      .map<FollowUpItemResponseDto>((item) => ({
        patientId: item.patientId,
        patientName: item.patientName,
        lastAppointmentDate: item.lastAppointmentDate.toISODate() ?? '',
        daysSince: item.daysSince,
        hasUpcoming: upcomingByPatient.has(item.patientId),
      }))
      .sort((a, b) => b.daysSince - a.daysSince || a.patientName.localeCompare(b.patientName));

    const total = items.length;
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      page,
      pageSize,
      total,
    };
  }

  private async loadClinicConfig() {
    const config = await this.prisma.clinicConfig.findFirst({ select: { slotDurationMinutes: true, timeZone: true, minArrivalMinutes: true } });
    if (!config?.timeZone) {
      throw new BadRequestException('Clinic timezone is required');
    }
    return config;
  }

  private async getClinicTimeZone() {
    return (await this.loadClinicConfig()).timeZone;
  }

  private async buildClinicWindow(query: DateRangeQueryDto): Promise<DateWindow> {
    const zone = await this.getClinicTimeZone();
    const from = DateTime.fromISO(query.from, { zone }).startOf('day');
    const to = DateTime.fromISO(query.to, { zone }).startOf('day');
    return this.validateWindow(zone, from, to);
  }

  private async buildTodayWindow(): Promise<DateWindow> {
    const zone = await this.getClinicTimeZone();
    const today = DateTime.now().setZone(zone).startOf('day');
    return this.validateWindow(zone, today, today);
  }

  private buildWindowFromLocalDay(day: DateTime): DateWindow {
    return this.validateWindow(day.zoneName ?? 'UTC', day.startOf('day'), day.startOf('day'));
  }

  private buildWeekWindow(day: DateTime): DateWindow {
    const start = day.minus({ days: day.weekday - 1 }).startOf('day');
    const end = start.plus({ days: 6 }).startOf('day');
    return this.validateWindow(day.zoneName ?? 'UTC', start, end);
  }

  private validateWindow(zone: string, from: DateTime, to: DateTime): DateWindow {
    if (!from.isValid || !to.isValid) {
      throw new BadRequestException('Invalid date range');
    }
    if (to.toMillis() < from.toMillis()) {
      throw new BadRequestException('to must be after or equal to from');
    }
    const durationDays = Math.floor(to.diff(from, 'days').days) + 1;
    if (durationDays > MAX_CLINIC_RANGE_DAYS) {
      throw new BadRequestException(`date range must not exceed ${MAX_CLINIC_RANGE_DAYS} days`);
    }
    return {
      zone,
      from,
      to,
      utcFrom: from.toUTC().toJSDate(),
      utcTo: to.plus({ days: 1 }).startOf('day').toUTC().toJSDate(),
      durationDays,
    };
  }

  private buildPreviousWindow(window: DateWindow): DateWindow {
    const previousTo = window.from.minus({ days: 1 }).startOf('day');
    const previousFrom = window.from.minus({ days: window.durationDays }).startOf('day');
    return this.validateWindow(window.zone, previousFrom, previousTo);
  }

  private reduceStatusCounts(statuses: AppointmentStatus[]) {
    const counts = { ...APPOINTMENT_STATUS_ZERO_MAP };
    for (const status of statuses) {
      counts[status] += 1;
    }
    return counts;
  }

  private safeRate(numerator: number, denominator: number) {
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private safeDelta(current: number, previous: number) {
    return previous === 0 ? 0 : (current - previous) / previous;
  }

  private requireDoctorProfile(currentUser: AuthenticatedUser) {
    if (currentUser.role !== Role.DOCTOR || !currentUser.doctorProfileId) {
      throw new ForbiddenException('Doctor profile is required');
    }
    return currentUser.doctorProfileId;
  }

  private bucketStart(date: DateTime, bucket: AnalyticsBucket | AnalyticsDayOrWeekBucket) {
    if (bucket === 'day') return date.startOf('day');
    if (bucket === 'week') return date.minus({ days: date.weekday - 1 }).startOf('day');
    return date.startOf('month');
  }

  private assertBucketWindow(window: DateWindow, bucket: AnalyticsBucket | AnalyticsDayOrWeekBucket) {
    if (bucket === 'month' && window.durationDays <= 31) {
      throw new BadRequestException('month bucket is only allowed for ranges longer than 31 days');
    }
  }

  private buildTrendSeries(bucket: AnalyticsBucket, window: DateWindow, rows: Array<{ status: AppointmentStatus; bucketDate: DateTime }>) {
    const map = this.initializeBucketSeries(bucket, window, (bucketDate) => ({
      date: bucketDate.toISODate() ?? '',
      total: 0,
      confirmed: 0,
      completed: 0,
      canceled: 0,
      noShow: 0,
    }));

    for (const row of rows) {
      const bucketDate = this.bucketStart(row.bucketDate, bucket);
      const key = bucketDate.toISODate() ?? '';
      const item = map.get(key);
      if (!item) continue;
      item.total += 1;
      if (row.status === AppointmentStatus.CONFIRMED) item.confirmed += 1;
      if (row.status === AppointmentStatus.COMPLETED) item.completed += 1;
      if (row.status === AppointmentStatus.CANCELED) item.canceled += 1;
      if (row.status === AppointmentStatus.NO_SHOW) item.noShow += 1;
    }

    return Array.from(map.values());
  }

  private initializeBucketSeries<T extends { date: string }>(bucket: AnalyticsBucket | AnalyticsDayOrWeekBucket, window: DateWindow, factory: (bucketDate: DateTime) => T) {
    const map = new Map<string, T>();
    const cursorStart = bucket === 'month' ? window.from.startOf('month') : bucket === 'week' ? window.from.minus({ days: window.from.weekday - 1 }).startOf('day') : window.from.startOf('day');
    const cursorEnd = bucket === 'month' ? window.to.startOf('month') : bucket === 'week' ? window.to.minus({ days: window.to.weekday - 1 }).startOf('day') : window.to.startOf('day');

    for (let cursor = cursorStart; cursor <= cursorEnd; cursor = bucket === 'month' ? cursor.plus({ months: 1 }) : bucket === 'week' ? cursor.plus({ weeks: 1 }) : cursor.plus({ days: 1 })) {
      const item = factory(cursor);
      map.set(item.date, item);
    }

    return map;
  }
}
