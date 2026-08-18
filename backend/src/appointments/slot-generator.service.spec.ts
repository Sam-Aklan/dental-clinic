import { SlotGeneratorService } from './slot-generator.service';

describe('SlotGeneratorService', () => {
  const service = new SlotGeneratorService();

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-01T08:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('generates available UTC slots', () => {
    const slots = service.generate({
      doctorProfileId: 'abcdefghijklmnopqrstuvwxy',
      from: new Date('2026-05-01T00:00:00.000Z'),
      to: new Date('2026-05-01T00:00:00.000Z'),
      clinicConfig: {
        slotDurationMinutes: 30,
        timeZone: 'UTC',
        minArrivalMinutes: 0,
      },
      workingHours: [{ dayOfWeek: 5, isClosed: false, startTime: '08:00', endTime: '09:00' }],
      holidays: [],
      overrides: [],
      bookedStartTimes: [],
    });

    expect(slots).toEqual([
      {
        doctorId: 'abcdefghijklmnopqrstuvwxy',
        startsAt: '2026-05-01T08:00:00.000Z',
        endsAt: '2026-05-01T08:30:00.000Z',
        status: 'available',
      },
      {
        doctorId: 'abcdefghijklmnopqrstuvwxy',
        startsAt: '2026-05-01T08:30:00.000Z',
        endsAt: '2026-05-01T09:00:00.000Z',
        status: 'available',
      },
    ]);
  });

  it('includes reserved slots when requested', () => {
    const slots = service.generate({
      doctorProfileId: 'abcdefghijklmnopqrstuvwxy',
      from: new Date('2026-05-01T00:00:00.000Z'),
      to: new Date('2026-05-01T00:00:00.000Z'),
      includeReserved: true,
      clinicConfig: {
        slotDurationMinutes: 30,
        timeZone: 'UTC',
        minArrivalMinutes: 0,
      },
      workingHours: [{ dayOfWeek: 5, isClosed: false, startTime: '08:00', endTime: '09:00' }],
      holidays: [],
      overrides: [],
      bookedStartTimes: [new Date('2026-05-01T08:00:00.000Z')],
    });

    expect(slots).toEqual([
      {
        doctorId: 'abcdefghijklmnopqrstuvwxy',
        startsAt: '2026-05-01T08:00:00.000Z',
        endsAt: '2026-05-01T08:30:00.000Z',
        status: 'reserved',
      },
      {
        doctorId: 'abcdefghijklmnopqrstuvwxy',
        startsAt: '2026-05-01T08:30:00.000Z',
        endsAt: '2026-05-01T09:00:00.000Z',
        status: 'available',
      },
    ]);
  });
});
