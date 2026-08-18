import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { SlotGeneratorService } from '../appointments/slot-generator.service';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, SlotGeneratorService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
