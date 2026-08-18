import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ClinicConfigModule } from '../clinic-config/clinic-config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WAITLIST_OFFER_ENGINE_QUEUE } from '../common/constants/queue.constants';
import { NotificationsModule } from '../notifications/notifications.module';
import { WaitlistOfferEngineService } from './waitlist-offer-engine.service';
import { WaitlistOfferProcessor } from './waitlist-offer.processor';

@Module({
  imports: [
    PrismaModule,
    ClinicConfigModule,
    NotificationsModule,
    BullModule.registerQueue({ name: WAITLIST_OFFER_ENGINE_QUEUE }),
  ],
  providers: [WaitlistOfferEngineService, WaitlistOfferProcessor],
})
export class WaitlistOfferEngineModule {}
