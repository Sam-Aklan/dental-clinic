import { Logger } from '@nestjs/common';
import { WaitlistOfferProcessor } from './waitlist-offer.processor';

describe('WaitlistOfferProcessor', () => {
  let service: any;
  let processor: WaitlistOfferProcessor;

  beforeEach(() => {
    service = {
      processSlotOpened: jest.fn(),
      processOfferExpiry: jest.fn(),
    };
    processor = new WaitlistOfferProcessor(service);
  });

  it('delegates slot-opened jobs to the service', async () => {
    await processor.process({
      name: 'slot-opened',
      data: { doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' },
    } as any);

    expect(service.processSlotOpened).toHaveBeenCalledWith({
      doctorProfileId: 'doctor-1',
      startsAt: '2026-05-15T10:00:00.000Z',
    });
  });

  it('delegates offer-expiry jobs to the service', async () => {
    await processor.process({
      name: 'offer-expiry',
      data: { offerId: 'offer-1', doctorProfileId: 'doctor-1', startsAt: '2026-05-15T10:00:00.000Z' },
    } as any);

    expect(service.processOfferExpiry).toHaveBeenCalledWith({
      offerId: 'offer-1',
      doctorProfileId: 'doctor-1',
      startsAt: '2026-05-15T10:00:00.000Z',
    });
  });

  it('logs unknown jobs without throwing', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    await expect(
      processor.process({ name: 'unknown-job', data: {} } as any),
    ).resolves.toBeUndefined();

    expect(warnSpy).toHaveBeenCalledWith('unknown_job job=unknown-job');
  });
});
