import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { WAITLIST_OFFER_ENGINE_QUEUE } from '../common/constants/queue.constants';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { SlotGeneratorService } from './slot-generator.service';
import { SlotValidationService } from './slot-validation.service';

@Module({
  imports: [PrismaModule, NotificationsModule, BullModule.registerQueue({ name: WAITLIST_OFFER_ENGINE_QUEUE }), QueueModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, SlotGeneratorService, SlotValidationService],
  exports: [AppointmentsService, SlotValidationService],
})
export class AppointmentsModule {}
