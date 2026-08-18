import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseArrayPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { Role } from '../generated/prisma/enums';
import {
  ClinicConfigResponseDto,
  CreateHolidayDto,
  HolidayResponseDto,
  UpdateClinicConfigDto,
  WorkingHourDto,
  WorkingHourResponseDto,
} from './dto';
import { ClinicConfigService } from './clinic-config.service';

@ApiTags('clinic-config')
@Controller('clinic-config')
export class ClinicConfigController {
  constructor(private readonly clinicConfigService: ClinicConfigService) {}

  @Get()
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get the clinic configuration' })
  @ApiResponse({ status: 200, type: ClinicConfigResponseDto })
  getConfig(): Promise<ClinicConfigResponseDto> {
    return this.clinicConfigService.getConfig();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update the clinic configuration' })
  @ApiBody({ type: UpdateClinicConfigDto })
  @ApiResponse({ status: 200, type: ClinicConfigResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  updateConfig(@Body() dto: UpdateClinicConfigDto, @CurrentUser() currentUser?: AuthenticatedUser): Promise<ClinicConfigResponseDto> {
    return this.clinicConfigService.updateConfig(dto, currentUser);
  }

  @Get('working-hours')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get weekly working hours' })
  @ApiResponse({ status: 200, type: WorkingHourResponseDto, isArray: true })
  getWorkingHours(): Promise<WorkingHourResponseDto[]> {
    return this.clinicConfigService.getWorkingHours();
  }

  @Patch('working-hours')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Replace weekly working hours' })
  @ApiBody({ type: WorkingHourDto, isArray: true })
  @ApiResponse({ status: 200, type: WorkingHourResponseDto, isArray: true })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  replaceWorkingHours(
    @Body(new ParseArrayPipe({ items: WorkingHourDto, whitelist: true, forbidNonWhitelisted: true }))
    dtos: WorkingHourDto[],
    @CurrentUser() currentUser?: AuthenticatedUser,
  ): Promise<WorkingHourResponseDto[]> {
    return this.clinicConfigService.replaceWorkingHours(dtos, currentUser);
  }

  @Get('holidays')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get holiday closures' })
  @ApiResponse({ status: 200, type: HolidayResponseDto, isArray: true })
  getHolidays(): Promise<HolidayResponseDto[]> {
    return this.clinicConfigService.getHolidays();
  }

  @Post('holidays')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a holiday closure' })
  @ApiBody({ type: CreateHolidayDto })
  @ApiResponse({ status: 201, type: HolidayResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 409 })
  createHoliday(@Body() dto: CreateHolidayDto, @CurrentUser() currentUser?: AuthenticatedUser): Promise<HolidayResponseDto> {
    return this.clinicConfigService.createHoliday(dto, currentUser);
  }

  @Delete('holidays/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a holiday closure' })
  @ApiParam({ name: 'id' })
  @ApiNoContentResponse({ description: 'Deleted successfully' })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  async deleteHoliday(@Param('id') id: string, @CurrentUser() currentUser?: AuthenticatedUser): Promise<void> {
    await this.clinicConfigService.deleteHoliday(id, currentUser);
  }
}
