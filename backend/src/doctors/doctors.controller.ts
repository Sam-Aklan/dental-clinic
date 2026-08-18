import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiNoContentResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { Role } from '../generated/prisma/enums';
import {
  CreateDoctorDto,
  CreateScheduleOverrideDto,
  DoctorResponseDto,
  PublicDoctorResponseDto,
  ScheduleOverrideResponseDto,
  UpdateDoctorDto,
  UpdateScheduleOverrideDto,
} from './dto';
import { DoctorsService } from './doctors.service';

@ApiTags('doctors')
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'List doctors' })
  @ApiResponse({ status: 200, type: PublicDoctorResponseDto, isArray: true })
  findAll(@CurrentUser() currentUser?: AuthenticatedUser) {
    return this.doctorsService.findAll(currentUser?.role === Role.ADMIN);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a doctor profile by id' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: DoctorResponseDto })
  @ApiResponse({ status: 404 })
  findOne(@Param('id') id: string, @CurrentUser() currentUser?: AuthenticatedUser) {
    return this.doctorsService.findOne(id, currentUser?.role === Role.ADMIN);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a doctor account' })
  @ApiBody({ type: CreateDoctorDto })
  @ApiResponse({ status: 201, type: DoctorResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 409 })
  create(@Body() dto: CreateDoctorDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.doctorsService.create(dto, currentUser);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a doctor profile' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateDoctorDto })
  @ApiResponse({ status: 200, type: DoctorResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.doctorsService.update(id, dto, currentUser);
  }

  @Get(':id/schedule-overrides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List doctor schedule overrides' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, type: ScheduleOverrideResponseDto, isArray: true })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  listOverrides(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.doctorsService.listScheduleOverrides(id, currentUser);
  }

  @Post(':id/schedule-overrides')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a schedule override' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: CreateScheduleOverrideDto })
  @ApiResponse({ status: 201, type: ScheduleOverrideResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  createOverride(@Param('id') id: string, @Body() dto: CreateScheduleOverrideDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.doctorsService.createScheduleOverride(id, dto, currentUser);
  }

  @Patch(':id/schedule-overrides/:overrideId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a schedule override' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'overrideId' })
  @ApiBody({ type: UpdateScheduleOverrideDto })
  @ApiResponse({ status: 200, type: ScheduleOverrideResponseDto })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  updateOverride(@Param('id') id: string, @Param('overrideId') overrideId: string, @Body() dto: UpdateScheduleOverrideDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.doctorsService.updateScheduleOverride(id, overrideId, dto, currentUser);
  }

  @Delete(':id/schedule-overrides/:overrideId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a schedule override' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'overrideId' })
  @ApiNoContentResponse({ description: 'Deleted successfully' })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  async deleteOverride(@Param('id') id: string, @Param('overrideId') overrideId: string, @CurrentUser() currentUser: AuthenticatedUser) {
    await this.doctorsService.deleteScheduleOverride(id, overrideId, currentUser);
  }
}
