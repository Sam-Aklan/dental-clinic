import { DateTime } from 'luxon';
import { AppointmentStatus } from '../generated/prisma/enums';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('includes no-show counts in today summary', async () => {
    const prisma = {
      appointment: {
        findMany: jest.fn().mockResolvedValue([
          { status: AppointmentStatus.COMPLETED, startTime: new Date('2026-06-07T10:00:00.000Z') },
          { status: AppointmentStatus.NO_SHOW, startTime: new Date('2026-06-07T11:00:00.000Z') },
          { status: AppointmentStatus.CANCELED, startTime: new Date('2026-06-07T12:00:00.000Z') },
        ]),
      },
      clinicConfig: { findFirst: jest.fn() },
      workingHour: { findMany: jest.fn() },
      holiday: { findMany: jest.fn() },
      doctorScheduleOverride: { findMany: jest.fn() },
      doctorProfile: { findMany: jest.fn() },
      waitlistEntry: { count: jest.fn() },
      auditLog: { findMany: jest.fn() },
      $transaction: jest.fn(),
    };
    const slotGenerator = {};
    const service = new AnalyticsService(prisma as never, slotGenerator as never);
    const todayStart = DateTime.utc(2026, 6, 7);
    const fixedNow = DateTime.utc(2026, 6, 7, 13);

    if (!todayStart.isValid || !fixedNow.isValid) {
      throw new Error('Failed to create valid test datetimes');
    }

    jest.spyOn(service as any, 'buildTodayWindow').mockResolvedValue({
      zone: 'UTC',
      from: todayStart,
      to: todayStart,
      utcFrom: new Date('2026-06-07T00:00:00.000Z'),
      utcTo: new Date('2026-06-08T00:00:00.000Z'),
      durationDays: 1,
    });
    jest.spyOn(DateTime, 'now').mockReturnValue(fixedNow);

    await expect(service.getTodaySummary()).resolves.toEqual({
      total: 3,
      inProgress: 0,
      waiting: 0,
      completed: 1,
      canceledToday: 1,
      noShow: 1,
      pendingConfirmation: 0,
    });
  });
});
