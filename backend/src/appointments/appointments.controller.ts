import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../common/decorators/idempotency-key.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { Role } from '../generated/prisma/enums';
import { AppointmentsQueryDto, CreateAppointmentDto, RescheduleDto, SlotsQueryDto, UpdateNotesDto, UpdateStatusDto } from './dto';
import { AppointmentsService } from './appointments.service';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('slots')
  @UseGuards(OptionalJwtAuthGuard)
  @Public()
  @ApiOperation({ summary: 'Get available slots' })
  @ApiResponse({ status: 200 })
  getSlots(@Query() query: SlotsQueryDto, @CurrentUser() currentUser?: AuthenticatedUser) {
    return this.appointmentsService.getSlots(query, currentUser);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PATIENT, Role.RECEPTIONIST, Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create an appointment' })
  @ApiBody({ type: CreateAppointmentDto })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 401 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 409 })
  create(@Body() dto: CreateAppointmentDto, @CurrentUser() currentUser: AuthenticatedUser, @IdempotencyKey() idempotencyKey: string) {
    return this.appointmentsService.createAppointment(dto, currentUser, idempotencyKey);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.RECEPTIONIST, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment status' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 422 })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.appointmentsService.updateStatus(id, dto, currentUser);
  }

  @Patch(':id/notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DOCTOR, Role.RECEPTIONIST, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update appointment notes' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateNotesDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  updateNotes(@Param('id') id: string, @Body() dto: UpdateNotesDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.appointmentsService.updateNotes(id, dto, currentUser);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reschedule an appointment' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: RescheduleDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  reschedule(@Param('id') id: string, @Body() dto: RescheduleDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.appointmentsService.reschedule(id, dto, currentUser);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an appointment' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 204 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  delete(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.appointmentsService.deleteAppointment(id, currentUser);
  }

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECEPTIONIST, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export appointments as CSV' })
  @ApiResponse({ status: 200 })
  async export(@Query() query: AppointmentsQueryDto, @CurrentUser() currentUser: AuthenticatedUser, @Res() res: Response) {
    const csv = await this.appointmentsService.exportToCsv(query, currentUser);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="appointments.csv"');
    res.status(HttpStatus.OK).send(csv);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List appointments' })
  @ApiResponse({ status: 200 })
  list(@Query() query: AppointmentsQueryDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.appointmentsService.getAppointments(query, currentUser);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one appointment' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  getOne(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.appointmentsService.getAppointment(id, currentUser);
  }
}
