import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { ClinicConfigModule } from './clinic-config/clinic-config.module';
import { ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { QueueModule } from './queue/queue.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { WaitlistOfferEngineModule } from './waitlist-offer-engine/waitlist-offer-engine.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AuditModule } from './audit/audit.module';
import { FollowUpsModule } from './follow-ups/follow-ups.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config: Record<string, unknown>) => {
        if (!config['DATABASE_URL']) {
          throw new Error('DATABASE_URL is required');
        }
        if (!config['JWT_ACCESS_SECRET']) {
          throw new Error('JWT_ACCESS_SECRET is required');
        }
        if (!config['JWT_REFRESH_SECRET']) {
          throw new Error('JWT_REFRESH_SECRET is required');
        }
        if (!config['FRONTEND_URL']) {
          throw new Error('FRONTEND_URL is required');
        }
        if (config['NODE_ENV'] === 'production') {
          if (!config['SMTP_HOST']) {
            throw new Error('SMTP_HOST is required in production');
          }
          if (!config['SMTP_PORT']) {
            throw new Error('SMTP_PORT is required in production');
          }
          if (!config['SMTP_FROM']) {
            throw new Error('SMTP_FROM is required in production');
          }
          if (!config['CLINIC_EMAIL']) {
            throw new Error('CLINIC_EMAIL is required in production');
          }
        } else {
          config['SMTP_HOST'] ??= 'localhost';
          config['SMTP_PORT'] ??= '1025';
          config['SMTP_FROM'] ??= 'Dental Clinic <noreply@clinic.local>';
          config['CLINIC_EMAIL'] ??= 'support@dentalclinic.local';
        }
        if (!config['REDIS_URL'] && (!config['REDIS_HOST'] || !config['REDIS_PORT'])) {
          throw new Error('REDIS_URL or REDIS_HOST/REDIS_PORT is required');
        }
       
        config['JWT_ACCESS_EXPIRY'] ??= '15m';
        config['JWT_REFRESH_EXPIRY'] ??= '7d';
       
        return config;
      },
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
      
        return {
          connection: {
            host: configService.get<string>('REDIS_HOST') ?? 'localhost',
            port: Number(configService.get<string>('REDIS_PORT') ?? 6379),
          },
        };
      },
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    DoctorsModule,
    ClinicConfigModule,
    NotificationsModule,
    QueueModule,
    AppointmentsModule,
    FollowUpsModule,
    WaitlistModule,
    WaitlistOfferEngineModule,
    AnalyticsModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
