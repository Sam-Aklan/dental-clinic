import { Module } from '@nestjs/common';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FollowUpsController } from './follow-ups.controller';
import { FollowUpsService } from './follow-ups.service';

@Module({
  imports: [PrismaModule, AppointmentsModule, AuditModule, NotificationsModule],
  controllers: [FollowUpsController],
  providers: [FollowUpsService],
})
export class FollowUpsModule {}
