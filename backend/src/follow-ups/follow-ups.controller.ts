import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../common/decorators/idempotency-key.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { Role } from '../generated/prisma/enums';
import { CancelFollowUpDto, CreateFollowUpDto, FollowUpsQueryDto, UpdateFollowUpDto, UpdateFollowUpStatusDto } from './dto';
import { FollowUpsService } from './follow-ups.service';

@ApiTags('follow-ups')
@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a follow-up' })
  @ApiBody({ type: CreateFollowUpDto })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  create(@Body() dto: CreateFollowUpDto, @CurrentUser() currentUser: AuthenticatedUser, @IdempotencyKey() idempotencyKey: string) {
    return this.followUpsService.create(dto, currentUser, idempotencyKey);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List follow-ups' })
  @ApiResponse({ status: 200 })
  list(@Query() query: FollowUpsQueryDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.followUpsService.list(query, currentUser);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a follow-up' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  getOne(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.followUpsService.getOne(id, currentUser);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a follow-up' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateFollowUpDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  update(@Param('id') id: string, @Body() dto: UpdateFollowUpDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.followUpsService.update(id, dto, currentUser);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update follow-up status' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateFollowUpStatusDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  @ApiResponse({ status: 422 })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateFollowUpStatusDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.followUpsService.updateStatus(id, dto, currentUser);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a follow-up' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: CancelFollowUpDto })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 400 })
  @ApiResponse({ status: 403 })
  @ApiResponse({ status: 404 })
  @ApiResponse({ status: 409 })
  cancel(@Param('id') id: string, @Body() dto: CancelFollowUpDto, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.followUpsService.cancel(id, dto, currentUser);
  }
}
