import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { Role } from '../generated/prisma/enums';
import {
  AppointmentTrendResponseDto,
  AppointmentsByWeekdayResponseDto,
  BucketedRangeQueryDto,
  CancellationTrendResponseDto,
  CancellationTrendsQueryDto,
  DateRangeQueryDto,
  DoctorStatsResponseDto,
  DoctorUtilizationResponseDto,
  FollowUpResponseDto,
  FollowUpsQueryDto,
  HourlyLoadResponseDto,
  KpiSummaryResponseDto,
  MyStatsQueryDto,
  MyTrendResponseDto,
  MyTrendsQueryDto,
  StatusDistributionResponseDto,
  TodayByDoctorResponseDto,
  TodaySummaryResponseDto,
  WaitlistSummaryResponseDto,
} from './dto';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('trends')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get appointment trends' })
  @ApiResponse({ status: 200, type: AppointmentTrendResponseDto, isArray: true })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getTrends(@Query() query: BucketedRangeQueryDto) {
    return this.analyticsService.getAppointmentTrends(query);
  }

  @Get('status-distribution')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get appointment status distribution' })
  @ApiResponse({ status: 200, type: StatusDistributionResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getStatusDistribution(@Query() query: DateRangeQueryDto) {
    return this.analyticsService.getStatusDistribution(query);
  }

  @Get('doctor-utilization')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get doctor utilization' })
  @ApiResponse({ status: 200, type: DoctorUtilizationResponseDto, isArray: true })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getDoctorUtilization(@Query() query: DateRangeQueryDto) {
    return this.analyticsService.getDoctorUtilization(query);
  }

  @Get('appointments-by-weekday')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get appointments by weekday' })
  @ApiResponse({ status: 200, type: AppointmentsByWeekdayResponseDto, isArray: true })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getAppointmentsByWeekday(@Query() query: DateRangeQueryDto) {
    return this.analyticsService.getAppointmentsByWeekday(query);
  }

  @Get('cancellation-trends')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get cancellation trends' })
  @ApiResponse({ status: 200, type: CancellationTrendResponseDto, isArray: true })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getCancellationTrends(@Query() query: CancellationTrendsQueryDto) {
    return this.analyticsService.getCancellationTrends(query);
  }

  @Get('kpi-summary')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get clinic KPI summary' })
  @ApiResponse({ status: 200, type: KpiSummaryResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getKpiSummary(@Query() query: DateRangeQueryDto) {
    return this.analyticsService.getKpiSummary(query);
  }

  @Get('follow-ups')
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiOperation({ summary: 'Get follow-up candidates' })
  @ApiResponse({ status: 200, type: FollowUpResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getFollowUps(@Query() query: FollowUpsQueryDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.analyticsService.getFollowUps(query, currentUser);
  }

  @Get('waitlist-summary')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get waitlist summary' })
  @ApiResponse({ status: 200, type: WaitlistSummaryResponseDto })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getWaitlistSummary() {
    return this.analyticsService.getWaitlistSummary();
  }

  @Get('today-summary')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get today summary' })
  @ApiResponse({ status: 200, type: TodaySummaryResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getTodaySummary() {
    return this.analyticsService.getTodaySummary();
  }

  @Get('today-by-doctor')
  @Roles(Role.ADMIN, Role.RECEPTIONIST)
  @ApiOperation({ summary: 'Get today summary by doctor' })
  @ApiResponse({ status: 200, type: TodayByDoctorResponseDto, isArray: true })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getTodayByDoctor() {
    return this.analyticsService.getTodayByDoctor();
  }

  @Get('my-stats')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Get doctor personal stats' })
  @ApiResponse({ status: 200, type: DoctorStatsResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getMyStats(@Query() query: MyStatsQueryDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.analyticsService.getMyStats(query, currentUser);
  }

  @Get('my-trends')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Get doctor weekly trends' })
  @ApiResponse({ status: 200, type: MyTrendResponseDto, isArray: true })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getMyTrends(@Query() query: MyTrendsQueryDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.analyticsService.getMyTrends(query, currentUser);
  }

  @Get('my-hourly-load')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Get doctor hourly load' })
  @ApiResponse({ status: 200, type: HourlyLoadResponseDto, isArray: true })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getMyHourlyLoad(@Query() query: DateRangeQueryDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.analyticsService.getMyHourlyLoad(query, currentUser);
  }

  @Get('my-status-distribution')
  @Roles(Role.DOCTOR)
  @ApiOperation({ summary: 'Get doctor status distribution' })
  @ApiResponse({ status: 200, type: StatusDistributionResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  getMyStatusDistribution(@Query() query: DateRangeQueryDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.analyticsService.getMyStatusDistribution(query, currentUser);
  }
}
