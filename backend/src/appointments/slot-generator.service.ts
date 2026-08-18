import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { AvailableSlotResponseDto } from './dto';

export type SlotGenerationInput = {
  doctorProfileId: string;
  from: Date;
  to: Date;
  includeReserved?: boolean;
  clinicConfig: {
    slotDurationMinutes: number;
    timeZone: string;
    minArrivalMinutes: number;
  };
  workingHours: Array<{ dayOfWeek: number; isClosed: boolean; startTime: string | null; endTime: string | null }>;
  holidays: Array<{ date: Date }>;
  overrides: Array<{
    doctorProfileId: string;
    date: Date;
    isUnavailable: boolean;
    startTime: string | null;
    endTime: string | null;
  }>;
  bookedStartTimes: Date[];
};

@Injectable()
export class SlotGeneratorService {
  generate(input: SlotGenerationInput): AvailableSlotResponseDto[] {
    const zone = input.clinicConfig.timeZone;
    const slotDuration = input.clinicConfig.slotDurationMinutes;
    const minArrival = input.clinicConfig.minArrivalMinutes;
    const booked = new Set(input.bookedStartTimes.map((date) => date.toISOString()));
    const includeReserved = input.includeReserved ?? false;
    const now = DateTime.now().setZone(zone);
    const start = DateTime.fromJSDate(input.from, { zone }).startOf('day');
    const end = DateTime.fromJSDate(input.to, { zone }).endOf('day');

    const holidaySet = new Set(input.holidays.map((holiday) => DateTime.fromJSDate(holiday.date, { zone }).toISODate()));

    const workingHourByDay = new Map(input.workingHours.map((workingHour) => [workingHour.dayOfWeek, workingHour]));
    const overrideByDate = new Map(input.overrides.map((override) => [DateTime.fromJSDate(override.date, { zone }).toISODate(), override]));

    const slots: AvailableSlotResponseDto[] = [];
    for (let cursor = start; cursor <= end; cursor = cursor.plus({ days: 1 })) {
      const dayKey = cursor.toISODate();
      if (!dayKey || holidaySet.has(dayKey)) {
        continue;
      }

      const override = overrideByDate.get(dayKey);
      if (override?.isUnavailable) {
        continue;
      }

      const workingHour = override ?? workingHourByDay.get(cursor.weekday % 7);
      if (!workingHour || (workingHour as { isClosed?: boolean }).isClosed) {
        continue;
      }

      const startTime = workingHour.startTime ?? null;
      const endTime = workingHour.endTime ?? null;
      if (!startTime || !endTime) {
        continue;
      }

      let slot = this.toLocalDateTime(cursor, startTime, zone);
      const boundary = this.toLocalDateTime(cursor, endTime, zone);

      while (slot.plus({ minutes: slotDuration }).toMillis() <= boundary.toMillis()) {
        const slotIso = slot.toUTC().toISO();
        if (slot.toMillis() >= now.plus({ minutes: minArrival }).toMillis() && slotIso) {
          const startsAt = slot.toUTC();
          const endsAt = startsAt.plus({ minutes: slotDuration });

          if (booked.has(slotIso)) {
            if (includeReserved) {
              slots.push({
                startsAt: startsAt.toISO() as string,
                endsAt: endsAt.toISO() as string,
                doctorId: input.doctorProfileId,
                status: 'reserved',
              });
            }
          } else {
            slots.push({
              startsAt: startsAt.toISO() as string,
              endsAt: endsAt.toISO() as string,
              doctorId: input.doctorProfileId,
              status: 'available',
            });
          }
        }

        slot = slot.plus({ minutes: slotDuration });
      }
    }

    return slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }

  private toLocalDateTime(base: DateTime, time: string, zone: string) {
    const [hour, minute] = time.split(':').map(Number);
    return base.setZone(zone).set({ hour, minute, second: 0, millisecond: 0 });
  }
}
