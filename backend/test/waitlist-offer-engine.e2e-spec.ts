import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { WaitlistOfferStatus } from '../src/generated/prisma/enums';
import { ClinicConfigService } from '../src/clinic-config/clinic-config.service';
import { WaitlistOfferEngineService } from '../src/waitlist-offer-engine/waitlist-offer-engine.service';
import { WaitlistOfferProcessor } from '../src/waitlist-offer-engine/waitlist-offer.processor';
import { PrismaService } from '../src/prisma/prisma.service';
import { WAITLIST_OFFER_ENGINE_QUEUE } from '../src/common/constants/queue.constants';
import { NotificationsService } from '../src/notifications/notifications.service';

describe('WaitlistOfferEngine (e2e)', () => {
  let app: INestApplication;
  let service: WaitlistOfferEngineService;
  let processor: WaitlistOfferProcessor;
  let prisma: any;
  let clinicConfigService: any;
  let waitlistOfferQueue: any;
  let notificationsService: any;

  beforeEach(async () => {
    waitlistOfferQueue = { add: jest.fn() };
    notificationsService = { queueWaitlistOffer: jest.fn() };
    clinicConfigService = { getConfig: jest.fn() };
    prisma = {
      doctorProfile: { findUnique: jest.fn() },
      waitlistEntry: { findMany: jest.fn() },
      waitlistOffer: { create: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
      $transaction: jest.fn(async (fn: any) => fn({ waitlistOffer: { create: prisma.waitlistOffer.create } })),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        WaitlistOfferEngineService,
        WaitlistOfferProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: ClinicConfigService, useValue: clinicConfigService },
        { provide: getQueueToken(WAITLIST_OFFER_ENGINE_QUEUE), useValue: waitlistOfferQueue },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    service = moduleFixture.get(WaitlistOfferEngineService);
    processor = moduleFixture.get(WaitlistOfferProcessor);
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-15T08:00:00.000Z').getTime());
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await app.close();
  });

  it('creates one offer for one eligible waitlist entry', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1' });
    clinicConfigService.getConfig.mockResolvedValue({
      slotDurationMinutes: 30,
      offerWindowMinutes: 20,
      minArrivalMinutes: 15,
      timeZone: 'UTC',
    });
    prisma.waitlistEntry.findMany.mockResolvedValue([
      { id: 'entry-1', patientProfileId: 'patient-1', doctorProfileId: 'doctor-1', position: 1, availableFrom: null, availableUntil: null, patientProfile: { user: { id: 'user-1', firstName: 'Jane', email: 'patient@example.com', preferredLocale: 'EN' } }, offers: [] },
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

    await processor.process({ name: 'slot-opened', data: { doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' } } as any);

    expect(prisma.waitlistOffer.create).toHaveBeenCalled();
    expect(waitlistOfferQueue.add).toHaveBeenCalledWith('offer-expiry', expect.any(Object), expect.any(Object));
    expect(notificationsService.queueWaitlistOffer).toHaveBeenCalledWith(expect.any(Object));
  });

  it('does nothing when no waitlist entry exists', async () => {
    prisma.doctorProfile.findUnique.mockResolvedValue({ id: 'doctor-1' });
    clinicConfigService.getConfig.mockResolvedValue({
      slotDurationMinutes: 30,
      offerWindowMinutes: 20,
      minArrivalMinutes: 15,
      timeZone: 'UTC',
    });
    prisma.waitlistEntry.findMany.mockResolvedValue([]);

    await service.processSlotOpened({ doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' });

    expect(prisma.waitlistOffer.create).not.toHaveBeenCalled();
    expect(waitlistOfferQueue.add).not.toHaveBeenCalled();
    expect(notificationsService.queueWaitlistOffer).not.toHaveBeenCalled();
  });

  it('skips the first entry and offers the second eligible patient', async () => {
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
        offers: [{ id: 'offer-1', status: WaitlistOfferStatus.PENDING, doctorProfileId: 'doctor-1' }],
      },
      {
        id: 'entry-2',
        patientProfileId: 'patient-2',
        doctorProfileId: 'doctor-1',
        position: 2,
        availableFrom: null,
        availableUntil: null,
        patientProfile: { user: { id: 'user-2', firstName: 'John', email: 'john@example.com', preferredLocale: 'AR' } },
        offers: [],
      },
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

  it('re-enqueues the slot after expiry and skips resolved offers', async () => {
    prisma.waitlistOffer.updateMany.mockResolvedValue({ count: 1 });

    await service.processOfferExpiry({ offerId: 'offer-1', doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' });

    expect(waitlistOfferQueue.add).toHaveBeenCalledWith('slot-opened', expect.objectContaining({ doctorProfileId: 'doctor-1' }));

    prisma.waitlistOffer.updateMany.mockResolvedValue({ count: 0 });
    prisma.waitlistOffer.findUnique.mockResolvedValue({ id: 'offer-1', status: WaitlistOfferStatus.DECLINED });
    waitlistOfferQueue.add.mockClear();

    await service.processOfferExpiry({ offerId: 'offer-1', doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' });

    expect(waitlistOfferQueue.add).not.toHaveBeenCalled();
  });

  it('ignores invalid work without creating offers', async () => {
    await service.processSlotOpened({ doctorProfileId: '', startsAt: '2026-05-15T10:00:00.000Z' });
    await service.processSlotOpened({ doctorProfileId: 'doctor-1', startsAt: '2026-05-15T07:00:00.000Z' });
    await service.processOfferExpiry({ offerId: '', doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' });

    expect(prisma.waitlistOffer.create).not.toHaveBeenCalled();
    expect(waitlistOfferQueue.add).not.toHaveBeenCalled();
    expect(notificationsService.queueWaitlistOffer).not.toHaveBeenCalled();
  });
});
