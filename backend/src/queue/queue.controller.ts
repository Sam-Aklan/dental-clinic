import { Body, Controller, HttpCode, HttpStatus, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DateTime } from 'luxon';
import { decode } from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../generated/prisma/enums';
import { IssueKioskTokenDto, KioskTokenResponseDto } from './dto';
import { KioskTokenService } from './kiosk-token.service';

@ApiTags('queue')
@Controller('queue')
export class QueueController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kioskTokenService: KioskTokenService,
    private readonly configService: ConfigService,
  ) {}

  @Post('kiosk-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Issue a kiosk token for a lobby display' })
  @ApiBody({ type: IssueKioskTokenDto })
  @ApiResponse({ status: 201, type: KioskTokenResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  async issueKioskToken(@Body() dto: IssueKioskTokenDto): Promise<KioskTokenResponseDto> {
    const doctor = await this.prisma.doctorProfile.findUnique({ where: { id: dto.doctorId }, select: { id: true } });
    if (!doctor) {
      throw new NotFoundException('doctor_not_found');
    }

    const expiresInDays = dto.expiresInDays ?? Number(this.configService.get('KIOSK_TOKEN_DEFAULT_EXPIRY_DAYS') ?? 30);
    const token = this.kioskTokenService.sign(doctor.id, expiresInDays);
    const decoded = decode(token) as { exp?: number } | null;
    const frontendUrl = (this.configService.get<string>('FRONTEND_URL') ?? '').replace(/\/$/, '');

    return {
      token,
      doctorId: doctor.id,
      expiresAt: decoded?.exp ? DateTime.fromSeconds(decoded.exp).toUTC().toISO() ?? new Date().toISOString() : new Date().toISOString(),
      lobbyUrl: `${frontendUrl}/lobby/${doctor.id}?kt=${encodeURIComponent(token)}`,
    };
  }
}
