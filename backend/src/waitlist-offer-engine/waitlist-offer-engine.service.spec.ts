import { Logger } from '@nestjs/common';
import { WaitlistOfferStatus } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicConfigService } from '../clinic-config/clinic-config.service';
import { WaitlistOfferEngineService } from './waitlist-offer-engine.service';

describe('WaitlistOfferEngineService', () => {
  let service: WaitlistOfferEngineService;
  let prisma: any;
  let clinicConfigService: any;
  let waitlistOfferQueue: any;
  let notificationsService: any;

  beforeEach(() => {
    waitlistOfferQueue = { add: jest.fn() };
    notificationsService = { queueWaitlistOffer: jest.fn() };
    clinicConfigService = { getConfig: jest.fn() };
    prisma = {
      doctorProfile: { findUnique: jest.fn() },
      waitlistEntry: { findMany: jest.fn() },
      waitlistOffer: { create: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
      $transaction: jest.fn(async (fn: any) => fn({ waitlistOffer: { create: prisma.waitlistOffer.create } })),
    };
    service = new WaitlistOfferEngineService(
      prisma as PrismaService,
      clinicConfigService as ClinicConfigService,
      waitlistOfferQueue,
      notificationsService,
    );
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-15T08:00:00.000Z').getTime());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates one pending offer for the first eligible waitlist entry', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1' });
    clinicConfigService.getConfig.mockResolvedValue({
      slotDurationMinutes: 30,
      offerWindowMinutes: 20,
      minArrivalMinutes: 15,
      timeZone: 'UTC',
    });
    prisma.waitlistEntry.findMany.mockResolvedValue([
      {
        id: 'entry-1',
        patientProfileId: 'patient-1',
        doctorProfileId: 'doctor-1',
        position: 1,
        availableFrom: null,
        availableUntil: null,
        patientProfile: { user: { id: 'user-1', firstName: 'Jane', email: 'patient@example.com', preferredLocale: 'EN' } },
        offers: [],
      },
    ]);
    prisma.waitlistOffer.create.mockResolvedValue({
      id: 'offer-1',
      waitlistEntryId: 'entry-1',
      patientProfileId: 'patient-1',
      doctorProfileId: 'doctor-1',
      offeredStartsAt: new Date('2026-05-15T10:00:00.000Z'),
      offeredEndsAt: new Date('2026-05-15T10:30:00.000Z'),
      status: WaitlistOfferStatus.PENDING,
      expiresAt: new Date('2026-05-15T08:20:00.000Z'),
    });

    await service.processSlotOpened({
      doctorProfileId: 'doctor-1',
      startsAt: '2026-05-15T10:00:00.000Z',
    });

    expect(prisma.waitlistOffer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          waitlistEntryId: 'entry-1',
          status: WaitlistOfferStatus.PENDING,
          offeredEndsAt: new Date('2026-05-15T10:30:00.000Z'),
        }),
      }),
    );
    expect(waitlistOfferQueue.add).toHaveBeenCalledWith(
      'offer-expiry',
      expect.objectContaining({ offerId: 'offer-1', doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' }),
      { delay: 20 * 60_000 },
    );
    expect(notificationsService.queueWaitlistOffer).toHaveBeenCalledWith(
      expect.objectContaining({
        patientUserId: 'user-1',
        offerId: 'offer-1',
        offerUrl: expect.stringContaining('/offers/offer-1'),
        locale: 'en',
      }),
    );
  });

  it('logs when no eligible waitlist entry exists', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);

    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1' });
    clinicConfigService.getConfig.mockResolvedValue({
      slotDurationMinutes: 30,
      offerWindowMinutes: 20,
      minArrivalMinutes: 15,
      timeZone: 'UTC',
    });
    prisma.waitlistEntry.findMany.mockResolvedValue([]);

    await service.processSlotOpened({
      doctorProfileId: 'doctor-1',
      startsAt: '2026-05-15T10:00:00.000Z',
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('no_eligible_patient doctorProfileId=doctor-1'),
    );
    expect(prisma.waitlistOffer.create).not.toHaveBeenCalled();
    expect(waitlistOfferQueue.add).not.toHaveBeenCalledWith('offer-expiry', expect.anything(), expect.anything());
  });

  it('picks the first eligible entry in position order', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1' });
    clinicConfigService.getConfig.mockResolvedValue({
      slotDurationMinutes: 30,
      offerWindowMinutes: 20,
      minArrivalMinutes: 15,
      timeZone: 'UTC',
    });
    prisma.waitlistEntry.findMany.mockResolvedValue([
      { id: 'entry-1', patientProfileId: 'patient-1', doctorProfileId: 'doctor-1', position: 1, availableFrom: null, availableUntil: null, patientProfile: { user: { id: 'user-1', firstName: 'Jane', email: 'patient@example.com', preferredLocale: 'EN' } }, offers: [{ id: 'offer-old', status: WaitlistOfferStatus.PENDING, doctorProfileId: 'doctor-1' }] },
      { id: 'entry-2', patientProfileId: 'patient-2', doctorProfileId: 'doctor-1', position: 2, availableFrom: null, availableUntil: null, patientProfile: { user: { id: 'user-2', firstName: 'John', email: 'john@example.com', preferredLocale: 'AR' } }, offers: [] },
    ]);
    prisma.waitlistOffer.create.mockResolvedValue({
      id: 'offer-2',
      waitlistEntryId: 'entry-2',
      patientProfileId: 'patient-2',
      doctorProfileId: 'doctor-1',
      offeredStartsAt: new Date('2026-05-15T10:00:00.000Z'),
      offeredEndsAt: new Date('2026-05-15T10:30:00.000Z'),
      status: WaitlistOfferStatus.PENDING,
      expiresAt: new Date('2026-05-15T08:20:00.000Z'),
    });

    await service.processSlotOpened({ doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' });

    expect(prisma.waitlistOffer.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ waitlistEntryId: 'entry-2' }) }));
  });

  it('treats a partial availability window as unrestricted', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1' });
    clinicConfigService.getConfig.mockResolvedValue({
      slotDurationMinutes: 30,
      offerWindowMinutes: 20,
      minArrivalMinutes: 15,
      timeZone: 'UTC',
    });
    prisma.waitlistEntry.findMany.mockResolvedValue([
      { id: 'entry-1', patientProfileId: 'patient-1', doctorProfileId: 'doctor-1', position: 1, availableFrom: '09:00', availableUntil: null, patientProfile: { user: { id: 'user-1', firstName: 'Jane', email: 'patient@example.com', preferredLocale: 'EN' } }, offers: [] },
    ]);
    prisma.waitlistOffer.create.mockResolvedValue({
      id: 'offer-1',
      waitlistEntryId: 'entry-1',
      patientProfileId: 'patient-1',
      doctorProfileId: 'doctor-1',
      offeredStartsAt: new Date('2026-05-15T10:00:00.000Z'),
      offeredEndsAt: new Date('2026-05-15T10:30:00.000Z'),
      status: WaitlistOfferStatus.PENDING,
      expiresAt: new Date('2026-05-15T08:20:00.000Z'),
    });

    await service.processSlotOpened({ doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' });

    expect(prisma.waitlistOffer.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ waitlistEntryId: 'entry-1' }) }));
  });

  it('honors window start boundary and excludes the end boundary', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1' });
    clinicConfigService.getConfig.mockResolvedValue({
      slotDurationMinutes: 30,
      offerWindowMinutes: 20,
      minArrivalMinutes: 15,
      timeZone: 'UTC',
    });
    prisma.waitlistEntry.findMany.mockResolvedValue([
      { id: 'entry-1', patientProfileId: 'patient-1', doctorProfileId: 'doctor-1', position: 1, availableFrom: '10:00', availableUntil: '11:00', patientProfile: { user: { id: 'user-1', firstName: 'Jane', email: 'patient@example.com', preferredLocale: 'EN' } }, offers: [] },
    ]);
    prisma.waitlistOffer.create.mockResolvedValue({
      id: 'offer-1',
      waitlistEntryId: 'entry-1',
      patientProfileId: 'patient-1',
      doctorProfileId: 'doctor-1',
      offeredStartsAt: new Date('2026-05-15T10:00:00.000Z'),
      offeredEndsAt: new Date('2026-05-15T10:30:00.000Z'),
      status: WaitlistOfferStatus.PENDING,
      expiresAt: new Date('2026-05-15T08:20:00.000Z'),
    });

    await service.processSlotOpened({ doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' });
    expect(prisma.waitlistOffer.create).toHaveBeenCalled();

    prisma.waitlistOffer.create.mockClear();
    await service.processSlotOpened({ doctorProfileId: 'doctor-1', startsAt: '2026-05-15T11:00:00.000Z' });
    expect(prisma.waitlistOffer.create).not.toHaveBeenCalled();
  });

  it('skips jobs that violate the arrival buffer', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1' });
    clinicConfigService.getConfig.mockResolvedValue({
      slotDurationMinutes: 30,
      offerWindowMinutes: 20,
      minArrivalMinutes: 180,
      timeZone: 'UTC',
    });
    prisma.waitlistEntry.findMany.mockResolvedValue([
      { id: 'entry-1', patientProfileId: 'patient-1', doctorProfileId: 'doctor-1', position: 1, availableFrom: null, availableUntil: null, offers: [] },
    ]);

    await service.processSlotOpened({ doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:30:00.000Z' });

    expect(prisma.waitlistOffer.create).not.toHaveBeenCalled();
  });

  it('re-enqueues the slot after expiring a pending offer', async () => {
    prisma.waitlistOffer.updateMany.mockResolvedValue({ count: 1 });

    await service.processOfferExpiry({
      offerId: 'offer-1',
      doctorProfileId: 'doctor-1',
      startsAt: '2026-05-15T10:00:00.000Z',
    });

    expect(prisma.waitlistOffer.updateMany).toHaveBeenCalledWith({
      where: { id: 'offer-1', status: WaitlistOfferStatus.PENDING },
      data: { status: WaitlistOfferStatus.EXPIRED },
    });
    expect(waitlistOfferQueue.add).toHaveBeenCalledWith('slot-opened', {
      doctorProfileId: 'doctor-1',
      startsAt: '2026-05-15T10:00:00.000Z',
    });
  });

  it('skips invalid offer ids without throwing', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await service.processOfferExpiry({
      offerId: ' ',
      doctorProfileId: 'doctor-1',
      startsAt: '2026-05-15T10:00:00.000Z',
    });

    expect(warnSpy).toHaveBeenCalledWith('invalid_offer_id');
    expect(prisma.waitlistOffer.updateMany).not.toHaveBeenCalled();
  });

  it('does not re-enqueue resolved expiry jobs', async () => {
    prisma.waitlistOffer.updateMany.mockResolvedValue({ count: 0 });
    prisma.waitlistOffer.findUnique.mockResolvedValue({ id: 'offer-1', status: WaitlistOfferStatus.ACCEPTED });

    await service.processOfferExpiry({
      offerId: 'offer-1',
      doctorProfileId: 'doctor-1',
      startsAt: '2026-05-15T10:00:00.000Z',
    });

    expect(waitlistOfferQueue.add).not.toHaveBeenCalled();
  });

  it('does not re-enqueue missing expiry jobs', async () => {
    prisma.waitlistOffer.updateMany.mockResolvedValue({ count: 0 });
    prisma.waitlistOffer.findUnique.mockResolvedValue(null);

    await service.processOfferExpiry({
      offerId: 'offer-missing',
      doctorProfileId: 'doctor-1',
      startsAt: '2026-05-15T10:00:00.000Z',
    });

    expect(waitlistOfferQueue.add).not.toHaveBeenCalled();
  });

  it('rejects invalid slot-opened payloads without queue work', async () => {
    const logSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await service.processSlotOpened({ doctorProfileId: 'doctor-1', startsAt: 'bad-date' });
    await service.processSlotOpened({ doctorProfileId: 'doctor-1', startsAt: '2026-05-15T07:00:00.000Z' });
    await service.processSlotOpened({ doctorProfileId: '', startsAt: '2026-05-15T10:00:00.000Z' });

    expect(logSpy).toHaveBeenCalled();
    expect(prisma.waitlistOffer.create).not.toHaveBeenCalled();
  });

  it('returns early when the doctor row is missing', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue(null);

    await service.processSlotOpened({ doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' });

    expect(prisma.waitlistEntry.findMany).not.toHaveBeenCalled();
    expect(prisma.waitlistOffer.create).not.toHaveBeenCalled();
  });

  it('does not re-enqueue declined, expired, or duplicate expiry jobs', async () => {
    prisma.waitlistOffer.updateMany.mockResolvedValue({ count: 0 });
    prisma.waitlistOffer.findUnique.mockResolvedValueOnce({ id: 'offer-1', status: WaitlistOfferStatus.DECLINED });

    await service.processOfferExpiry({
      offerId: 'offer-1',
      doctorProfileId: 'doctor-1',
      startsAt: '2026-05-15T10:00:00.000Z',
    });

    prisma.waitlistOffer.findUnique.mockResolvedValueOnce({ id: 'offer-1', status: WaitlistOfferStatus.EXPIRED });
    await service.processOfferExpiry({
      offerId: 'offer-1',
      doctorProfileId: 'doctor-1',
      startsAt: '2026-05-15T10:00:00.000Z',
    });

    expect(waitlistOfferQueue.add).not.toHaveBeenCalled();
  });
});
