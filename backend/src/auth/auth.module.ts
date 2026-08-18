import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    PassportModule,
    JwtModule.registerAsync({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      useFactory: (configService: ConfigService): any => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY', '60m') ?? '60m',
          //refreshIn: configService.get<string>('JWT_REFRESH_EXPIRY', '7d') ?? '7d',
        },
      }),
      inject: [ConfigService],
      global: true,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}
