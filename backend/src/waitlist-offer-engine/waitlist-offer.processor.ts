import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  OFFER_EXPIRY_JOB,
  SLOT_OPENED_JOB,
  WAITLIST_OFFER_ENGINE_QUEUE,
} from '../common/constants/queue.constants';
import {
  OfferExpiryJobPayload,
  SlotOpenedJobPayload,
  WaitlistOfferEngineService,
} from './waitlist-offer-engine.service';

@Processor(WAITLIST_OFFER_ENGINE_QUEUE, {
  limiter: { duration: 10, max: 3 },
  removeOnComplete: {
    age: 3_000,
    count: 3,
  },
})
export class WaitlistOfferProcessor extends WorkerHost {
  private readonly logger = new Logger(WaitlistOfferProcessor.name);

  constructor(private readonly service: WaitlistOfferEngineService) {
    super();
  }

  async process(job: Job<SlotOpenedJobPayload | OfferExpiryJobPayload>): Promise<void> {
    switch (job.name) {
      case SLOT_OPENED_JOB:
        return this.service.processSlotOpened(job.data as SlotOpenedJobPayload);
      case OFFER_EXPIRY_JOB:
        return this.service.processOfferExpiry(job.data as OfferExpiryJobPayload);
      default:
        this.logger.warn(`unknown_job job=${job.name}`);
    }
  }
}
