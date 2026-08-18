import { AppointmentStatus } from '../generated/prisma/enums';
import { QueueService } from './queue.service';

describe('QueueService', () => {
  let service: QueueService;
  let prisma: any;
  let clinicConfigService: any;
  let server: any;
  let channel: any;

  beforeEach(() => {
    prisma = {
      doctorProfile: {
        findUnique: jest.fn(),
      },
      appointment: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };
    clinicConfigService = {
      getConfig: jest.fn().mockResolvedValue({ timeZone: 'UTC' }),
    };
    service = new QueueService(prisma, clinicConfigService);
    channel = { emit: jest.fn() };
    server = { to: jest.fn().mockReturnValue(channel) };
    service.setServer(server);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('builds a snapshot with contiguous positions', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-15T10:00:00.000Z'));
    prisma.doctorProfile.findUnique.mockResolvedValue({ user: { firstName: 'Sara', lastName: 'Ahmed' } });
    prisma.appointment.findMany
      .mockResolvedValueOnce([
        { id: 'a1', status: AppointmentStatus.PENDING, needsFollowUp: false, startTime: new Date('2026-05-15T08:00:00.000Z'), endTime: new Date('2026-05-15T08:30:00.000Z') },
        { id: 'a2', status: AppointmentStatus.CONFIRMED, needsFollowUp: false, startTime: new Date('2026-05-15T08:30:00.000Z'), endTime: new Date('2026-05-15T09:00:00.000Z') },
      ])
      .mockResolvedValueOnce([
        { id: 'a1' },
        { id: 'a2' },
      ]);

    const snapshot = await service.buildSnapshot('doctor-1');

    expect(snapshot.date).toBe('2026-05-15');
    expect(snapshot.doctorDisplayName).toBe('Sara Ahmed');
    expect(snapshot.items).toEqual([
      expect.objectContaining({ appointmentId: 'a1', position: 1 }),
      expect.objectContaining({ appointmentId: 'a2', position: 2 }),
    ]);
  });

  it('emits an updated event for an active appointment', async () => {
    prisma.appointment.findUnique.mockResolvedValue({
      id: 'a1',
      status: AppointmentStatus.PENDING,
      needsFollowUp: false,
      startTime: new Date('2026-05-15T08:00:00.000Z'),
      endTime: new Date('2026-05-15T08:30:00.000Z'),
      updatedAt: new Date('2026-05-15T08:10:00.000Z'),
    });
    prisma.appointment.findMany.mockResolvedValue([{ id: 'a1' }]);

    await service.emitUpdated('a1', 'doctor-1');

    expect(server.to).toHaveBeenCalledWith('doctor:doctor-1');
    expect(channel.emit).toHaveBeenCalledWith('queue.updated', expect.objectContaining({ appointmentId: 'a1', position: 1 }));
  });

  it('emits removed when the appointment no longer exists', async () => {
    prisma.appointment.findUnique.mockResolvedValue(null);
    const removed = jest.spyOn(service, 'emitRemoved').mockResolvedValue(undefined as never);

    await service.emitUpdated('missing', 'doctor-1');

    expect(removed).toHaveBeenCalledWith('missing', 'doctor-1');
  });
});
