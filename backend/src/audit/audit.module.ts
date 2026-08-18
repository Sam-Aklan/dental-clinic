import { Global, Module } from '@nestjs/common';
import { ClinicConfigModule } from '../clinic-config/clinic-config.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Global()
@Module({
  imports: [PrismaModule, ClinicConfigModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
