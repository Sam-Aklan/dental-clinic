import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClinicConfigModule } from '../clinic-config/clinic-config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueController } from './queue.controller';
import { KioskTokenService } from './kiosk-token.service';
import { QueueGateway } from './queue.gateway';
import { QueueService } from './queue.service';

@Module({
  imports: [PrismaModule, ClinicConfigModule, JwtModule.register({})],
  controllers: [QueueController],
  providers: [QueueGateway, QueueService, KioskTokenService],
  exports: [QueueService],
})
export class QueueModule {}
