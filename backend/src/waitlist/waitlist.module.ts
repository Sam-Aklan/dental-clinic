import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WAITLIST_OFFER_ENGINE_QUEUE } from '../common/constants/queue.constants';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { WaitlistController } from './waitlist.controller';
import { WaitlistService } from './waitlist.service';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: WAITLIST_OFFER_ENGINE_QUEUE }), QueueModule],
  controllers: [WaitlistController],
  providers: [WaitlistService],
})
export class WaitlistModule {}
