import { PrismaClient } from '../../src/generated/prisma/client';

export interface ClinicSeedCounts {
  clinicConfig: number;
  workingHours: number;
  holidays: number;
  doctorScheduleOverrides: number;
}

export async function seedClinic(prisma: PrismaClient): Promise<ClinicSeedCounts> {
  await prisma.clinicConfig.create({
    data: {
      slotDurationMinutes: 30,
      timeZone: 'Asia/Riyadh',
      reminderHoursBefore: 24,
      offerWindowMinutes: 30,
      minArrivalMinutes: 45,
    },
  });

  const workingHoursData = [
    { dayOfWeek: 0, isClosed: false, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 1, isClosed: false, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 2, isClosed: false, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 3, isClosed: false, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 4, isClosed: false, startTime: '09:00', endTime: '17:00' },
    { dayOfWeek: 5, isClosed: true, startTime: null, endTime: null },
    { dayOfWeek: 6, isClosed: true, startTime: null, endTime: null },
  ];

  for (const wh of workingHoursData) {
    await prisma.workingHour.create({ data: wh });
  }

  await prisma.holiday.create({
    data: {
      date: new Date('2026-01-01'),
      name: "New Year's Day",
    },
  });

  await prisma.holiday.create({
    data: {
      date: new Date('2026-12-25'),
      name: 'Christmas Day',
    },
  });

  const doctors = await prisma.doctorProfile.findMany({
    select: { id: true, user: { select: { firstName: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const drAhmad = doctors[0];
  const drLayla = doctors[1];

  const nextMonday = getNextWeekday(1);
  const nextWednesday = getNextWeekday(3);

  if (drAhmad) {
    await prisma.doctorScheduleOverride.create({
      data: {
        doctorProfileId: drAhmad.id,
        date: nextMonday,
        startTime: '10:00',
        endTime: '15:00',
        isUnavailable: false,
        reason: 'Reduced hours for training',
      },
    });
  }

  if (drLayla) {
    await prisma.doctorScheduleOverride.create({
      data: {
        doctorProfileId: drLayla.id,
        date: nextWednesday,
        startTime: null,
        endTime: null,
        isUnavailable: true,
        reason: 'Conference attendance',
      },
    });
  }

  return {
    clinicConfig: 1,
    workingHours: 7,
    holidays: 2,
    doctorScheduleOverrides: 2,
  };
}

function getNextWeekday(targetDay: number): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const currentDay = today.getUTCDay();
  const daysUntilTarget = ((targetDay - currentDay + 7) % 7) || 7;
  const result = new Date(today);
  result.setUTCDate(result.getUTCDate() + daysUntilTarget);
  return result;
}
