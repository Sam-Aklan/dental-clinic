import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import {
  QUEUE_APPOINTMENT_CONFIRMATION,
  QUEUE_PASSWORD_RESET,
  QUEUE_REMINDER,
  QUEUE_WAITLIST_OFFER,
  MAIL_TRANSPORT,
} from './notifications.constants';
import { createMailTransport } from './mail-transport.factory';
import { NotificationsProcessor, AppointmentConfirmationNotificationsProcessor, PasswordResetNotificationsProcessor, ReminderNotificationsProcessor, WaitlistOfferNotificationsProcessor } from './notifications.processor';
import { NotificationsService } from './notifications.service';
import { TemplateService } from './template.service';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue(
      { name: QUEUE_PASSWORD_RESET },
      { name: QUEUE_APPOINTMENT_CONFIRMATION },
      { name: QUEUE_REMINDER },
      { name: QUEUE_WAITLIST_OFFER },
    ),
  ],
  providers: [
    NotificationsService,
    TemplateService,
    NotificationsProcessor,
    PasswordResetNotificationsProcessor,
    AppointmentConfirmationNotificationsProcessor,
    ReminderNotificationsProcessor,
    WaitlistOfferNotificationsProcessor,
    {
      provide: MAIL_TRANSPORT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => createMailTransport(configService),
    },
  ],
  exports: [NotificationsService, TemplateService],
})
export class NotificationsModule {}

export {
  QUEUE_APPOINTMENT_CONFIRMATION,
  QUEUE_PASSWORD_RESET,
  QUEUE_REMINDER,
  QUEUE_WAITLIST_OFFER,
} from './notifications.constants';
